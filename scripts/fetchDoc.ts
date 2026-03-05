import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const rawDir = path.join(rootDir, 'data', 'raw');
const docPath = path.join(rawDir, 'doc.txt');
const hashPath = path.join(rawDir, 'doc.sha256');

async function main() {
  await mkdir(rawDir, { recursive: true });

  const existingContent = await readFile(docPath, 'utf8').catch(() => '');
  await writeFile(docPath, existingContent, 'utf8');

  const digest = createHash('sha256').update(existingContent, 'utf8').digest('hex');
  await writeFile(hashPath, `${digest}  data/raw/doc.txt\n`, 'utf8');

  console.log('fetchDoc complete');
}

main();
