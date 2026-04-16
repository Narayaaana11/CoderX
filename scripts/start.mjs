import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

function parseBindingsFromEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return [];
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const bindings = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) {
      continue;
    }

    const eqIndex = line.indexOf('=');

    if (eqIndex <= 0) {
      continue;
    }

    const name = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!name) {
      continue;
    }

    bindings.push('--binding', `${name}=${value}`);
  }

  return bindings;
}

const args = ['pages', 'dev', './build/client', ...parseBindingsFromEnvFile('.env.local')];
const isWindows = process.platform === 'win32';
const wranglerPath = isWindows
  ? join(process.cwd(), 'node_modules', '.bin', 'wrangler.cmd')
  : join(process.cwd(), 'node_modules', '.bin', 'wrangler');
const command = isWindows ? process.env.comspec || 'cmd.exe' : wranglerPath;
const commandArgs = isWindows ? ['/d', '/s', '/c', wranglerPath, ...args] : args;

const child = spawn(command, commandArgs, {
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('Failed to launch Wrangler:', error.message);
  process.exit(1);
});
