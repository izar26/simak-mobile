<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

$columns = Schema::getColumnListing('siswas');
$targets = ['nik_ayah', 'nik_ibu', 'nik_wali'];

echo "Mengecek kolom di tabel 'siswas'...
";
foreach ($targets as $col) {
    if (in_array($col, $columns)) {
        echo "[ADA] $col
";
    } else {
        echo "[TIDAK ADA] $col
";
    }
}
