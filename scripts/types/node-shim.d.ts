declare module 'node:*';

declare const process: {
  env: Record<string, string | undefined>;
  argv: string[];
  platform: string;
  exitCode?: number;
};
declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
};
declare const Buffer: {
  from(input: string, encoding?: string): { toString(encoding?: string): string };
};
declare function fetch(input: string | URL, init?: Record<string, unknown>): Promise<Response>;
declare class URL {
  constructor(url: string, base?: string);
  toString(): string;
}
declare class URLSearchParams {
  constructor(init?: string | Record<string, string> | string[][]);
}
declare interface Response {
  ok: boolean;
  status: number;
  statusText: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface ImportMeta {
  url: string;
}
