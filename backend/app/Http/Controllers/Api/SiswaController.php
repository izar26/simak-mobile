<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Siswa;
use App\Models\PengajuanPerubahanSiswa;
use App\Models\BerkasSiswa;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

class SiswaController extends Controller
{
    protected $lockedColumns = [
        'nama', 'nipd', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'agama_id_str', 'kewarganegaraan', 'kebutuhan_khusus',
        'tinggi_badan', 'berat_badan',
        'nama_ayah', 'nama_ibu', 'nama_wali',
        'pekerjaan_ayah_id_str', 'pekerjaan_ibu_id_str', 'pekerjaan_wali_id_str',
        'pendidikan_ayah_id_str', 'pendidikan_ibu_id_str', 'pendidikan_wali_id_str',
        'alamat_jalan',
        'nik', 'nomor_telepon_rumah', 'no_hp_akun'
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
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Siswa tidak ditemukan'], 404);
        }

        $input = $request->all();
        $directChanges = [];
        $pendingChanges = [];

        // 1. Handle Foto
        if ($request->hasFile('foto')) {
            $request->validate(['foto' => 'image|mimes:jpeg,png,jpg|max:2048']);
            try {
                // Hapus foto lama jika ada
                if ($siswa->foto && Storage::disk('public')->exists($siswa->foto)) {
                    Storage::disk('public')->delete($siswa->foto);
                }

                $file = $request->file('foto');
                $filename = time() . '_' . \Illuminate\Support\Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
                
                // Simpan file
                $path = $file->storeAs('siswa/foto', $filename, 'public');
                
                // FORCE UPDATE LANGSUNG KE DB (Bypassing Eloquent mutators or delays)
                DB::table('siswas')->where('id', $siswa->id)->update(['foto' => $path]);
                
                // Set update di object user untuk response JSON nanti
                $siswa->foto = $path; 
                
                // Hapus dari input agar tidak diproses lagi di loop bawah
                unset($input['foto']);

            } catch (\Exception $e) {
                Log::error('Photo upload failed: ' . $e->getMessage());
            }
        }

        // 2. Handle Data Lain
        $tableColumns = Schema::getColumnListing('siswas');
        // Hapus alamat_jalan dari ignore agar bisa diedit
        $ignoredColumns = ['id', 'peserta_didik_id', 'created_at', 'updated_at', 'berkas', '_token'];

        foreach ($input as $key => $value) {
            // KRITIKAL: Lewati kolom yang diabaikan (kecuali no_hp_akun yang ada di tabel pengguna)
            if (in_array($key, $ignoredColumns)) continue;
            if (!in_array($key, $tableColumns) && $key !== 'no_hp_akun') continue;

            // Ambil Nilai Baru
            $newVal = ($value === '' || $value === 'null' || is_null($value)) ? '' : trim((string)$value);

            // Ambil Nilai Database ASLI
            if ($key === 'alamat_jalan') {
                $dbValRaw = $user->alamat;
            } elseif ($key === 'no_hp_akun') {
                $dbValRaw = $user->no_hp;
            } else {
                $dbValRaw = $siswa->getRawOriginal($key);
            }
            $oldVal = ($dbValRaw === '' || $dbValRaw === 'null' || is_null($dbValRaw)) ? '' : trim((string)$dbValRaw);

            // Normalisasi khusus TANGGAL (Ambil YYYY-MM-DD saja)
            // Tanpa zona waktu, cukup potong stringnya mentah-mentah
            if (str_contains($key, 'tanggal') || str_contains($key, 'date')) {
                if ($newVal) $newVal = substr($newVal, 0, 10);
                if ($oldVal) $oldVal = substr($oldVal, 0, 10);
            }

            // BANDINGKAN: Jika sama (misal '2007-07-29' === '2007-07-29'), lewati
            if ($newVal === $oldVal) continue;

            // Jika beda, tentukan masuk Pengajuan atau Langsung
            $finalValue = ($newVal === '') ? null : $newVal;
            if (in_array($key, $this->lockedColumns)) {
                $pendingChanges[$key] = $finalValue;
            } else {
                $directChanges[$key] = $finalValue;
            }
        }

