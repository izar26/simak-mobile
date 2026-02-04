<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

try {
    echo "Database: " . DB::connection()->getDatabaseName() . "
";
    
    // Ambil data pengajuan
    $data = DB::table('pengajuan_perubahan_siswas')->limit(5)->get();
    
    echo "Jumlah Data: " . $data->count() . "
";
    
    foreach ($data as $item) {
        echo "ID: " . $item->id . " | SiswaID: " . $item->siswa_id . " | Status: '" . $item->status . "'
";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
