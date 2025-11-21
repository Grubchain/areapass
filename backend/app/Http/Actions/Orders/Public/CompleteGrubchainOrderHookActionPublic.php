<?php

declare(strict_types=1);

namespace HiEvents\Http\Actions\Orders\Public;

use HiEvents\Exceptions\ResourceConflictException;
use HiEvents\Http\Actions\BaseAction;
use HiEvents\Http\Request\Order\CompleteOrderRequest;
use HiEvents\Resources\Order\OrderResourcePublic;
use HiEvents\Services\Application\Handlers\Order\CompleteOrderHandler;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Psy\Util\Str;
use Symfony\Component\HttpFoundation\Response;

class CompleteGrubchainOrderHookActionPublic extends BaseAction
{
    public function __construct(private readonly CompleteOrderHandler $orderService) {}

    public function __invoke(string $orderShortId, string $key, string $timestamp): JsonResponse
    {
        try {
            $isOlderThan15Minutes = Carbon::createFromTimestamp($timestamp)
                ->lt(Carbon::now()->subMinutes(15));
            //  if the request is older than 15 minutes, fail
            if ($isOlderThan15Minutes) {
                return $this->errorResponse("Bad Request", Response::HTTP_BAD_REQUEST);
            }
            //  if the webhook key is different fail
            $envKey = config('custom.GRUBCHAIN_WEBHOOK_KEY');
            $decodedKey = base64_decode($key);
            if ($decodedKey !== $envKey) {
                return $this->errorResponse("Bad Request", Response::HTTP_BAD_REQUEST);
            }

            $order = $this->orderService->handleGrubchainWebhook($orderShortId);
        } catch (ResourceConflictException $e) {
            return $this->errorResponse($e->getMessage(), Response::HTTP_CONFLICT);
        }

        return $this->resourceResponse(OrderResourcePublic::class, $order);
    }
}
