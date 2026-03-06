import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Contest, ContestsFile, NotesFile } from '../src/lib/types';

type ExtractOgImage = (websiteUrl: string) => Promise<string | null>;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function readJson<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

function stableSortContests(contests: Contest[]): Contest[] {
  return [...contests].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? a.date : '';
    const dateB = typeof b.date === 'string' ? b.date : '';

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const nameA = a.name;
    const nameB = b.name;

    if (nameA !== nameB) {
      return nameA.localeCompare(nameB, 'ko');
    }

    return a.id.localeCompare(b.id);
  });
}

function stableSortNotes(notes: string[]): string[] {
  return [...notes].sort((a, b) => a.localeCompare(b, 'ko'));
}

function pickWebsite(contest: Contest): string | undefined {
  const rawLinks = contest.links as Record<string, unknown> | undefined;
  if (typeof contest.links?.website === 'string' && contest.links.website) {
    return contest.links.website;
  }

  const official = rawLinks?.official;
  return typeof official === 'string' && official ? official : undefined;
}

function pickPoster(contest: Contest): string | undefined {
  const rawMedia = contest.media as Record<string, unknown> | undefined;
  if (typeof contest.media?.poster === 'string' && contest.media.poster) {
    return contest.media.poster;
  }

  const imageUrl = rawMedia?.imageUrl;
  return typeof imageUrl === 'string' && imageUrl ? imageUrl : undefined;
}

function normalizeContest(contest: Contest): Contest {
  const website = pickWebsite(contest);
  const poster = pickPoster(contest);

  return {
    id: contest.id,
    name: contest.name,
    sport: contest.sport,
    date: contest.date,
    endDate: contest.endDate,
    status: contest.status,
    registration: contest.registration,
    links:
      website || contest.links?.registration || contest.links?.results
        ? {
            website,
            registration: contest.links?.registration,
            results: contest.links?.results
          }
        : undefined,
    media:
      poster || contest.media?.thumbnail
        ? {
            poster,
            thumbnail: contest.media?.thumbnail
          }
        : undefined,
    notes: contest.notes,
    updatedAt: contest.updatedAt
  };
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
  const ogMatch = html.match(
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i
  );

  if (!ogMatch?.[1]) {
    return null;
  }

  return new URL(ogMatch[1], officialUrl).toString();
}

export async function enrichContestsFile(
  contestsPayload: ContestsFile,
  generatedAt = new Date().toISOString(),
  extractOgImage: ExtractOgImage = tryExtractOgImage
): Promise<{ contestsFile: ContestsFile; notesFile: NotesFile }> {
  const sortedContests = stableSortContests(contestsPayload.contests.map(normalizeContest));

  for (const contest of sortedContests) {
    const website = pickWebsite(contest);

    if (!website) {
      continue;
    }

    contest.media = contest.media ?? {};

    try {
      contest.media.poster = (await extractOgImage(website)) ?? contest.media.poster;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`[enrich] OG image extraction failed for ${contest.id}: ${reason}`);
    }
  }

  const notes = stableSortNotes(
    sortedContests.map((contest) => `${contest.name || contest.id} is queued for enrichment.`)
  );

  const contestsOutput: ContestsFile = {
    meta: {
      generatedAt,
      version: contestsPayload.meta.version
    },
    contests: sortedContests
  };

  const notesOutput: NotesFile = {
    meta: {
      generatedAt,
      version: 1
    },
    notes
  };

  return {
    contestsFile: contestsOutput,
    notesFile: notesOutput
  };
}

async function main() {
  const contestsPath = path.join(rootDir, 'data', 'contests.json');
  const notesPath = path.join(rootDir, 'data', 'notes.json');

  const contestsPayload = await readJson<ContestsFile>(contestsPath);
  const { contestsFile, notesFile } = await enrichContestsFile(contestsPayload);

  await writeFile(contestsPath, `${JSON.stringify(contestsFile, null, 2)}\n`, 'utf8');
  await writeFile(notesPath, `${JSON.stringify(notesFile, null, 2)}\n`, 'utf8');

  console.log(
    `enrich complete (contests=${contestsFile.contests.length}, notes=${notesFile.notes.length})`
  );
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';

if (import.meta.url === entry) {
  main();
}