        // 3. Simpan Perubahan Langsung
        if (!empty($directChanges)) {
            DB::table('siswas')->where('id', $siswa->id)->update($directChanges);
        }

        // 4. Simpan Pengajuan (Pending)
        if (!empty($pendingChanges)) {
            try {
                PengajuanPerubahanSiswa::create([
                    'siswa_id' => $siswa->id,
                    'data_perubahan' => $pendingChanges,
                    'status' => 'pending',
                    'keterangan' => 'Pengajuan perubahan data dari aplikasi mobile'
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create pending changes: ' . $e->getMessage());
            }
        }

        return response()->json([
            'message' => 'Proses pembaruan selesai',
            'user' => $user->fresh()->load('siswa')
        ]);
    }

    public function getJadwalHariIni(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa || !$siswa->rombongan_belajar_id) {
            return response()->json([]);
        }

        // 1. Ambil Tapel Aktif
        $tapel = DB::table('tapel')->where('is_active', 1)->first();
        if (!$tapel) {
            return response()->json([]);
        }

        // 2. Cari Nama Rombel siswa saat ini
        $rombelSiswa = DB::table('rombels')
            ->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)
            ->orderBy('id', 'desc')
            ->first();

        if (!$rombelSiswa) {
            return response()->json([]);
        }

        // 3. Cari SEMUA ID Rombel
        $rombelIds = DB::table('rombels')
            ->where('nama', $rombelSiswa->nama)
            ->where('semester_id', $tapel->kode_tapel)
            ->pluck('id');

        if ($rombelIds->isEmpty()) {
            return response()->json([]);
        }

        Carbon::setLocale('id');
        $hari = Carbon::now()->isoFormat('dddd');

        // A. AMBIL SEMUA SLOT JAM UNTUK HARI INI (Termasuk Istirahat/Upacara)
        $allJam = DB::table('jam_pelajarans')
            ->where('hari', $hari)
            ->orderBy('jam_mulai')
            ->get();

        if ($allJam->isEmpty()) {
            return response()->json([]);
        }

        // B. AMBIL JADWAL MAPEL UNTUK KELAS INI
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
            ->get()
            ->keyBy('jam_pelajaran_id'); // Key by ID biar gampang dicocokkan

        // C. GABUNGKAN DATA JAM + MAPEL
        $finalList = [];

        foreach ($allJam as $jam) {
            $item = new \stdClass();
            $item->jam_mulai = $jam->jam_mulai;
            $item->jam_selesai = $jam->jam_selesai;
            $item->tipe = $jam->tipe; // upacara, istirahat, kbm, dll

            if ($jam->tipe === 'kbm') {
                if (isset($jadwalMapel[$jam->id])) {
                    $mapelData = $jadwalMapel[$jam->id];
                    $item->mapel = $mapelData->mapel;
                    $item->guru = $mapelData->guru;
                    $item->is_non_kbm = false;
                } else {
                    $item->mapel = 'Jam Kosong';
                    $item->guru = '-';
                    $item->is_non_kbm = false;
                }
            } else {
                // Untuk Istirahat, Upacara, dll
                // Gunakan tipe sebagai Judul (Capitalized)
                $item->mapel = ucwords($jam->tipe);
                $item->guru = ''; // Tidak ada guru
                $item->is_non_kbm = true;
            }

            $finalList[] = $item;
        }

        // D. LOGIKA MERGE JADWAL (Gabungkan jam berurutan yang sama)
        $mergedJadwal = [];
        $lastItem = null;

