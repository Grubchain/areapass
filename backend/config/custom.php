<?php

use Illuminate\Support\Facades\File;

return [
    'secret_pem' => env("SECRET_PEM"),
    'GRUBCHAIN_ISS' => env('GRUBCHAIN_ISS'),
    'GRUBCHAIN_KID' => env('GRUBCHAIN_KID'),
    'TOKENIZER_KID' => env('TOKENIZER_KID'),
    'GRUBCHAIN_AUD' => env('GRUBCHAIN_AUD'),
    'GRUBCHAIN_SCOPE' => env('GRUBCHAIN_SCOPE'),
    'GRUBCHAIN_HMAC_SECRET' => env('GRUBCHAIN_HMAC_SECRET'),
    'GRUBCHAIN_WEBHOOK_KEY' => env('GRUBCHAIN_WEBHOOK_KEY'),
];
