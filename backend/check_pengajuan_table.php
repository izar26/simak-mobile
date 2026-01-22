<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "\n--- CHECKING TABLE: pengajuan_perubahan_siswas ---\n";

// Cek tipe kolom 'status'
$columns = DB::select("DESCRIBE pengajuan_perubahan_siswas");
foreach ($columns as $col) {
    if ($col->Field === 'status') {
        echo "Column: status\n";
        echo "Type: " . $col->Type . "\n";
        echo "Null: " . $col->Null . "\n";
    }
}