        foreach ($finalList as $item) {
            $shouldMerge = false;

            if ($lastItem) {
                if ($item->is_non_kbm) {
                    // Jika Non-KBM, merge jika Tipe-nya sama (misal Istirahat jam ke-4 & 5)
                    if ($lastItem->is_non_kbm && $lastItem->mapel === $item->mapel) {
                        $shouldMerge = true;
                    }
                } else {
                    // Jika KBM, merge jika Mapel & Guru sama
                    if (!$lastItem->is_non_kbm && $lastItem->mapel === $item->mapel && $lastItem->guru === $item->guru) {
                        $shouldMerge = true;
                    }
                }
            }

            if ($shouldMerge) {
                // Merge: Update jam selesai item sebelumnya
                $lastItem->jam_selesai = $item->jam_selesai;
            } else {
                // Push item baru (clone biar aman)
                $lastItem = clone $item;
                $mergedJadwal[] = $lastItem;
            }
        }

        $formattedJadwal = collect($mergedJadwal)->map(function ($item) {
            $jamMulai = Carbon::parse($item->jam_mulai)->format('H:i');
            $jamSelesai = Carbon::parse($item->jam_selesai)->format('H:i');

            $now = Carbon::now()->format('H:i');
            $status = 'Akan Datang';
            if ($now >= $jamMulai && $now <= $jamSelesai) {
                $status = 'Berlangsung';
            } elseif ($now > $jamSelesai) {
                $status = 'Selesai';
            }

            return [
                'jam' => "$jamMulai - $jamSelesai",
                'mapel' => $item->mapel,
                'guru' => $item->guru ?? '-',
                'status' => $status,
                'is_non_kbm' => $item->is_non_kbm ?? false
            ];
        });

