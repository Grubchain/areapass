<?php

use Illuminate\Support\Facades\File;

return [
    'secret_pem' => base_path('secret.pem'),
    'GRUBCHAIN_ISS' => env('GRUBCHAIN_ISS'),
    'GRUBCHAIN_KID' => env('GRUBCHAIN_KID'),
    'GRUBCHAIN_AUD' => env('GRUBCHAIN_AUD'),
    'GRUBCHAIN_SCOPE' => env('GRUBCHAIN_SCOPE'),
];
