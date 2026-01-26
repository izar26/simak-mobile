<?php

use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DEBUG ROMBEL SISWA ---
";

// 1. Ambil Siswa (Contoh: Siti Anisa / User yang login)
$user = DB::table('penggunas')->whereNotNull('peserta_didik_id')->first();
$siswa = DB::table('siswas')->where('id', $user->peserta_didik_id)->first();

echo "Siswa: " . $siswa->nama . "\n";
echo "Peserta Didik ID: " . $siswa->peserta_didik_id . "\n";

// 2. Tapel Aktif
$tapel = DB::table('tapel')->where('is_active', 1)->first();
echo "Tapel Aktif: " . $tapel->kode_tapel . "\n";

// 3. Cari Rombel berdasarkan Nama (Cara Lama)
$rombelSiswa = DB::table('rombels')->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)->orderBy('id', 'desc')->first();
echo "Rombel Induk (by ID): " . ($rombelSiswa->nama ?? 'TIDAK KETEMU') . "\n";

if ($rombelSiswa) {
    $idsLama = DB::table('rombels')
        ->where('nama', $rombelSiswa->nama)
        ->where('semester_id', $tapel->kode_tapel)
        ->pluck('id');
    echo "IDs (Cara Lama - By Name): " . $idsLama->implode(', ') . "\n";
}

// 4. Cari Rombel berdasarkan Anggota (Cara Baru - Usulan)
$rombelsBaru = DB::table('rombels')
    ->where('semester_id', $tapel->kode_tapel)
    ->where('anggota_rombel', 'like', '%' . $siswa->peserta_didik_id . '%')
    ->get();

echo "IDs (Cara Baru - By Member): \n";
if ($rombelsBaru->isEmpty()) {
    echo " - Tidak ditemukan rombel yang memuat siswa ini di anggota_rombel.\n";
} else {
    foreach($rombelsBaru as $r) {
        echo " - ID: $r->id | Nama: $r->nama | Jenis: $r->jenis_rombel_str\n";
    }
}

