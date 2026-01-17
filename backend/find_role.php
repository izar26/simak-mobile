<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    $roles = \Illuminate\Support\Facades\DB::table('penggunas')
        ->select('peran_id_str')
        ->distinct()
        ->where('peran_id_str', 'like', '%Didik%')
        ->orWhere('peran_id_str', 'like', '%Siswa%')
        ->get();
    echo json_encode($roles, JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
