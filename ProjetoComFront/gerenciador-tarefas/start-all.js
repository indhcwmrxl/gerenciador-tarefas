#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
};

const services = [
  {
    name: 'users',
    dir: 'users-service',
    cmd: 'node',
    args: ['src/index.js'],
    color: colors.cyan,
    port: 3001,
  },
  {
    name: 'notifications',
    dir: 'notifications-service',
    cmd: 'node',
    args: ['src/index.js'],
    color: colors.yellow,
    port: 3002,
  },
  {
    name: 'tasks',
    dir: 'tasks-service',
    cmd: 'node',
    args: ['src/index.js'],
    color: colors.green,
    port: 3000,
  },
  {
    name: 'frontend',
    dir: 'frontend',
    cmd: 'npx',
    args: ['vite', '--host'],
    color: colors.magenta,
    port: 5173,
  },
];

console.log(`\n${colors.bold}${colors.magenta}======================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   TaskFlow • Iniciando Todos os Serviços Localmente   ${colors.reset}`);
console.log(`${colors.bold}${colors.magenta}======================================================${colors.reset}`);
console.log(`\n${colors.bold}Portas e Serviços:${colors.reset}`);
console.log(`  ${colors.magenta}● Frontend UI:${colors.reset}          http://localhost:5173`);
console.log(`  ${colors.green}● tasks-service:${colors.reset}        http://localhost:3000`);
console.log(`  ${colors.cyan}● users-service:${colors.reset}        http://localhost:3001`);
console.log(`  ${colors.yellow}● notifications-service:${colors.reset}http://localhost:3002`);
console.log(`\n${colors.dim}Pressione CTRL+C a qualquer momento para parar todos os serviços.${colors.reset}\n`);

const children = [];

services.forEach((s) => {
  const cwd = path.join(__dirname, s.dir);
  const proc = spawn(s.cmd, s.args, {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env },
  });

  const prefix = `${s.color}[${s.name}]${colors.reset} `;

  proc.stdout.on('data', (chunk) => {
    const lines = chunk.toString().trim().split('\n');
    lines.forEach((line) => {
      if (line.trim()) console.log(prefix + line);
    });
  });

  proc.stderr.on('data', (chunk) => {
    const lines = chunk.toString().trim().split('\n');
    lines.forEach((line) => {
      // Filtrar avisos de depreciação do pg-connection-string para manter saída limpa
      if (line.includes('SECURITY WARNING: The SSL modes')) return;
      if (line.includes('In the next major version')) return;
      if (line.includes('To prepare for this change:')) return;
      if (line.includes('uselibpqcompat=true')) return;
      if (line.includes('See https://www.postgresql.org')) return;
      if (line.trim()) console.error(`${colors.red}[${s.name}:err]${colors.reset} ${line}`);
    });
  });

  proc.on('close', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}[${s.name}] Encerrado com código ${code}${colors.reset}`);
    }
  });

  children.push(proc);
});

function cleanup() {
  console.log(`\n${colors.yellow}Encerrando todos os serviços...${colors.reset}`);
  children.forEach((c) => {
    try {
      c.kill('SIGTERM');
    } catch (_) {}
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
