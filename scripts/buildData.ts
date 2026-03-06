import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const hashPath = path.join(rootDir, 'data', 'raw', 'doc.sha256');

function run(scriptName: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('npm', ['run', scriptName], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });

    child.on('exit', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script failed: ${scriptName}`));
      }
    });

    child.on('error', reject);
  });
}

async function readHashDigest(): Promise<string | null> {
  const content = await readFile(hashPath, 'utf8').catch(() => null);

  if (!content) {
    return null;
  }

  const digest = content.trim().split(/\s+/)[0];
  return digest || null;
}

async function main() {
  const hasFetchFlag = process.argv.includes('--fetch');
  const hasParseFlag = process.argv.includes('--parse');

  const shouldFetch = hasFetchFlag || !hasParseFlag;
  const shouldParse = hasParseFlag || !hasFetchFlag;

  let hashBeforeFetch: string | null = null;
  let hashAfterFetch: string | null = null;

  if (shouldFetch) {
    hashBeforeFetch = await readHashDigest();
    await run('fetch:doc');
    hashAfterFetch = await readHashDigest();
  }

  if (shouldParse) {
    if (shouldFetch && hashBeforeFetch && hashAfterFetch && hashBeforeFetch === hashAfterFetch) {
      console.log('build:data no-op (doc.sha256 unchanged, skipped parse/enrich)');
      return;
    }

    await run('parse:doc');
    await run('enrich:data');
    await run('validate:data');
  }

  if (shouldFetch && !shouldParse) {
    console.log('build:data complete (fetch only)');
    return;
  }

  if (!shouldFetch && shouldParse) {
    console.log('build:data complete (parse/enrich only)');
    return;
  }

  console.log('build:data complete');
}

main();
