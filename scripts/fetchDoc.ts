import { createHash, createSign } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const rawDir = path.join(rootDir, 'data', 'raw');
const docPath = path.join(rawDir, 'doc.txt');
const hashPath = path.join(rawDir, 'doc.sha256');
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseServiceAccount(rawJson: string): ServiceAccount {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: failed to parse JSON.');
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !("client_email" in parsed) ||
    !("private_key" in parsed) ||
    typeof parsed.client_email !== 'string' ||
    typeof parsed.private_key !== 'string'
  ) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON: missing client_email/private_key fields.');
  }

  return parsed as ServiceAccount;
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt(serviceAccount: ServiceAccount): string {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';

  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: DRIVE_SCOPE,
      aud: tokenUri,
      iat: now,
      exp: now + 3600
    })
  );

  const toSign = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(toSign);
  signer.end();

  const signature = signer
    .sign(serviceAccount.private_key)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${toSign}.${signature}`;
}

function summarizeResponseBody(text: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > 300 ? `${compact.slice(0, 300)}...` : compact;
}

async function assertOkResponse(response: Response, label: string): Promise<void> {
  if (!response.ok) {
    const body = await response.text().catch(() => '<failed to read response body>');
    const summary = summarizeResponseBody(body || '<empty response body>');
    throw new Error(`${label} failed (HTTP ${response.status} ${response.statusText}): ${summary}`);
  }
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const tokenUri = serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token';
  const jwt = signJwt(serviceAccount);

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  await assertOkResponse(response, 'OAuth token request');

  const json = (await response.json()) as { access_token?: string };
  if (!json.access_token) {
    throw new Error('OAuth token request succeeded but response did not include access_token.');
  }

  return json.access_token;
}

async function downloadDocumentText(fileId: string, accessToken: string): Promise<string> {
  const exportUrl = new URL(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export`);
  exportUrl.searchParams.set('mimeType', 'text/plain');

  const response = await fetch(exportUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  await assertOkResponse(response, 'Drive files.export');
  return response.text();
}

async function main() {
  const serviceAccountJson = getRequiredEnv('GOOGLE_SERVICE_ACCOUNT_JSON');
  const fileId = getRequiredEnv('GOOGLE_DOC_FILE_ID');
  const serviceAccount = parseServiceAccount(serviceAccountJson);

  await mkdir(rawDir, { recursive: true });

  const accessToken = await getAccessToken(serviceAccount);
  const docContent = await downloadDocumentText(fileId, accessToken);

  await writeFile(docPath, docContent, 'utf8');

  const digest = createHash('sha256').update(docContent, 'utf8').digest('hex');
  await writeFile(hashPath, `${digest}  data/raw/doc.txt\n`, 'utf8');

  console.log('fetchDoc complete');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