        // 1. Ambil Hari Libur (Masa Depan)
        $libur = DB::table('hari_libur')
            ->where('tanggal_selesai', '>=', Carbon::now()->format('Y-m-d'))
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'libur',
                    'title' => $item->keterangan,
                    'date' => $item->tanggal_mulai,
                    'desc' => 'Kegiatan sekolah ditiadakan.'
                ];
            });

        // 2. Ambil Pengumuman Sekolah (Aktif)
        $info = DB::table('pengumuman')
            ->where('is_active', 1)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'info',
                    'title' => $item->judul,
                    'date' => $item->tgl_terbit,
                    'desc' => strip_tags($item->isi)
                ];
            });

        // 3. Ambil Berita Terbaru (Published)
        $berita = DB::table('beritas')
            ->where('status', 'published') // Asumsi status 'published'
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'berita',
                    'title' => $item->judul,
                    'date' => $item->created_at,
                    'desc' => $item->ringkasan
                ];
            });

        // 4. Gabung & Urutkan
        $pengumuman = $libur->merge($info)->merge($berita)
            ->sortByDesc('date')
            ->values()
            ->take(10);

        return response()->json([
            'jadwal' => $formattedJadwal,
            'pengumuman' => $pengumuman
        ]);
    }

    public function getJadwalMingguan(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa || !$siswa->rombongan_belajar_id) {
            return response()->json([]);
        }

        // 1. Ambil Tapel Aktif
        $tapel = DB::table('tapel')->where('is_active', 1)->first();
        if (!$tapel) {
            return response()->json([]);
        }

        // 2. Cari Nama Rombel siswa
        $rombelSiswa = DB::table('rombels')
            ->where('rombongan_belajar_id', $siswa->rombongan_belajar_id)
            ->orderBy('id', 'desc')
            ->first();

        if (!$rombelSiswa) {
            return response()->json([]);
        }

        // 3. Cari SEMUA ID Rombel
        $rombelIds = DB::table('rombels')
            ->where('nama', $rombelSiswa->nama)
            ->where('semester_id', $tapel->kode_tapel)
            ->pluck('id');

        if ($rombelIds->isEmpty()) {
            return response()->json([]);
        }

        $masterHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // A. Ambil Jadwal Mapel (KBM) Lengkap
        $jadwalMapel = DB::table('jadwal_pelajarans')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->whereIn('jadwal_pelajarans.rombel_id', $rombelIds)
            ->select(
                'jadwal_pelajarans.jam_pelajaran_id',
                'pembelajarans.nama_mata_pelajaran as mapel',
                'gtks.nama as guru'
            )
            ->get()
            ->keyBy('jam_pelajaran_id');

        // B. Ambil Semua Jam Pelajaran Grouped by Hari
        $allJam = DB::table('jam_pelajarans')
            ->orderByRaw("FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')")
            ->orderBy('jam_mulai')
            ->get()
            ->groupBy('hari');

        $result = [];

        foreach ($masterHari as $hari) {
            if (isset($allJam[$hari])) {
                $dayItems = $allJam[$hari];
                $finalList = [];

                // 1. Mapping Data
                foreach ($dayItems as $jam) {
                    $item = new \stdClass();
                    $item->jam_mulai = $jam->jam_mulai;
                    $item->jam_selesai = $jam->jam_selesai;
                    $item->tipe = $jam->tipe;

                    if ($jam->tipe === 'kbm') {
                        if (isset($jadwalMapel[$jam->id])) {
                            $mapelData = $jadwalMapel[$jam->id];
                            $item->mapel = $mapelData->mapel;
                            $item->guru = $mapelData->guru;
                            $item->is_non_kbm = false;
                        } else {
                            $item->mapel = 'Jam Kosong';
                            $item->guru = '-';
                            $item->is_non_kbm = false;
                        }
                    } else {
                        // Non-KBM (Istirahat, Upacara)
                        $item->mapel = ucwords($jam->tipe);
                        $item->guru = '';
                        $item->is_non_kbm = true;
                    }
                    $finalList[] = $item;
                }

                // 2. Merging Logic
                $mergedDayItems = [];
                $lastItem = null;

                foreach ($finalList as $item) {
                    $shouldMerge = false;
                    if ($lastItem) {
                        if ($item->is_non_kbm) {
                            if ($lastItem->is_non_kbm && $lastItem->mapel === $item->mapel) {
                                $shouldMerge = true;
                            }
                        } else {
                            if (!$lastItem->is_non_kbm && $lastItem->mapel === $item->mapel && $lastItem->guru === $item->guru) {
                                $shouldMerge = true;
                            }
                        }
                    }

                    if ($shouldMerge) {
                        $lastItem->jam_selesai = $item->jam_selesai;
                    } else {
                        $lastItem = clone $item;
                        $mergedDayItems[] = $lastItem;
                    }
                }

                $result[$hari] = collect($mergedDayItems)->map(function ($item) {
                    return [
                        'jam' => Carbon::parse($item->jam_mulai)->format('H:i') . ' - ' . Carbon::parse($item->jam_selesai)->format('H:i'),
                        'mapel' => $item->mapel,
                        'guru' => $item->guru ?? '-',
                        'is_non_kbm' => $item->is_non_kbm ?? false
                    ];
                });

            } else {
                $result[$hari] = [];
            }
        }

        // C. AMBIL DATA HARI LIBUR (Untuk Notifikasi Frontend)
        // Ambil libur mulai hari ini sampai 3 bulan ke depan
        $holidays = DB::table('hari_libur')
            ->where('tanggal_selesai', '>=', Carbon::now()->format('Y-m-d'))
            ->where('tanggal_mulai', '<=', Carbon::now()->addMonths(3)->format('Y-m-d'))
            ->select('keterangan', 'tanggal_mulai', 'tanggal_selesai')
            ->get();

        return response()->json([
            'schedule' => $result,
            'holidays' => $holidays
        ]);
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

        $stats = DB::table('absensi_siswa')
            ->where('siswa_id', $siswa->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $summary = [
            'Hadir' => $stats['Hadir'] ?? 0,
            'Sakit' => $stats['Sakit'] ?? 0,
            'Izin' => $stats['Izin'] ?? 0,
            'Alfa' => $stats['Alfa'] ?? 0,
        ];

        $history = DB::table('absensi_siswa')
            ->where('siswa_id', $siswa->id)
            ->orderBy('tanggal', 'desc')
            ->limit(30)
            ->get();

        // QUERY HISTORY MAPEL (Updated with Merging Logic)
        $historyMapelRaw = DB::table('absensi_mapel')
            ->join('jadwal_pelajarans', 'absensi_mapel.jadwal_pelajaran_id', '=', 'jadwal_pelajarans.id')
            ->join('jam_pelajarans', 'jadwal_pelajarans.jam_pelajaran_id', '=', 'jam_pelajarans.id') // Join Jam
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->where('absensi_mapel.siswa_id', $siswa->id)
            ->select(
                'absensi_mapel.tanggal',
                'absensi_mapel.status',
                'pembelajarans.nama_mata_pelajaran as mapel',
                'gtks.nama as guru',
                'jam_pelajarans.jam_mulai',
                'jam_pelajarans.jam_selesai'
            )
            ->orderBy('absensi_mapel.tanggal', 'desc') // Tanggal terbaru
            ->orderBy('jam_pelajarans.jam_mulai', 'asc') // Jam pagi ke siang (penting untuk merge)
            ->limit(60) // Limit agak diperbanyak sebelum di-merge
            ->get();

        // LOGIKA MERGING
        $mergedHistoryMapel = [];
        $lastItem = null;

        foreach ($historyMapelRaw as $item) {
            // FIX: Format dulu sebelum dipakai logika apapun
            // Agar saat di-merge, datanya sudah bersih (tanpa :00)
            $item->jam_mulai = Carbon::parse($item->jam_mulai)->format('H:i');
            $item->jam_selesai = Carbon::parse($item->jam_selesai)->format('H:i');

            if ($lastItem &&
                $lastItem->tanggal === $item->tanggal &&
                $lastItem->mapel === $item->mapel &&
                $lastItem->status === $item->status) {

                // Perpanjang jam selesai (sekarang sudah format H:i)
                $lastItem->jam_selesai = $item->jam_selesai;
            } else {
                // Clone item baru
                $lastItem = clone $item;
                $mergedHistoryMapel[] = $lastItem;
            }
        }

        // Balik lagi urutannya biar yang paling atas itu yang jam terakhir (optional, tergantung selera UI)
        // Defaultnya tadi Tanggal Desc, Jam Asc. Kalau mau list dari "Tadi Pagi", biarkan.
        // Kalau mau list dari "Pelajaran Terakhir Hari Ini", kita reverse per hari.
        // Tapi standar timeline biasanya Tanggal Desc -> Jam Asc (Pagi dulu). Kita biarkan.

        $tapel = DB::table('tapel')->where('is_active', 1)->first();

        return response()->json([
            'stats' => $summary,
            'history' => $history,
            'history_mapel' => $mergedHistoryMapel, // Gunakan hasil merge
            'tapel' => $tapel
        ]);
    }

    public function cetakBiodata(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);
        }

        // Ambil data sekolah
        $sekolah = DB::table('sekolahs')->first();

        // Load relasi pengguna (untuk email) dan rombel
        $siswa->load('pengguna');

        // Jika data rombel belum terload otomatis (karena kita pakai DB query manual di auth),
        // coba load manual atau biarkan view menghandle fallback logic.
        // View mengharapkan $siswas (collection) karena pakai @foreach
        $siswas = collect([$siswa]);

        $pdf = Pdf::loadView('admin.kesiswaan.mobile.pdf.biodata_siswa', compact('siswas', 'sekolah'));

        // Set ukuran kertas F4/Folio (21.5cm x 33cm) atau A4 sesuai standar sekolah
        $pdf->setPaper('a4', 'portrait');

        return $pdf->stream('Biodata_' . $siswa->nama . '.pdf');
    }

    public function getNotifikasi(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) {
            return response()->json([]);
        }

        // Ambil riwayat pengajuan sebagai notifikasi
        $notifikasi = PengajuanPerubahanSiswa::where('siswa_id', $siswa->id)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($item) {
                // Format pesan notifikasi
                $title = 'Pengajuan Perubahan Data';
                $message = 'Pengajuan Anda sedang diproses.';
                $type = 'info'; // info, success, error

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
                    'status' => $item->status, // pending, disetujui, ditolak
                    'date' => Carbon::parse($item->updated_at)->diffForHumans(),
                    'raw_date' => $item->updated_at,
                    'type' => $type,
                    'catatan' => $item->catatan_operator
                ];
            });

        return response()->json($notifikasi);
    }
}
