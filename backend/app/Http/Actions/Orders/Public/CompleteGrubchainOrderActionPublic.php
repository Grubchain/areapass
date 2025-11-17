<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Orders\Public;

use HiEvents\Exceptions\ResourceConflictException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Order\CompleteOrderRequest;
use HiEvents\Resources\Order\OrderResourcePublic;
use HiEvents\Services\Application\Handlers\Order\CompleteOrderHandler;
use HiEvents\Services\Application\Handlers\Order\DTO\CompleteOrderDTO;
use HiEvents\Services\Application\Handlers\Order\DTO\CompleteOrderOrderDTO;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\File;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class CompleteGrubchainOrderActionPublic extends BaseAction
{
    public function __construct(private readonly CompleteOrderHandler $orderService) {}

    public function __invoke(CompleteOrderRequest $request, int $eventId, string $orderShortId, string $jwt): JsonResponse
    {
        try {
            if (!$jwt) {
                return $this->errorResponse("Bad Request", Response::HTTP_BAD_REQUEST);
            }
            // $keyId = config('custom.GRUBCHAIN_KID');
            // $scope = config('custom.GRUBCHAIN_SCOPE');
            // $iss = config('custom.GRUBCHAIN_ISS');
            // $aud = config('custom.GRUBCHAIN_AUD');
            // $privateKey = File::get(config('custom.secret_pem'));
            // $decoded = JWT::decode($jwt,new Key($keyId, 'RS256'));

            // if (!$decoded || $decoded['iss']!=$iss) {
            //     return $this->errorResponse("Bad Request", Response::HTTP_BAD_REQUEST);
            // }
            $order = $this->orderService->handleGrubchain($orderShortId, CompleteOrderDTO::fromArray([
                'order' => CompleteOrderOrderDTO::fromArray([
                    'first_name' => $request->validated('order.first_name'),
                    'last_name' => $request->validated('order.last_name'),
                    'email' => $request->validated('order.email'),
                    'address' => $request->validated('order.address'),
                    'questions' => $request->has('order.questions')
                        ? $request->input('order.questions')
                        : null,
                ]),
                'products' => $request->input('products'),
            ]));
        } catch (ResourceConflictException $e) {
            return $this->errorResponse($e->getMessage(), Response::HTTP_CONFLICT);
        }

        return $this->resourceResponse(OrderResourcePublic::class, $order);
    }
}
