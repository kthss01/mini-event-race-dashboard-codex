import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Contest, ContestStatus, ContestsFile, Registration } from '../src/lib/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MONTH_HEADER_REGEX = /^(\d{2,4})년\s*(\d{1,2})월/;
const DATE_LINE_REGEX = /(\d{2})\.(\d{1,2})\.(\d{1,2})(?:\s*~\s*((?:\d{2}\.)?\d{1,2}(?:\.\d{1,2})?))?/;

const NOISE_TOKENS = [
  /^[-–—•·*]+$/,
  /^\[[^\]]+\]$/,
  /^\([^)]*\)$/,
  /^접수$/,
  /^신청$/,
  /^입금$/,
  /^결제$/,
  /^paid$/i,
  /^환불$/,
  /^취소$/,
  /^불참$/,
  /^미신청$/
];

function normalizeLine(line: string): string {
  return line.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim();
}

function toFullYear(rawYear: number): number {
  if (rawYear >= 1000) {
    return rawYear;
  }

  return rawYear >= 70 ? 1900 + rawYear : 2000 + rawYear;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function asDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseEndDate(startYear: number, startMonth: number, rangeToken: string): string | undefined {
  const clean = rangeToken.trim();
  const fullParts = clean.split('.').map((part) => Number(part));

  if (fullParts.length === 3) {
    const [yy, month, day] = fullParts;

    if ([yy, month, day].some((value) => Number.isNaN(value))) {
      return undefined;
    }

    return asDate(toFullYear(yy), month, day);
  }

  if (fullParts.length === 2) {
    const [month, day] = fullParts;

    if ([month, day].some((value) => Number.isNaN(value))) {
      return undefined;
    }

    const endYear = month < startMonth ? startYear + 1 : startYear;
    return asDate(endYear, month, day);
  }

  return undefined;
}

function cleanName(raw: string): string {
  const text = raw
    .replace(/^[\s:：,，./-]+/, '')
    .replace(/[|｜]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const keptTokens = text
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !NOISE_TOKENS.some((pattern) => pattern.test(token)));

  return keptTokens.join(' ').trim();
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

  return slug || 'untitled';
}

function mapStatusAndRegistration(line: string, date: string): { status: ContestStatus; registration?: Registration } {
  const lower = line.toLowerCase();
  const registration: Registration = {};

  if (/취소/.test(line)) {
    registration.cancelledAt = date;
    return { status: 'cancelled', registration };
  }

  if (/불참/.test(line)) {
    return { status: 'no_show' };
  }

  if (/미신청/.test(line)) {
    return { status: 'not_applied' };
  }

  if (/환불/.test(line)) {
    registration.refundedAt = date;
    return { status: 'refunded', registration };
  }

  if (/입금|결제|paid/.test(lower)) {
    registration.paymentDue = date;
    return { status: 'paid', registration };
  }

  if (/접수|신청/.test(line)) {
    if (/마감|종료/.test(line)) {
      registration.closes = date;
      return { status: 'registration_closed', registration };
    }

    registration.opens = date;
    return { status: 'registration_open', registration };
  }

  return { status: 'scheduled' };
}

function isLikelyAmbiguous(name: string): boolean {
  if (name.length < 2) {
    return true;
  }

  return /^메모|공지|참고$/.test(name);
}

async function main() {
  const rawDocPath = path.join(rootDir, 'data', 'raw', 'doc.txt');
  const contestsPath = path.join(rootDir, 'data', 'contests.json');
  const notesPath = path.join(rootDir, 'data', 'notes.json');

  const doc = await readFile(rawDocPath, 'utf8').catch(() => '');

  const contests: Contest[] = [];
  const looseNotes: string[] = [];
  const idCounts = new Map<string, number>();

  let contextYear: number | undefined;
  let contextMonth: number | undefined;

  for (const rawLine of doc.split('\n')) {
    const line = normalizeLine(rawLine);

    if (!line) {
      continue;
    }

    const monthMatch = line.match(MONTH_HEADER_REGEX);

    if (monthMatch) {
      contextYear = toFullYear(Number(monthMatch[1]));
      contextMonth = Number(monthMatch[2]);
      continue;
    }

    const dateMatch = line.match(DATE_LINE_REGEX);

    if (!dateMatch) {
      looseNotes.push(line);
      continue;
    }

    const yearPart = Number(dateMatch[1]);
    const monthPart = Number(dateMatch[2]);
    const dayPart = Number(dateMatch[3]);

    const startYear = contextYear ?? toFullYear(yearPart);
    const startMonth = monthPart || contextMonth;

    if (!startMonth) {
      looseNotes.push(line);
      continue;
    }

    const date = asDate(startYear, startMonth, dayPart);
    const endDate = dateMatch[4] ? parseEndDate(startYear, startMonth, dateMatch[4]) : undefined;

    const matchStart = dateMatch.index ?? 0;
    const tailText = line.slice(matchStart + dateMatch[0].length).trim();
    const cleanedName = cleanName(tailText);
    const { status, registration } = mapStatusAndRegistration(line, date);

    const memoBits = tailText
      .split(/[,/|]/)
      .map((piece) => piece.trim())
      .filter(Boolean)
      .filter((piece) => !cleanedName.includes(piece) || piece.length > cleanedName.length);

    if (!cleanedName || isLikelyAmbiguous(cleanedName)) {
      looseNotes.push(line);
      continue;
    }

    const baseId = `${date}_${slugify(cleanedName)}`;
    const duplicateCount = idCounts.get(baseId) ?? 0;
    idCounts.set(baseId, duplicateCount + 1);
    const id = duplicateCount === 0 ? baseId : `${baseId}-${duplicateCount + 1}`;

    contests.push({
      id,
      name: cleanedName,
      date,
      endDate,
      status,
      registration,
      notes: memoBits,
      updatedAt: new Date().toISOString()
    });
  }

  const contestsFile: ContestsFile = {
    meta: {
      generatedAt: new Date().toISOString(),
      version: 1
    },
    contests
  };

  await writeFile(contestsPath, JSON.stringify(contestsFile, null, 2) + '\n', 'utf8');

  await writeFile(
    notesPath,
    JSON.stringify(
      {
        meta: {
          generatedAt: new Date().toISOString(),
          version: 1
        },
        notes: looseNotes
      },
      null,
      2
    ) + '\n',
    'utf8'
  );

  console.log(`parseDoc complete (contests=${contests.length}, notes=${looseNotes.length})`);
}

main();
