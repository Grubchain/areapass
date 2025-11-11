import crypto from 'crypto-js';
import { URL } from 'url';

export type HmacKey = { kid: string; secret: string }; // secret = hex/base64; here we use raw utf8

function sha256Hex(buf: Buffer | string) {
    return crypto.createHash('sha256').update(buf).digest('hex');
}

export function normalizeQuery(u: URL) {
    const pairs = [...u.searchParams.entries()].sort(([ak, av], [bk, bv]) =>
        ak.localeCompare(bk) || av.localeCompare(bv));
    const qs = pairs.map(([k, v]) => `${k}=${v}`).join('&');
    return qs ? `${u.pathname}?${qs}` : u.pathname;
}

export function buildCanonical(opts: {
    ts: string; nonce: string; method: string; pathWithQuery: string; bodyDigestHex: string;
}) {
    return `${opts.ts}\n${opts.nonce}\n${opts.method.toUpperCase()}\n${opts.pathWithQuery}\n${opts.bodyDigestHex}\n`;
}

export function signRequest({
    url, method, body, key,
}: { url: string; method: string; body?: Buffer | string; key: HmacKey }) {
    const u = new URL(url);
    const ts = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomUUID();
    const raw = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body)) : Buffer.alloc(0);
    const bodyDigestHex = sha256Hex(raw);
    const canonical = buildCanonical({ ts, nonce, method, pathWithQuery: normalizeQuery(u), bodyDigestHex });

    const mac = crypto.createHmac('sha256', key.secret).update(canonical).digest('hex');

    const headers = {
        'X-HMAC-Version': 'v1',
        'X-HMAC-Alg': 'HMAC-SHA256',
        'X-HMAC-Kid': key.kid,
        'X-HMAC-Ts': ts,
        'X-HMAC-Nonce': nonce,
        'X-HMAC-Body-Digest': `sha256=${bodyDigestHex}`,
        'X-HMAC-Signature': mac,
    };
    return { headers, rawBody: raw };
}