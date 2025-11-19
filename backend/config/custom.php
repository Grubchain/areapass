<?php

use Illuminate\Support\Facades\File;

return [
    'secret_pem' => base_path(env("SECRET_PEM")),
    'GRUBCHAIN_ISS' => env('GRUBCHAIN_ISS'),
    'GRUBCHAIN_KID' => env('GRUBCHAIN_KID'),
    'GRUBCHAIN_AUD' => env('GRUBCHAIN_AUD'),
    'GRUBCHAIN_SCOPE' => env('GRUBCHAIN_SCOPE'),
    'GRUBCHAIN_HMAC_SECRET' => env('GRUBCHAIN_HMAC_SECRET'),
];
