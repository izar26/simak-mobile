<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    // Ambil satu pengguna yang punya peserta_didik_id
    $pengguna = \Illuminate\Support\Facades\DB::table('penggunas')
        ->whereNotNull('peserta_didik_id')
        ->first();

    if ($pengguna) {
        // Ambil data siswa berdasarkan ID tersebut
        $siswa = \Illuminate\Support\Facades\DB::table('siswas')
            ->where('peserta_didik_id', $pengguna->peserta_didik_id)
            ->first();
        
        echo "DATA PENGGUNA:\n";
        echo json_encode($pengguna, JSON_PRETTY_PRINT) . "\n\n";
        echo "DATA SISWA:\n";
        echo json_encode($siswa, JSON_PRETTY_PRINT);
    } else {
        echo "Tidak ditemukan pengguna dengan peserta_didik_id.";
        // Cek struktur tabel siswas saja
        $siswa = \Illuminate\Support\Facades\DB::table('siswas')->first();
        echo "\n\nCONTOH DATA SISWA:\n";
        echo json_encode($siswa, JSON_PRETTY_PRINT);
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}

