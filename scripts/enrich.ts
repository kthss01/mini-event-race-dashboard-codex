import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ContestRecord = {
  id: string;
  name?: string;
  title?: string;
  date?: string;
  year?: number;
  links?: {
    official?: string;
    [key: string]: unknown;
  };
  media?: {
    imageUrl?: string | null;
    [key: string]: unknown;
  };
  searchQuery?: string;
  [key: string]: unknown;
};

type ContestsFile = {
  meta?: {
    generatedAt?: string;
    version?: number;
    [key: string]: unknown;
  };
  contests: ContestRecord[];
};

type NotesFile = {
  meta?: {
    generatedAt?: string;
    version?: number;
    [key: string]: unknown;
  };
  notes: Array<{ contestId: string; note: string }>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function stableSortContests(contests: ContestRecord[]): ContestRecord[] {
  return [...contests].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : '';
    const dateB = typeof b.date === 'string' ? b.date : '';

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const nameA = (a.title ?? a.name ?? '').toString();
    const nameB = (b.title ?? b.name ?? '').toString();

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, 'ko');
    }

    return a.id.localeCompare(b.id);
  });
}

function stableSortNotes(notes: Array<{ contestId: string; note: string }>): Array<{ contestId: string; note: string }> {
  return [...notes].sort((a, b) => {
    if (a.contestId !== b.contestId) {
      return a.contestId.localeCompare(b.contestId);
    }

    return a.note.localeCompare(b.note, 'ko');
  });
}

function deriveYear(contest: ContestRecord): number | undefined {
  if (typeof contest.year === 'number' && Number.isInteger(contest.year)) {
    return contest.year;
  }

  if (typeof contest.date === 'string') {
    const match = contest.date.match(/^(\d{4})-/);

    if (match) {
      return Number(match[1]);
    }
  }

  return undefined;
}

async function tryExtractOgImage(officialUrl: string): Promise<string | null> {
  const response = await fetch(officialUrl, {
    headers: {
      'User-Agent': 'mini-event-race-dashboard-codex/1.0 (+og-image-fetch)'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i);

  if (!ogMatch?.[1]) {
    return null;
  }

  return new URL(ogMatch[1], officialUrl).toString();
}

async function main() {
  const contestsPath = path.join(rootDir, 'data', 'contests.json');
  const notesPath = path.join(rootDir, 'data', 'notes.json');

  const contestsPayload = await readJson<ContestsFile>(contestsPath);
  const sortedContests = stableSortContests(contestsPayload.contests);

  for (const contest of sortedContests) {
    const title = contest.title ?? contest.name ?? '';
    const year = deriveYear(contest);

    if (!contest.links?.official && !contest.searchQuery && title && year) {
      contest.searchQuery = `${title} ${year}`;
    }

    if (contest.links?.official) {
      contest.media = contest.media ?? {};

      try {
        contest.media.imageUrl = await tryExtractOgImage(contest.links.official);
      } catch (error) {
        contest.media.imageUrl = null;
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`[enrich] OG image extraction failed for ${contest.id}: ${reason}`);
      }
    }
  }

  const notes = stableSortNotes(
    sortedContests.map((contest) => ({
      contestId: contest.id,
      note: `${contest.title ?? contest.name ?? contest.id} is queued for enrichment.`
    }))
  );

  const now = new Date().toISOString();
  const contestsOutput: ContestsFile = {
    meta: {
      ...(contestsPayload.meta ?? {}),
      generatedAt: now,
      version: typeof contestsPayload.meta?.version === 'number' ? contestsPayload.meta.version : 1
    },
    contests: sortedContests
  };

  const notesOutput: NotesFile = {
    meta: {
      generatedAt: now,
      version: 1
    },
    notes
  };

  await writeFile(contestsPath, `${JSON.stringify(contestsOutput, null, 2)}\n`, 'utf8');
  await writeFile(notesPath, `${JSON.stringify(notesOutput, null, 2)}\n`, 'utf8');

  console.log(`enrich complete (contests=${sortedContests.length}, notes=${notes.length})`);
}

main();
