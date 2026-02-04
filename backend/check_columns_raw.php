<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Database: " . DB::connection()->getDatabaseName() . "\n";
    
    $columns = DB::select('SHOW COLUMNS FROM siswas');
    
    $targets = ['pendidikan_ayah_id_str', 'pendidikan_ibu_id_str', 'pendidikan_wali_id_str'];
    $found = [];
    
    foreach ($columns as $col) {
        $colName = $col->Field ?? $col->name ?? $col->column_name;
        if (in_array($colName, $targets)) {
            $found[] = $colName;
        }
    }

    echo "Ditemukan kolom target: " . implode(", ", $found) . "\n";
    
    if (count($found) !== count($targets)) {
        echo "PERINGATAN: Beberapa kolom tidak ditemukan!\n";
        $missing = array_diff($targets, $found);
        echo "Hilang: " . implode(", ", $missing) . "\n";
    } else {
        echo "SEMUA KOLOM LENGKAP.\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}