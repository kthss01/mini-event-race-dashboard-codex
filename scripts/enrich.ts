import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function main() {
  const contestsPath = path.join(rootDir, 'data', 'contests.json');
  const notesPath = path.join(rootDir, 'data', 'notes.json');

  const contestsPayload = JSON.parse(await readFile(contestsPath, 'utf8')) as {
    contests: Array<{ id: string; name: string }>;
  };

  const notes = contestsPayload.contests.map((contest) => ({
    contestId: contest.id,
    note: `${contest.name} is queued for enrichment.`
  }));

  await writeFile(
    notesPath,
    JSON.stringify(
      {
        meta: {
          generatedAt: new Date().toISOString(),
          version: 1
        },
        notes
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log('enrich complete');
}

main();
