import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface WanxTaskResponse {
  output?: {
    task_id?: string;
    task_status?: string;
    results?: Array<{ url?: string }>;
    choices?: Array<{
      message?: { content?: Array<{ image?: string }> };
    }>;
  };
}

@Injectable()
export class WanxProvider {
  private readonly logger = new Logger(WanxProvider.name);

  constructor(private readonly config: ConfigService) {}

  async generate(prompt: string): Promise<Buffer> {
    const apiKey =
      this.config.get<string>('wanx_api_key') ??
      this.config.get<string>('llm_api_key');
    const model =
      this.config.get<string>('wanx_model') ?? 'wan2.5-t2i-preview';
    const baseUrl = (
      this.config.get<string>('wanx_base_url') ??
      'https://dashscope.aliyuncs.com/api/v1'
    ).replace(/\/$/, '');

    if (!apiKey) {
      throw new Error('wanx_api_key is not configured');
    }

    console.log('generate image with prompt: ', prompt);

    const { data: created } = await axios.post<WanxTaskResponse>(
      `${baseUrl}/services/aigc/text2image/image-synthesis`,
      {
        model,
        input: { prompt },
        parameters: { size: '1280*720', n: 1 },
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'X-DashScope-Async': 'enable',
        },
        timeout: 30_000,
      },
    );

    const taskId = created.output?.task_id;
    if (!taskId) {
      throw new Error('Wanx did not return task_id');
    }

    const imageUrl = await this.pollTask(baseUrl, apiKey, taskId);
    const { data: imageData } = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30_000,
    });

    return Buffer.from(imageData);
  }

  private async pollTask(
    baseUrl: string,
    apiKey: string,
    taskId: string,
  ): Promise<string> {
    const deadline = Date.now() + 90_000;

    while (Date.now() < deadline) {
      const { data } = await axios.get<WanxTaskResponse>(
        `${baseUrl}/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 15_000,
        },
      );

      const status = data.output?.task_status;
      if (status === 'SUCCEEDED') {
        const url =
          data.output?.results?.[0]?.url ??
          data.output?.choices?.[0]?.message?.content?.[0]?.image;
        if (url) return url;
        throw new Error('Wanx task succeeded but no image URL');
      }
      if (status === 'FAILED' || status === 'CANCELED') {
        throw new Error(`Wanx task ${status}`);
      }

      await new Promise((r) => setTimeout(r, 3_000));
    }

    this.logger.warn(`Wanx task ${taskId} timed out`);
    throw new Error('Wanx task timed out');
  }
}
