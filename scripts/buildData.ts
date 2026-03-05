import { spawn } from 'node:child_process';

function run(scriptName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', scriptName], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed: ${scriptName}`));
      }
    });

    child.on('error', reject);
  });
}

async function main() {
  await run('fetch:doc');
  await run('parse:doc');
  await run('enrich:data');
  console.log('build:data complete');
}

main();
