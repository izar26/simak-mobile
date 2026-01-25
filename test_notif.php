<?php
require __DIR__.'/backend/vendor/autoload.php';
$app = require_once __DIR__.'/backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Siswa;
use App\Models\PengajuanPerubahanSiswa;
use Carbon\Carbon;

// Simulasi user login (Siswa ID 988)
$siswa = Siswa::find(988);

if (!$siswa) {
    echo "Siswa tidak ditemukan\n";
    exit;
}

echo "Siswa: " . $siswa->nama . "\n";

$notifikasi = PengajuanPerubahanSiswa::where('siswa_id', $siswa->id)
    ->orderBy('updated_at', 'desc')
    ->get()
    ->map(function ($item) {
        $title = 'Pengajuan Perubahan Data';
        $message = 'Pengajuan Anda sedang diproses.';
        $type = 'info';

        if ($item->status === 'disetujui') {
            $title = 'Pengajuan Disetujui ✅';
            $message = 'Selamat! Perubahan data profil Anda telah disetujui oleh operator.';
            $type = 'success';
        } elseif ($item->status === 'ditolak') {
            $title = 'Pengajuan Ditolak ❌';
            $message = 'Maaf, pengajuan Anda ditolak. ' . ($item->catatan_operator ? 'Alasan: ' . $item->catatan_operator : 'Silakan hubungi sekolah.');
            $type = 'error';
        }

        return [
            'id' => $item->id,
            'title' => $title,
            'message' => $message,
            'status' => $item->status,
            'type' => $type
        ];
    });

print_r($notifikasi->toArray());

