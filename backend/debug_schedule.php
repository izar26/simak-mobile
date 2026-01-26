<?php

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "--- DEBUG JADWAL HARI INI ---
";

// 1. Get a sample student user using DB Facade
// We look for a user in 'penggunas' who has a linked 'peserta_didik_id'
$user = DB::table('penggunas')->whereNotNull('peserta_didik_id')->first();

if (!$user) {
    die("Error: No user with siswa data found in 'penggunas' table.\n");
}

$siswa = DB::table('siswas')->where('id', $user->peserta_didik_id)->first();

if (!$siswa) {
    die("Error: Data siswa tidak ditemukan untuk pengguna ini (ID: {$user->id}).\n");
}

echo "Siswa: " . $siswa->nama . " (ID: " . $siswa->id . ")\n";
echo "Rombel ID Siswa: " . ($siswa->rombongan_belajar_id ?? 'NULL') . "\n";

if (!$siswa->rombongan_belajar_id) {
    die("Error: Siswa tidak punya rombel.\n");
}

// 2. Check Active Tapel
$tapel = DB::table('tapel')->where('is_active', 1)->first();
if (!$tapel) {
    die("Error: Tidak ada Tapel (Tahun Pelajaran) aktif.\n");
}
echo "Tapel Aktif: " . $tapel->tahun_ajaran . " (Semester: " . $tapel->semester . ", Kode: " . $tapel->kode_tapel . ")\n";

// 3. Check Rombel
$rombelSiswa = DB::table('rombels')
    ->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)
    ->orderBy('id', 'desc')
    ->first();

if (!$rombelSiswa) {
    die("Error: Data Rombel tidak ditemukan di tabel rombels berdasarkan rombongan_belajar_id siswa.\n");
}
echo "Rombel Siswa: " . $rombelSiswa->nama . "\n";

// 4. Find all Rombel IDs for this Name & Semester
$rombelIds = DB::table('rombels')
    ->where('nama', $rombelSiswa->nama)
    ->where('semester_id', $tapel->kode_tapel)
    ->pluck('id');

echo "Rombel IDs (matching Name & Semester): " . $rombelIds->implode(', ') . "\n";

if ($rombelIds->isEmpty()) {
    die("Error: Tidak ada ID Rombel yang cocok untuk semester ini.\n");
}

// 5. Check Day and Jam Pelajaran
$hariRaw = Carbon::now()->format('l');
$daysMap = [
    'Monday' => 'Senin',
    'Tuesday' => 'Selasa',
    'Wednesday' => 'Rabu',
    'Thursday' => 'Kamis',
    'Friday' => 'Jumat',
    'Saturday' => 'Sabtu',
    'Sunday' => 'Minggu',
];
$hari = $daysMap[$hariRaw] ?? $hariRaw;

echo "Hari Ini: " . $hariRaw . " => " . $hari . "\n";

$allJam = DB::table('jam_pelajarans')
    ->where('hari', $hari)
    ->orderBy('jam_mulai')
    ->get();

echo "Jumlah Slot Jam: " . $allJam->count() . "\n";

if ($allJam->isEmpty()) {
    echo "Warning: Tidak ada slot jam pelajaran untuk hari $hari.\n";
    // Check other days just in case
    $checkOther = DB::table('jam_pelajarans')->select('hari')->distinct()->pluck('hari');
    echo "Hari yang tersedia di DB: " . $checkOther->implode(', ') . "\n";
} else {
    foreach($allJam as $jam) {
        echo " - Slot: " . $jam->jam_mulai . " - " . $jam->jam_selesai . " (" . $jam->tipe . ")\n";
    }
}

// 6. Check Jadwal Mapel
if ($allJam->isNotEmpty()) {
    $jadwalMapel = DB::table('jadwal_pelajarans')
        ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
        ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
        ->whereIn('jadwal_pelajarans.rombel_id', $rombelIds)
        ->whereIn('jadwal_pelajarans.jam_pelajaran_id', $allJam->pluck('id'))
        ->select(
            'jadwal_pelajarans.jam_pelajaran_id',
            'pembelajarans.nama_mata_pelajaran as mapel',
            'gtks.nama as guru'
        )
        ->get();
    
    echo "Jumlah Mapel Terjadwal: " . $jadwalMapel->count() . "\n";
    
    foreach($jadwalMapel as $mapel) {
        echo " - Mapel: " . $mapel->mapel . " (Guru: " . $mapel->guru . ") di Jam ID: " . $mapel->jam_pelajaran_id . "\n";
    }

    if ($jadwalMapel->isEmpty()) {
        echo "Info: Slot jam ada, tapi tidak ada mapel yang dijadwalkan untuk Rombel ID ini di Jam-jam tersebut.\n";
        
        // Debugging deeper: Check any jadwal for this rombel regardless of time
        $anyJadwal = DB::table('jadwal_pelajarans')->whereIn('rombel_id', $rombelIds)->count();
        echo "Total jadwal untuk rombel ini (semua hari/jam): " . $anyJadwal . "\n";
    }
}

echo "--- END DEBUG ---
";