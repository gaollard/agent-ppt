import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'js-yaml';

export function resolveLogDir(): string {
  if (process.env.LOG_DIR) {
    return process.env.LOG_DIR;
  }

  const configPath =
    process.env.CONFIG_PATH ?? join(process.cwd(), 'dev.config.yaml');

  if (existsSync(configPath)) {
    const parsed = yaml.load(readFileSync(configPath, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const logDir = (parsed as Record<string, unknown>).log_dir;
      if (typeof logDir === 'string' && logDir.trim()) {
        return logDir;
      }
    }
  }

  return join(process.cwd(), 'logs');
}
