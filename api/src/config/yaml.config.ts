import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

const DEFAULT_CONFIG_PATH = join(process.cwd(), 'dev.config.yaml');

export function loadYamlConfig(): Record<string, unknown> {
  const configPath = process.env.CONFIG_PATH ?? DEFAULT_CONFIG_PATH;

  if (!existsSync(configPath)) {
    throw new Error(
      `Config file not found: ${configPath}. Copy config.example.yaml to dev.config.yaml`,
    );
  }

  const parsed = yaml.load(readFileSync(configPath, 'utf8'));

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`Invalid YAML config: ${configPath}`);
  }

  return parsed as Record<string, unknown>;
}
