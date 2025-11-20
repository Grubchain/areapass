<?php

namespace HiEvents\Http\Actions\Orders\Payment\Grubchain;

use HiEvents\Http\Actions\BaseAction;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\File;
use Psr\Log\LoggerInterface;

class CreatePaymentIntentActionPublicJwt extends BaseAction
{
    public function __construct(
        private readonly LoggerInterface       $logger,
    )
    {
    }

    public function __invoke(int $eventId, string $orderShortId, string $intent): JsonResponse
    {
        $jwtToken = '';
        $keyId = config('custom.TOKENIZER_KID');
        $scope = $intent == "client_secrets" ? "tokenize:card" : config('custom.GRUBCHAIN_SCOPE');
        $iss = config('custom.GRUBCHAIN_ISS');
        $aud = config('custom.GRUBCHAIN_AUD');

        try {
            $now = time();
            $rawPKey = config('custom.secret_pem');
            $privateKey = str_replace('\\n', "\n", $rawPKey);

            $header = ['alg' => 'RS256', 'typ' => 'JWT'];
            if ($keyId) {
                $header['kid'] = $keyId;
            }
            $payload = [
                'iss' => $iss,
                'aud' => $aud,
                'sub' => 'grubchain',
                'scope' => $scope,
                'iat' => $now,
                'nbf' => $now - 5,
                'exp' => $now + 60,
                'jti' => bin2hex(random_bytes(16)),
            ];

            $jwtToken = JWT::encode($payload, $privateKey, 'RS256', $keyId, $header);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage(), Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        return $this->jsonResponse([
            'jwt_token' => $jwtToken
        ]);
    }
}
