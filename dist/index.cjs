'use strict';

const { existsSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const rootDir = join(__dirname, '..');
const serverEntry = join(__dirname, 'index.js');

if (!existsSync(serverEntry)) {
  console.log('Production bundle missing; running npm run build before start.');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import(pathToFileURL(serverEntry).href).catch((error) => {
  console.error(error);
  process.exit(1);
});
