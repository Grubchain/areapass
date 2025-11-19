<?php

namespace HiEvents\Http\Actions\Orders\Payment\Grubchain;

use HiEvents\Http\Actions\BaseAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\File;
use Psr\Log\LoggerInterface;

class GetPaymentIntentActionPublicHeaders extends BaseAction
{
    public function __construct(
        private readonly LoggerInterface       $logger,
    )
    {
    }
    public function __invoke(Request $request): JsonResponse
    {
        $kid = config('custom.GRUBCHAIN_KID');
        $base64Secret = config('custom.GRUBCHAIN_HMAC_SECRET');

        if (empty($kid) || empty($base64Secret)) {
            throw new \RuntimeException('Missing HMAC credentials (kid/secret).');
        }

        // === 2) Generate timestamp + nonce ===
        $ts    = (string) time();                 // seconds since epoch
        $nonce = bin2hex(random_bytes(16));       // 16 bytes → 32-char hex

        // === 3) Body Digest ===
        $tempRawBody = $request->json()->all();
        $rawBody = json_encode($tempRawBody["raw_body"]);
        $method = $tempRawBody["method"];
        $url = $tempRawBody["url"];

        $shaHex = hash('sha256', $rawBody);
        $bodyDigest = 'sha256=' . $shaHex;

        // === 4) Canonical Path + Sorted Query ===
        $path = self::canonicalPath($url);

        // === 5) Canonical String ===
        $canonical = implode("\n", [
            $ts,
            $nonce,
            strtoupper($method),
            $path,
            $shaHex,
            '',  // trailing newline as in JS array join
        ]);

        // === 6) Calculate HMAC Signature (hex) ===
        $key = base64_decode($base64Secret, true);
        if ($key === false) {
            throw new \RuntimeException('Invalid base64 HMAC secret');
        }

        // false → output hex string (same as CryptoJS .toString(crypto.enc.Hex))
        $signature = hash_hmac('sha256', $canonical, $key, false);

        // === 7) Headers ===
        return $this->jsonResponse([
            'X-HMAC-VERSION'     => 'v1',
            'X-HMAC-ALG'         => 'HMAC-SHA256',
            'X-HMAC-KID'         => $kid,
            'X-HMAC-TS'          => $ts,
            'X-HMAC-NONCE'       => $nonce,
            'X-HMAC-BODY-DIGEST' => $bodyDigest,
            'X-HMAC-SIGNATURE'   => $signature,
        ]);
    }

    /**
     * Build canonical path with sorted, encoded query string.
     *
     * @param  string  $url
     * @return string
     */
    protected static function canonicalPath(string $url): string
    {
        $parts = parse_url($url);

        $path = $parts['path'] ?? '/';
        $query = $parts['query'] ?? '';

        if ($query === '') {
            return $path;
        }

        $entries = [];

        // Manually split to preserve duplicates similar to URLSearchParams
        foreach (explode('&', $query) as $pair) {
            if ($pair === '') {
                continue;
            }

            $kv = explode('=', $pair, 2);
            $k = urldecode($kv[0]);
            $v = isset($kv[1]) ? urldecode($kv[1]) : '';

            $entries[] = [$k, $v];
        }

        // Sort by key (a.localeCompare(b))
        usort($entries, function ($a, $b) {
            return strcmp($a[0], $b[0]);
        });

        $qs = implode('&', array_map(function ($entry) {
            [$k, $v] = $entry;
            return rawurlencode($k) . '=' . rawurlencode($v);
        }, $entries));

        return $qs ? ($path . '?' . $qs) : $path;
    }
}

