<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Siswa;
use App\Models\PengajuanPerubahanSiswa;

// Ambil siswa ID 988 (dari log tinker sebelumnya)
$siswa = Siswa::find(988);

if ($siswa) {
    echo "Siswa ditemukan: " . $siswa->nama . "\n";
    
    // Create Pending Request
    $pengajuan = PengajuanPerubahanSiswa::create([
        'siswa_id' => $siswa->id,
        'data_perubahan' => ['nama' => 'Test Manual Pending'],
        'status' => 'pending',
        'keterangan' => 'Inject via script'
    ]);
    
    echo "Berhasil buat pengajuan ID: " . $pengajuan->id . " dengan status: " . $pengajuan->status . "\n";
} else {
    echo "Siswa ID 988 tidak ditemukan.\n";
}

