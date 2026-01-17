<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\PengajuanPerubahanSiswa;
use App\Models\BerkasSiswa;
use App\Models\Pengguna;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SiswaController extends Controller
{
    // ... lockedColumns ... (tetap sama)
    protected $lockedColumns = [
        'nama', 'nipd', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 
        'agama_id_str', 'kewarganegaraan', 'kebutuhan_khusus', 
        'tinggi_badan', 'berat_badan', 
        'nama_ayah', 'nama_ibu', 'nama_wali', 
        'pekerjaan_ayah_id_str', 'pekerjaan_ibu_id_str', 'pekerjaan_wali_id_str',
        'tahun_lahir_ayah', 'tahun_lahir_ibu', 'tahun_lahir_wali',
        'pendidikan_ayah_id_str', 'pendidikan_ibu_id_str', 'pendidikan_wali_id_str',
        'penghasilan_ayah_id_str', 'penghasilan_ibu_id_str', 'penghasilan_wali_id_str',
        'alamat_jalan'
    ];

    public function uploadBerkas(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120', // Max 5MB
            'judul' => 'required|string|max:255',
        ]);

        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
        }

        try {
            $file = $request->file('file');
            $path = $file->store('berkas_siswa', 'public');

            $berkas = BerkasSiswa::create([
                'siswa_id' => $siswa->id,
                'judul' => $request->judul,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
            ]);

            return response()->json([
                'message' => 'Berkas berhasil diupload',
                'berkas' => $berkas
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal upload berkas', 'error' => $e->getMessage()], 500);
        }
    }

    public function hapusBerkas(Request $request)
    {
        $request->validate(['id' => 'required|exists:berkas_siswas,id']);
        
        $berkas = BerkasSiswa::find($request->id);
        
        // Pastikan berkas milik siswa yang sedang login
        if ($berkas->siswa_id != $request->user()->siswa->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        try {
            if (Storage::disk('public')->exists($berkas->file_path)) {
                Storage::disk('public')->delete($berkas->file_path);
            }
            $berkas->delete();
            return response()->json(['message' => 'Berkas dihapus']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal hapus berkas'], 500);
        }
    }

    public function update(Request $request)
    {
        // ... existing update code ...
    }

    public function getJadwalHariIni(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa || !$siswa->rombongan_belajar_id) {
            return response()->json([]);
        }

        // Cari ID Rombel (BigInt) berdasarkan UUID dari siswa
        $rombel = DB::table('rombels')->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)->first();
        
        if (!$rombel) {
            return response()->json([]);
        }

        // Set locale Carbon ke Indonesia
        \Carbon\Carbon::setLocale('id');
        $hari = \Carbon\Carbon::now()->isoFormat('dddd');

        $jadwal = DB::table('jadwal_pelajarans')
            ->join('jam_pelajarans', 'jadwal_pelajarans.jam_pelajaran_id', '=', 'jam_pelajarans.id')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->where('jadwal_pelajarans.rombel_id', $rombel->id)
            ->where('jam_pelajarans.hari', $hari)
            ->select(
                'jam_pelajarans.jam_mulai',
                'jam_pelajarans.jam_selesai',
                'pembelajarans.nama_mata_pelajaran as mapel',
                'gtks.nama as guru'
            )
            ->orderBy('jam_pelajarans.jam_mulai')
            ->get();

        // Format data untuk frontend
        $formattedJadwal = $jadwal->map(function ($item) {
            $jamMulai = \Carbon\Carbon::parse($item->jam_mulai)->format('H:i');
            $jamSelesai = \Carbon\Carbon::parse($item->jam_selesai)->format('H:i');
            
            // Tentukan status
            $now = \Carbon\Carbon::now()->format('H:i');
            $status = 'Akan Datang';
            if ($now >= $jamMulai && $now <= $jamSelesai) {
                $status = 'Berlangsung';
            } elseif ($now > $jamSelesai) {
                $status = 'Selesai';
            }

            return [
                'jam' => "$jamMulai - $jamSelesai",
                'mapel' => $item->mapel,
                'guru' => $item->guru ?? 'Guru Belum Diplot',
                'status' => $status
            ];
        });

        return response()->json($formattedJadwal);
    }

    public function getJadwalMingguan(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa || !$siswa->rombongan_belajar_id) {
            return response()->json([]);
        }

        // Cari ID Rombel (BigInt) berdasarkan UUID dari siswa
        $rombel = DB::table('rombels')->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)->first();
        
        if (!$rombel) {
            return response()->json([]);
        }

        // Ambil semua hari yang ada di master jam_pelajarans (Senin, Selasa, dll)
        $masterHari = DB::table('jam_pelajarans')
            ->select('hari')
            ->distinct()
            ->orderByRaw("FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')")
            ->pluck('hari');

        $jadwal = DB::table('jadwal_pelajarans')
            ->join('jam_pelajarans', 'jadwal_pelajarans.jam_pelajaran_id', '=', 'jam_pelajarans.id')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->where('jadwal_pelajarans.rombel_id', $rombel->id)
            ->select(
                'jam_pelajarans.hari',
                'jam_pelajarans.jam_mulai',
                'jam_pelajarans.jam_selesai',
                'pembelajarans.nama_mata_pelajaran as mapel',
                'gtks.nama as guru'
            )
            ->orderBy('jam_pelajarans.jam_mulai')
            ->get();

        $grouped = $jadwal->groupBy('hari');
        
        $result = [];
        foreach ($masterHari as $h) {
            if (isset($grouped[$h])) {
                $result[$h] = $grouped[$h]->map(function ($item) {
                    return [
                        'jam' => \Carbon\Carbon::parse($item->jam_mulai)->format('H:i') . ' - ' . \Carbon\Carbon::parse($item->jam_selesai)->format('H:i'),
                        'mapel' => $item->mapel,
                        'guru' => $item->guru ?? 'Guru Belum Diplot',
                    ];
                });
            } else {
                $result[$h] = [];
            }
        }

        return response()->json($result);
    }

    public function getRekapAbsensi(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json([
                'stats' => ['Hadir' => 0, 'Sakit' => 0, 'Izin' => 0, 'Alfa' => 0],
                'history' => []
            ]);
        }

        // Hitung statistik
        $stats = DB::table('absensi_siswa')
            ->where('siswa_id', $siswa->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        // Default 0 jika tidak ada data
        $summary = [
            'Hadir' => $stats['Hadir'] ?? 0,
            'Sakit' => $stats['Sakit'] ?? 0,
            'Izin' => $stats['Izin'] ?? 0,
            'Alfa' => $stats['Alfa'] ?? 0,
        ];

        // Ambil history harian
        $history = DB::table('absensi_siswa')
            ->where('siswa_id', $siswa->id)
            ->orderBy('tanggal', 'desc')
            ->limit(30)
            ->get();

        // Ambil history mapel
        $historyMapel = DB::table('absensi_mapel')
            ->join('jadwal_pelajarans', 'absensi_mapel.jadwal_pelajaran_id', '=', 'jadwal_pelajarans.id')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->where('absensi_mapel.siswa_id', $siswa->id)
            ->select(
                'absensi_mapel.tanggal',
                'absensi_mapel.status',
                'pembelajarans.nama_mata_pelajaran as mapel',
                'gtks.nama as guru'
            )
            ->orderBy('absensi_mapel.tanggal', 'desc')
            ->limit(30)
            ->get();

        // Get Active Tapel
        $tapel = DB::table('tapel')->where('is_active', 1)->first();

        return response()->json([
            'stats' => $summary,
            'history' => $history,
            'history_mapel' => $historyMapel,
            'tapel' => $tapel
        ]);
    }
}
