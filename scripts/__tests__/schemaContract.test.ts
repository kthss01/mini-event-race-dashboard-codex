import assert from 'node:assert/strict';
import test from 'node:test';
import type { Contest, ContestsFile, NoteItem, NotesFile } from '../../src/lib/types';
import { parseDocText } from '../parseDoc';
import { enrichContestsFile } from '../enrich';
import { normalizeNotesFile } from '../notesContract';

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

function isNoteItemShape(value: unknown): value is NoteItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const note = value as Record<string, unknown>;
  return (
    typeof note.id === 'string' &&
    typeof note.message === 'string' &&
    (note.source === 'parse' || note.source === 'enrich' || note.source === 'migration') &&
    typeof note.createdAt === 'string' &&
    (typeof note.contestId === 'undefined' || typeof note.contestId === 'string')
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
    file.notes.every(isNoteItemShape)
  );
}

test('parse만 수행했을 때 NotesFile 계약을 만족한다', () => {
  const doc = ['2024년 10월', '24.10.01 서울마라톤 신청', '운영 메모: 행사장 주차 협소'].join('\n');

  const result = parseDocText(doc, FIXED_NOW);

  assert.equal(isContestsFileShape(result.contestsFile), true);
  assert.equal(isNotesFileShape(result.notesFile), true);
  assert.equal(result.notesFile.notes[0]?.source, 'parse');
});

test('parse+enrich를 수행해도 NotesFile 계약을 유지한다', async () => {
  const doc = ['2024년 10월', '24.10.01 서울마라톤 신청', '운영 메모: 행사장 주차 협소'].join('\n');
  const parsed = parseDocText(doc, FIXED_NOW);

  const { contestsFile, notesFile } = await enrichContestsFile(
    parsed.contestsFile,
    FIXED_NOW,
    async (websiteUrl) => `${websiteUrl}/og.png`,
    parsed.notesFile
  );

  assert.equal(isContestsFileShape(contestsFile), true);
  assert.equal(isNotesFileShape(notesFile), true);
  assert.equal(
    notesFile.notes.some((note) => note.source === 'parse'),
    true
  );
  assert.equal(
    notesFile.notes.some((note) => note.source === 'enrich'),
    true
  );
});

test('레거시 notes.json(string[])을 마이그레이션 규칙으로 변환한다', () => {
  const migrated = normalizeNotesFile(
    {
      meta: {
        generatedAt: FIXED_NOW,
        version: 1
      },
      notes: ['기존 문자열 메모']
    },
    FIXED_NOW
  );

  assert.equal(isNotesFileShape(migrated), true);
  assert.equal(migrated.notes[0]?.source, 'migration');
  assert.equal(migrated.notes[0]?.id, 'migration-note-1');
});
