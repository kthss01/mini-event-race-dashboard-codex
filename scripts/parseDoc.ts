import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  const rawDocPath = path.join(rootDir, 'data', 'raw', 'doc.txt');
  const contestsPath = path.join(rootDir, 'data', 'contests.json');

  const doc = await readFile(rawDocPath, 'utf8').catch(() => '');
  const contests = doc
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((name, index) => ({ id: `contest-${index + 1}`, name }));

  await writeFile(
    contestsPath,
    JSON.stringify(
      {
        meta: {
          generatedAt: new Date().toISOString(),
          version: 1
        },
        contests
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log('parseDoc complete');
}

main();
