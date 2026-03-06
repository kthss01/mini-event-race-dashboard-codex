import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parseDocText } from '../parseDoc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');
const FIXED_NOW = '2024-01-01T00:00:00.000Z';

async function loadFixture(name: string): Promise<string> {
  return readFile(path.join(fixturesDir, `${name}.txt`), 'utf8');
}

test('월 컨텍스트 전환을 반영한다', async () => {
  const doc = await loadFixture('month-context-switch');
  const { contestsFile } = parseDocText(doc, FIXED_NOW);

  assert.equal(contestsFile.contests.length, 2);
  assert.equal(contestsFile.contests[0].date, '2024-09-03');
  assert.equal(contestsFile.contests[1].date, '2024-10-01');
});

test('단일 날짜와 기간 날짜를 파싱한다', async () => {
  const doc = await loadFixture('single-and-range-date');
  const { contestsFile } = parseDocText(doc, FIXED_NOW);

  assert.equal(contestsFile.contests[0].date, '2024-11-02');
  assert.equal(contestsFile.contests[0].endDate, undefined);
  assert.equal(contestsFile.contests[1].date, '2024-11-30');
  assert.equal(contestsFile.contests[1].endDate, '2024-12-02');
});

test('상태 키워드를 매핑한다', async () => {
  const doc = await loadFixture('status-mapping');
  const { contestsFile } = parseDocText(doc, FIXED_NOW);

  assert.deepEqual(
    contestsFile.contests.map((contest) => contest.status),
    ['paid', 'refunded', 'cancelled', 'no_show', 'not_applied']
  );

  assert.equal(contestsFile.contests[0].registration?.paymentDue, '2024-10-01');
  assert.equal(contestsFile.contests[1].registration?.refundedAt, '2024-10-02');
  assert.equal(contestsFile.contests[2].registration?.cancelledAt, '2024-10-03');
});

test('메모를 분리한다', async () => {
  const doc = await loadFixture('memo-split');
  const { contestsFile } = parseDocText(doc, FIXED_NOW);

  assert.equal(contestsFile.contests[0].name, '서울마라톤');
  assert.deepEqual(contestsFile.contests[0].notes, ['[칩지참]']);
});

test('중복 항목에 대해 stable id를 생성한다', async () => {
  const doc = await loadFixture('stable-id');
  const { contestsFile } = parseDocText(doc, FIXED_NOW);

  assert.deepEqual(
    contestsFile.contests.map((contest) => contest.id),
    ['2024-10-05_동일대회', '2024-10-05_동일대회-2', '2024-10-05_동일대회-3']
  );
});
