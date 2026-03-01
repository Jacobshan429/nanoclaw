import fs from 'fs';
import path from 'path';
import { logger } from './logger.js';

/**
 * Parse the .env file and return values for the requested keys.
 * Does NOT load anything into process.env — callers decide what to
 * do with the values. This keeps secrets out of the process environment
 * so they don't leak to child processes.
 */
export function readEnvFile(keys: string[]): Record<string, string> {
  const envFile = path.join(process.cwd(), '.env');
  let content: string;
  try {
    content = fs.readFileSync(envFile, 'utf-8');
  } catch (err) {
    logger.debug({ err }, '.env file not found, using defaults');
    return {};
  }

  const result: Record<string, string> = {};
  const wanted = new Set(keys);

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    if (!wanted.has(key)) continue;
    let value = trimmed.slice(eqIdx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value) result[key] = value;
  }

  return result;
}

/**
 * Update or add key-value pairs in the .env file.
 * Existing keys are replaced in-place; new keys are appended.
 * Writes atomically (temp file + rename).
 */
export function updateEnvFile(updates: Record<string, string>): void {
  const validKey = /^[A-Z_][A-Z0-9_]*$/;
  for (const key of Object.keys(updates)) {
    if (!validKey.test(key)) {
      throw new Error(`Invalid env key: "${key}"`);
    }
  }

  const envFile = path.join(process.cwd(), '.env');
  let lines: string[] = [];
  try {
    lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  } catch {
    // File doesn't exist yet — start fresh
  }

  const remaining = new Set(Object.keys(updates));

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) return line;
    const key = trimmed.slice(0, eqIdx).trim();
    if (remaining.has(key)) {
      remaining.delete(key);
      return `${key}=${updates[key]}`;
    }
    return line;
  });

  for (const key of remaining) {
    newLines.push(`${key}=${updates[key]}`);
  }

  const tempPath = `${envFile}.tmp`;
  fs.writeFileSync(tempPath, newLines.join('\n'));
  fs.renameSync(tempPath, envFile);
}
