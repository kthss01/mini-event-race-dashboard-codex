import assert from 'node:assert/strict';
import test from 'node:test';
import type { Contest, ContestsFile, NotesFile } from '../../src/lib/types';
import { parseDocText } from '../parseDoc';
import { enrichContestsFile } from '../enrich';

const FIXED_NOW = '2024-01-01T00:00:00.000Z';

function isContestShape(value: unknown): value is Contest {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const contest = value as Record<string, unknown>;
  return (
    typeof contest.id === 'string' &&
    typeof contest.name === 'string' &&
    typeof contest.date === 'string' &&
    typeof contest.status === 'string' &&
    Array.isArray(contest.notes) &&
    typeof contest.updatedAt === 'string'
  );
}

function isContestsFileShape(value: unknown): value is ContestsFile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const file = value as Record<string, unknown>;
  const meta = file.meta as Record<string, unknown> | undefined;

  return (
    typeof meta?.generatedAt === 'string' &&
    typeof meta?.version === 'number' &&
    Array.isArray(file.contests) &&
    file.contests.every(isContestShape)
  );
}

function isNotesFileShape(value: unknown): value is NotesFile {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const file = value as Record<string, unknown>;
  const meta = file.meta as Record<string, unknown> | undefined;

  return (
    typeof meta?.generatedAt === 'string' &&
    typeof meta?.version === 'number' &&
    Array.isArray(file.notes) &&
    file.notes.every((note) => typeof note === 'string')
  );
}

test('parse 결과가 ContestsFile/NotesFile 계약을 만족한다', () => {
  const doc = ['2024년 10월', '24.10.01 서울마라톤 신청', '24.10.02 부산런 페스티벌 환불'].join(
    '\n'
  );

  const result = parseDocText(doc, FIXED_NOW);

  assert.equal(isContestsFileShape(result.contestsFile), true);
  assert.equal(isNotesFileShape(result.notesFile), true);
});

test('enrich 결과가 필드 매핑/스키마 정책을 만족한다', async () => {
  const payload = {
    meta: {
      generatedAt: FIXED_NOW,
      version: 1
    },
    contests: [
      {
        id: '2024-10-01_legacy-keys',
        name: '레거시 필드 마이그레이션 대회',
        date: '2024-10-01',
        status: 'scheduled',
        notes: [],
        updatedAt: FIXED_NOW,
        links: {
          official: 'https://example.com/event'
        },
        media: {
          imageUrl: 'https://legacy.example.com/image.png'
        },
        title: '사용하면 안 되는 필드',
        searchQuery: '임의 필드'
      }
    ]
  } as unknown as ContestsFile;

  const { contestsFile, notesFile } = await enrichContestsFile(
    payload,
    FIXED_NOW,
    async (websiteUrl) => `${websiteUrl}/og.png`
  );

  assert.equal(isContestsFileShape(contestsFile), true);
  assert.equal(isNotesFileShape(notesFile), true);

  const contest = contestsFile.contests[0] as Contest & Record<string, unknown>;
  const links = (contest.links ?? {}) as Record<string, unknown>;
  const media = (contest.media ?? {}) as Record<string, unknown>;

  assert.equal(links.website, 'https://example.com/event');
  assert.equal(media.poster, 'https://example.com/event/og.png');
  assert.equal('title' in contest, false);
  assert.equal('searchQuery' in contest, false);
});
