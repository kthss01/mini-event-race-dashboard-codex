import assert from 'node:assert/strict';
import test from 'node:test';
import { parseServiceAccount, resolveGoogleDocFileId } from '../fetchDoc';

test('서비스 계정 private_key의 이스케이프 개행을 실제 개행으로 변환한다', () => {
  const parsed = parseServiceAccount(
    JSON.stringify({
      client_email: 'test@example.com',
      private_key: '-----BEGIN PRIVATE KEY-----\\nline2\\n-----END PRIVATE KEY-----\\n'
    })
  );

  assert.equal(parsed.private_key.includes('\\n'), false);
  assert.equal(parsed.private_key.includes('\nline2\n'), true);
});

test('문서 URL에서 파일 ID를 추출한다', () => {
  const fileId = resolveGoogleDocFileId(
    'https://docs.google.com/document/d/1AbCdEfGhIJkLmNoPqRsTuVwXyZ/edit?usp=sharing'
  );

  assert.equal(fileId, '1AbCdEfGhIJkLmNoPqRsTuVwXyZ');
});

test('드라이브 URL 쿼리에서 파일 ID를 추출한다', () => {
  const fileId = resolveGoogleDocFileId(
    'https://drive.google.com/open?id=1AbCdEfGhIJkLmNoPqRsTuVwXyZ'
  );

  assert.equal(fileId, '1AbCdEfGhIJkLmNoPqRsTuVwXyZ');
});

test('이미 파일 ID인 경우 그대로 사용한다', () => {
  assert.equal(resolveGoogleDocFileId('1AbCdEfGhIJkLmNoPqRsTuVwXyZ'), '1AbCdEfGhIJkLmNoPqRsTuVwXyZ');
});
