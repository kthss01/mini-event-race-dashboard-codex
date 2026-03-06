declare module 'node:*';

declare const process: any;
declare const console: any;
declare const Buffer: any;
declare function fetch(input: any, init?: any): Promise<any>;
declare class URL {
  constructor(url: string, base?: string);
  toString(): string;
}
declare class URLSearchParams {
  constructor(init?: any);
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
