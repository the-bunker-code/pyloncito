import { SHARE_MAX_LENGTH } from './config';

const HASH_PREFIX = '#s=';
const BASE64URL = /^[A-Za-z0-9_-]+$/;
const CHUNK = 0x8000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let start = 0; start < bytes.length; start += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(start, start + CHUNK));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function base64UrlToBytes(text: string): Uint8Array {
  const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Encodes song data as URL-safe base64 of its UTF-8 JSON. */
export function encodeSong(raw: unknown): string {
  return bytesToBase64Url(new TextEncoder().encode(JSON.stringify(raw)));
}

/** Decodes `encodeSong` output. Returns undefined for anything malformed. */
export function decodeSong(encoded: string): unknown {
  if (encoded.length === 0 || encoded.length > SHARE_MAX_LENGTH || !BASE64URL.test(encoded)) {
    return undefined;
  }
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(encoded));
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** Link to the current page carrying the whole song in the fragment (no server involved). */
export function buildShareUrl(href: string, raw: unknown): string {
  const [base = ''] = href.split('#');
  return `${base}${HASH_PREFIX}${encodeSong(raw)}`;
}

/** Payload of a `#s=` fragment, or undefined when the hash is not a song link. */
export function readShareHash(hash: string): string | undefined {
  if (!hash.startsWith(HASH_PREFIX)) return undefined;
  const payload = hash.slice(HASH_PREFIX.length);
  return payload.length > 0 ? payload : undefined;
}
