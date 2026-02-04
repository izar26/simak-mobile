<?php
require __DIR__ . '/backend/vendor/autoload.php';
$app = require_once __DIR__ . '/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Siswa;

$siswa = Siswa::where('nama', 'LIKE', '%MUHAMMAD NIZAR RAHMATULLOH%')->with('pengajuan_perubahan')->first();

if ($siswa) {
    echo "Siswa: " . $siswa->nama . "\n";
    echo "ID: " . $siswa->id . "\n";
    echo "Total Pengajuan: " . $siswa->pengajuan_perubahan->count() . "\n";
    foreach ($siswa->pengajuan_perubahan as $p) {
        echo "- ID: {$p->id} | Status: {$p->status} | Created: {$p->created_at}\n";
    }
} else {
    echo "Siswa tidak ditemukan.\n";
}

