import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ContestsFile } from '../src/lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const contestsPath = path.join(rootDir, 'data', 'contests.json');

async function main() {
  const raw = await readFile(contestsPath, 'utf8').catch(() => {
    throw new Error('validate:data failed: data/contests.json not found. Run parse/enrich first.');
  });

  let parsed: ContestsFile;

  try {
    parsed = JSON.parse(raw) as ContestsFile;
  } catch {
    throw new Error('validate:data failed: data/contests.json is not valid JSON.');
  }

  const contestCount = Array.isArray(parsed.contests) ? parsed.contests.length : 0;

  if (contestCount < 1) {
    throw new Error(
      'validate:data failed: at least one contest is required (contests.length >= 1).'
    );
  }

  console.log(`validate:data complete (contests=${contestCount})`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
