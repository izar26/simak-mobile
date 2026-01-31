<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;

// --- MODEL ---
use App\Models\Siswa;
use App\Models\PengajuanPerubahanSiswa;
use App\Models\BerkasSiswa;
use App\Models\PelanggaranNilai;
use App\Models\PelanggaranSanksi;
use App\Models\Tagihan;
use App\Models\Tunggakan;
use App\Models\Pembayaran;
use App\Models\Download;

class SiswaController extends Controller
{
    // Kolom yang butuh persetujuan admin jika diubah
    protected $lockedColumns = [
        'nama', 'nipd', 'nisn', 'nik', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir',
        'agama_id_str', 'kewarganegaraan', 'kebutuhan_khusus',
        'tinggi_badan', 'berat_badan',
        'nama_ayah', 'nama_ibu', 'nama_wali',
        'pekerjaan_ayah_id_str', 'pekerjaan_ibu_id_str', 'pekerjaan_wali_id_str',
        'anak_keberapa',
        'pendidikan_ayah_id_str', 'pendidikan_ibu_id_str', 'pendidikan_wali_id_str',
        'alamat_jalan', 'nik', 'nomor_telepon_rumah', 'no_hp_akun'
    ];

    /**
     * PROFIL USER (Dengan ETag)
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user->siswa) {
             return response()->json(['message' => 'User bukan siswa'], 403);
        }

        // Load relasi SEBELUM generate ETag
        $user->load('siswa.sekolah', 'siswa.berkas');

        $responseData = [
            'status' => 'success',
            'data' => $user,
        ];

        return $this->sendResponseWithETag($responseData);
    }

    /**
     * DASHBOARD INFO (Berita, Pengumuman, Agenda) - ETag Aktif
     */
    public function getSemuaInformasi(Request $request)
    {
        // 1. Libur
        $libur = DB::table('hari_libur')
            ->where('tanggal_selesai', '>=', Carbon::now()->subMonths(1)->format('Y-m-d'))
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'libur',
                    'title' => $item->keterangan,
                    'date' => $item->tanggal_mulai,
                    'desc' => 'Kegiatan sekolah ditiadakan.',
                    'content' => $item->keterangan
                ];
            });

        // 2. Pengumuman
        $info = DB::table('pengumuman')
            ->where('is_active', 1)
            ->orderBy('tgl_terbit', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'info',
                    'title' => $item->judul,
                    'date' => $item->tgl_terbit,
                    'desc' => trim(strip_tags(str_replace(['<br>', '<br />', '</p>'], ["\n", "\n", "\n\n"], $item->isi))),
                    'content' => $item->isi
                ];
            });

        // 3. Berita
        $berita = DB::table('beritas')
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'berita',
                    'title' => $item->judul,
                    'date' => $item->created_at,
                    'desc' => $item->ringkasan,
                    'image' => $item->gambar,
                    'content' => $item->isi
                ];
            });

        // 4. Agenda
        $agenda = DB::table('agendas')
            ->orderBy('tanggal_mulai', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'agenda',
                    'title' => $item->judul,
                    'date' => $item->tanggal_mulai,
                    'desc' => ($item->jam_mulai ? $item->jam_mulai . ' - ' : '') . ($item->lokasi ? '@' . $item->lokasi : ''),
                    'content' => $item->deskripsi,
                    'lokasi' => $item->lokasi,
                    'jam' => $item->jam_mulai
                ];
            });

        $hasil = $libur->merge($info)->merge($berita)->merge($agenda)
            ->sortByDesc('date')
            ->values()
            ->take(50);

        return $this->sendResponseWithETag($hasil);
    }

    /**
     * JADWAL HARI INI - ETag Aktif
     */
    public function getJadwalHariIni(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        // --- 1. SIAPKAN DATA PENGUMUMAN (DIKEMBALIKAN FULL) ---

        // A. Libur
        $libur = DB::table('hari_libur')
            ->where('tanggal_selesai', '>=', Carbon::now()->format('Y-m-d'))
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'libur',
                    'title' => $item->keterangan,
                    'date' => $item->tanggal_mulai,
                    'desc' => 'Kegiatan sekolah ditiadakan.',
                    'content' => $item->keterangan
                ];
            });

        // B. Info
        $info = DB::table('pengumuman')
            ->where('is_active', 1)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'info',
                    'title' => $item->judul,
                    'date' => $item->tgl_terbit,
                    'desc' => trim(strip_tags(str_replace(['<br>', '<br />', '</p>'], ["\n", "\n", "\n\n"], $item->isi))),
                    'content' => $item->isi
                ];
            });

        // C. Berita
        $berita = DB::table('beritas')
            ->where('status', 'published')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'berita',
                    'title' => $item->judul,
                    'date' => $item->created_at,
                    'desc' => $item->ringkasan,
                    'image' => $item->gambar,
                    'content' => $item->isi
                ];
            });

        // D. Agenda
        $agenda = DB::table('agendas')
            ->where('tanggal_selesai', '>=', Carbon::now()->format('Y-m-d'))
            ->orderBy('tanggal_mulai', 'asc')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'type' => 'agenda',
                    'title' => $item->judul,
                    'date' => $item->tanggal_mulai,
                    'desc' => ($item->jam_mulai ? $item->jam_mulai . ' - ' : '') . ($item->lokasi ? '@' . $item->lokasi : ''),
                    'content' => $item->deskripsi,
                    'lokasi' => $item->lokasi,
                    'jam' => $item->jam_mulai
                ];
            });

        // Gabung Semua
        $pengumuman = $libur->merge($info)->merge($berita)->merge($agenda)
            ->sortByDesc('date')
            ->values()
            ->take(10);


        // --- 2. PROSES JADWAL ---
        $formattedJadwal = [];

        if ($siswa && $siswa->peserta_didik_id) {
            $tapel = DB::table('tapel')->where('is_active', 1)->first();

            if ($tapel) {
                $rombelIds = DB::table('rombels')
                    ->where('semester_id', $tapel->kode_tapel)
                    ->where('anggota_rombel', 'like', '%' . $siswa->peserta_didik_id . '%')
                    ->pluck('id');

                if (!$rombelIds->isEmpty()) {
                        $hariRaw = Carbon::now()->format('l');
                        $daysMap = ['Monday' => 'Senin', 'Tuesday' => 'Selasa', 'Wednesday' => 'Rabu', 'Thursday' => 'Kamis', 'Friday' => 'Jumat', 'Saturday' => 'Sabtu', 'Sunday' => 'Minggu'];
                        $hari = $daysMap[$hariRaw] ?? $hariRaw;

                        $allJam = DB::table('jam_pelajarans')->where('hari', $hari)->orderBy('jam_mulai')->get();

                        if (!$allJam->isEmpty()) {
                            $jadwalMapel = DB::table('jadwal_pelajarans')
                                ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
                                ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
                                ->whereIn('jadwal_pelajarans.rombel_id', $rombelIds)
                                ->whereIn('jadwal_pelajarans.jam_pelajaran_id', $allJam->pluck('id'))
                                ->select('jadwal_pelajarans.jam_pelajaran_id', 'pembelajarans.nama_mata_pelajaran as mapel', 'gtks.nama as guru')
                                ->get()
                                ->keyBy('jam_pelajaran_id');

                            $finalList = [];
                            foreach ($allJam as $jam) {
                                $item = new \stdClass();
                                $item->jam_mulai = $jam->jam_mulai;
                                $item->jam_selesai = $jam->jam_selesai;
                                $item->tipe = $jam->tipe;

                                if ($jam->tipe === 'kbm') {
                                    $mapelData = $jadwalMapel[$jam->id] ?? null;
                                    $item->mapel = $mapelData ? $mapelData->mapel : 'Jam Kosong';
                                    $item->guru = $mapelData ? $mapelData->guru : '-';
                                    $item->is_non_kbm = false;
                                } else {
                                    $item->mapel = ucwords($jam->tipe);
                                    $item->guru = '';
                                    $item->is_non_kbm = true;
                                }
                                $finalList[] = $item;
                            }

                            // Merging Logic
                            $mergedJadwal = [];
                            $lastItem = null;
                            foreach ($finalList as $item) {
                                $shouldMerge = false;
                                if ($lastItem) {
                                    if ($item->is_non_kbm) {
                                        if ($lastItem->is_non_kbm && $lastItem->mapel === $item->mapel) $shouldMerge = true;
                                    } else {
                                        if (!$lastItem->is_non_kbm && $lastItem->mapel === $item->mapel && $lastItem->guru === $item->guru) $shouldMerge = true;
                                    }
                                }

                                if ($shouldMerge) {
                                    $lastItem->jam_selesai = $item->jam_selesai;
                                } else {
                                    $lastItem = clone $item;
                                    $mergedJadwal[] = $lastItem;
                                }
                            }

                            $formattedJadwal = collect($mergedJadwal)->map(function ($item) {
                                $jamMulai = Carbon::parse($item->jam_mulai)->format('H:i');
                                $jamSelesai = Carbon::parse($item->jam_selesai)->format('H:i');
                                $now = Carbon::now()->format('H:i');
                                $status = ($now >= $jamMulai && $now <= $jamSelesai) ? 'Berlangsung' : (($now > $jamSelesai) ? 'Selesai' : 'Akan Datang');

                                return [
                                    'jam' => "$jamMulai - $jamSelesai",
                                    'mapel' => $item->mapel,
                                    'guru' => $item->guru ?? '-',
                                    'status' => $status,
                                    'is_non_kbm' => $item->is_non_kbm ?? false
                                ];
                            });
                        }
                }
            }
        }

        // Return dengan ETag, Data Jadwal, DAN Data Pengumuman Lengkap
        return $this->sendResponseWithETag([
            'jadwal' => $formattedJadwal,
            'pengumuman' => $pengumuman
        ]);
    }
    /**
     * JADWAL MINGGUAN - ETag Aktif
     */
    public function getJadwalMingguan(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa || !$siswa->peserta_didik_id) return response()->json([]);

        $tapel = DB::table('tapel')->where('is_active', 1)->first();
        if (!$tapel) return response()->json([]);

        $rombelIds = DB::table('rombels')
            ->where('semester_id', $tapel->kode_tapel)
            ->where('anggota_rombel', 'like', '%' . $siswa->peserta_didik_id . '%')
            ->pluck('id');

        if ($rombelIds->isEmpty()) return response()->json([]);

        $masterHari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

        // Ambil Data
        $jadwalMapel = DB::table('jadwal_pelajarans')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->whereIn('jadwal_pelajarans.rombel_id', $rombelIds)
            ->select('jadwal_pelajarans.jam_pelajaran_id', 'pembelajarans.nama_mata_pelajaran as mapel', 'gtks.nama as guru')
            ->get()->keyBy('jam_pelajaran_id');

        $allJam = DB::table('jam_pelajarans')
            ->orderByRaw("FIELD(hari, 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')")
            ->orderBy('jam_mulai')
            ->get()->groupBy('hari');

        $result = [];

        foreach ($masterHari as $hari) {
            if (isset($allJam[$hari])) {
                $dayItems = $allJam[$hari];
                $finalList = [];
                // 1. Map Data
                foreach ($dayItems as $jam) {
                    $item = new \stdClass();
                    $item->jam_mulai = $jam->jam_mulai;
                    $item->jam_selesai = $jam->jam_selesai;
                    $item->tipe = $jam->tipe;

                    if ($jam->tipe === 'kbm') {
                        $mapelData = $jadwalMapel[$jam->id] ?? null;
                        $item->mapel = $mapelData ? $mapelData->mapel : 'Jam Kosong';
                        $item->guru = $mapelData ? $mapelData->guru : '-';
                        $item->is_non_kbm = false;
                    } else {
                        $item->mapel = ucwords($jam->tipe);
                        $item->guru = '';
                        $item->is_non_kbm = true;
                    }
                    $finalList[] = $item;
                }
                // 2. Merge Data
                $mergedDayItems = [];
                $lastItem = null;
                foreach ($finalList as $item) {
                    $shouldMerge = false;
                    if ($lastItem) {
                        if ($item->is_non_kbm) {
                            if ($lastItem->is_non_kbm && $lastItem->mapel === $item->mapel) $shouldMerge = true;
                        } else {
                            if (!$lastItem->is_non_kbm && $lastItem->mapel === $item->mapel && $lastItem->guru === $item->guru) $shouldMerge = true;
                        }
                    }
                    if ($shouldMerge) $lastItem->jam_selesai = $item->jam_selesai;
                    else { $lastItem = clone $item; $mergedDayItems[] = $lastItem; }
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

        $holidays = DB::table('hari_libur')
            ->where('tanggal_selesai', '>=', Carbon::now()->format('Y-m-d'))
            ->where('tanggal_mulai', '<=', Carbon::now()->addMonths(3)->format('Y-m-d'))
            ->select('keterangan', 'tanggal_mulai', 'tanggal_selesai')
            ->get();

        return $this->sendResponseWithETag([
            'schedule' => $result,
            'holidays' => $holidays
        ]);
    }

    /**
     * REKAP ABSENSI - ETag Aktif
     */
    public function getRekapAbsensi(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) return response()->json(['stats' => [], 'history' => []]);

        $stats = DB::table('absensi_siswa')
            ->where('siswa_id', $siswa->id)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status')->toArray();

        $summary = [
            'Hadir' => $stats['Hadir'] ?? 0,
            'Sakit' => $stats['Sakit'] ?? 0,
            'Izin' => $stats['Izin'] ?? 0,
            'Alfa' => $stats['Alfa'] ?? 0,
        ];

        $history = DB::table('absensi_siswa')->where('siswa_id', $siswa->id)->orderBy('tanggal', 'desc')->limit(30)->get();
        $tapel = DB::table('tapel')->where('is_active', 1)->first();

        // History Mapel Logic
        $historyMapelRaw = DB::table('absensi_mapel')
            ->join('jadwal_pelajarans', 'absensi_mapel.jadwal_pelajaran_id', '=', 'jadwal_pelajarans.id')
            ->join('jam_pelajarans', 'jadwal_pelajarans.jam_pelajaran_id', '=', 'jam_pelajarans.id')
            ->join('pembelajarans', 'jadwal_pelajarans.pembelajaran_id', '=', 'pembelajarans.id')
            ->leftJoin('gtks', 'pembelajarans.ptk_id', '=', 'gtks.ptk_id')
            ->where('absensi_mapel.siswa_id', $siswa->id)
            ->select(
                'absensi_mapel.tanggal', 'absensi_mapel.status',
                'pembelajarans.nama_mata_pelajaran as mapel', 'gtks.nama as guru',
                'jam_pelajarans.jam_mulai', 'jam_pelajarans.jam_selesai'
            )
            ->orderBy('absensi_mapel.tanggal', 'desc')
            ->orderBy('jam_pelajarans.jam_mulai', 'asc')
            ->limit(60)
            ->get();

        $mergedHistoryMapel = [];
        $lastItem = null;
        foreach ($historyMapelRaw as $item) {
            $item->jam_mulai = Carbon::parse($item->jam_mulai)->format('H:i');
            $item->jam_selesai = Carbon::parse($item->jam_selesai)->format('H:i');
            if ($lastItem && $lastItem->tanggal === $item->tanggal && $lastItem->mapel === $item->mapel && $lastItem->status === $item->status) {
                $lastItem->jam_selesai = $item->jam_selesai;
            } else {
                $lastItem = clone $item;
                $mergedHistoryMapel[] = $lastItem;
            }
        }

        return $this->sendResponseWithETag([
            'stats' => $summary,
            'history' => $history,
            'history_mapel' => $mergedHistoryMapel,
            'tapel' => $tapel
        ]);
    }

    /**
     * KEUANGAN (Perbaikan Bug getKey) - ETag Aktif
     */
    public function getKeuangan(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) return response()->json(['message' => 'Data siswa tidak ditemukan'], 404);

        // 1. TAGIHAN (Safe Navigation)
        $tagihan = Tagihan::with('iuran')
            ->where('siswa_id', $siswa->id)
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jenis' => 'tagihan',
                    'nama' => $item->iuran?->nama_iuran ?? 'Tagihan ID: ' . $item->id,
                    'tipe' => $item->iuran?->tipe_iuran ?? 'Bebas',
                    'periode' => $item->periode,
                    'total' => (int) $item->jumlah_tagihan,
                    'sisa' => (int) $item->sisa_tagihan,
                    'status' => $item->status,
                ];
            });

        // 2. TUNGGAKAN
        $tunggakan = Tunggakan::with('iuran')
            ->where('siswa_id', $siswa->id)
            ->where('sisa_tunggakan', '>', 0)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'jenis' => 'tunggakan',
                    'nama' => 'Tunggakan ' . ($item->iuran?->nama_iuran ?? ''),
                    'tipe' => 'Bebas',
                    'periode' => '-',
                    'total' => (int) $item->total_tunggakan_awal,
                    'sisa' => (int) $item->sisa_tunggakan,
                    'status' => 'Tunggakan'
                ];
            });

        // FIX: Pakai collect() agar tidak dianggap Eloquent Collection
        $listTagihan = collect($tunggakan)->merge($tagihan);

        // 3. RIWAYAT
        $history = Pembayaran::with(['iuran', 'petugas'])
            ->where('siswa_id', $siswa->id)
            ->orderBy('tanggal_bayar', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tanggal' => $item->tanggal_bayar instanceof \Carbon\Carbon ? $item->tanggal_bayar->format('Y-m-d') : $item->tanggal_bayar,
                    'nama_iuran' => $item->iuran?->nama_iuran ?? 'Pembayaran',
                    'jumlah' => (int) $item->jumlah_bayar,
                    'metode' => $item->metode_pembayaran ?? 'Tunai',
                    'penerima' => $item->petugas?->nama ?? 'Sistem'
                ];
            });

        return $this->sendResponseWithETag([
            'summary' => [
                'total_tagihan' => $listTagihan->sum('sisa'),
                'count_tagihan' => $listTagihan->where('sisa', '>', 0)->count(),
            ],
            'tagihan_list' => $listTagihan->values(), // values() reset index array
            'history_list' => $history
        ]);
    }

    /**
     * PELANGGARAN - ETag Aktif
     */
    public function getPelanggaran(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;

        if (!$siswa) return response()->json(['total_poin' => 0, 'sanksi' => 'Data Tidak Ditemukan', 'history' => []]);

        $history = PelanggaranNilai::with(['detailPoinSiswa.pelanggaranKategori'])
            ->where('nipd', $siswa->nipd)
            ->orderBy('tanggal', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->ID,
                    'tanggal' => $item->tanggal,
                    'jam' => $item->jam,
                    'poin' => $item->poin,
                    'pelanggaran' => $item->detailPoinSiswa->nama ?? 'Dihapus',
                    'kategori' => $item->detailPoinSiswa->pelanggaranKategori->nama ?? '-',
                    'tindakan' => $item->detailPoinSiswa->tindakan ?? '-'
                ];
            });

        $totalPoin = $history->sum('poin');
        $sanksiDB = PelanggaranSanksi::where('poin_min', '<=', $totalPoin)->where('poin_max', '>=', $totalPoin)->first();

        $statusWarna = 'success';
        if ($totalPoin >= 50) $statusWarna = 'warning';
        if ($totalPoin >= 100) $statusWarna = 'danger';

        return $this->sendResponseWithETag([
            'summary' => [
                'total_poin' => $totalPoin,
                'status_sanksi' => $sanksiDB ? $sanksiDB->nama : 'Siswa Teladan',
                'warna' => $statusWarna,
                'tindak_lanjut' => $sanksiDB ? $sanksiDB->penindak : '-'
            ],
            'history' => $history
        ]);
    }

    /**
     * PUSAT UNDUHAN - ETag Aktif
     */
    public function getUnduhan(Request $request)
    {
        $data = Download::where('is_active', true)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'title' => $item->title,
                    'category' => $item->category ?? 'Umum',
                    'desc' => $item->description,
                    'url' => url('storage/' . $item->file_path),
                    'type' => strtolower(pathinfo($item->file_path, PATHINFO_EXTENSION)),
                    'date' => $item->created_at->format('Y-m-d'),
                ];
            });

        return $this->sendResponseWithETag($data);
    }

    /**
     * NOTIFIKASI - ETag Aktif
     */
    public function getNotifikasi(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;
        if (!$siswa) return response()->json([]);

        $notifikasi = PengajuanPerubahanSiswa::where('siswa_id', $siswa->id)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($item) {
                $title = 'Pengajuan Perubahan Data';
                $message = 'Pengajuan Anda sedang diproses.';
                $type = 'info';

                if ($item->status === 'disetujui') {
                    $title = 'Pengajuan Disetujui ✅';
                    $message = 'Data profil Anda telah diperbarui.';
                    $type = 'success';
                } elseif ($item->status === 'ditolak') {
                    $title = 'Pengajuan Ditolak ❌';
                    $message = 'Alasan: ' . ($item->catatan_operator ?? 'Hubungi sekolah.');
                    $type = 'error';
                }

                return [
                    'id' => $item->id,
                    'title' => $title,
                    'message' => $message,
                    'status' => $item->status,
                    'date' => Carbon::parse($item->updated_at)->diffForHumans(),
                    'type' => $type
                ];
            });

        return $this->sendResponseWithETag($notifikasi);
    }

    // --- FUNGSI POST/EDIT (TIDAK PAKAI ETAG) ---

    public function uploadBerkas(Request $request)
    {
        $request->validate(['file' => 'required|file|max:5120', 'judul' => 'required|string|max:255']);
        $user = $request->user();
        $siswa = $user->siswa;
        if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

        try {
            $file = $request->file('file');
            $path = $file->store('berkas_siswa', 'public');
            $berkas = BerkasSiswa::create([
                'siswa_id' => $siswa->id,
                'judul' => $request->judul,
                'file_path' => $path,
                'file_type' => $file->getClientOriginalExtension(),
            ]);
            return response()->json(['message' => 'Berkas berhasil diupload', 'berkas' => $berkas]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal upload', 'error' => $e->getMessage()], 500);
        }
    }

    public function hapusBerkas(Request $request)
    {
        $request->validate(['id' => 'required|exists:berkas_siswas,id']);
        $berkas = BerkasSiswa::find($request->id);
        if ($berkas->siswa_id != $request->user()->siswa->id) return response()->json(['message' => 'Unauthorized'], 403);

        try {
            if (Storage::disk('public')->exists($berkas->file_path)) Storage::disk('public')->delete($berkas->file_path);
            $berkas->delete();
            return response()->json(['message' => 'Berkas dihapus']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal hapus'], 500);
        }
    }

    public function update(Request $request)
{
    $user = $request->user();
    $siswa = $user->siswa;
    if (!$siswa) return response()->json(['message' => 'Siswa tidak ditemukan'], 404);

    $input = $request->all();
    $directChanges = [];
    $pendingChanges = [];

    // 1. Handle Foto
    if ($request->hasFile('foto')) {
        $request->validate(['foto' => 'image|mimes:jpeg,png,jpg|max:2048']);
        try {
            if ($siswa->foto && Storage::disk('public')->exists($siswa->foto)) Storage::disk('public')->delete($siswa->foto);
            $file = $request->file('foto');
            $filename = time() . '_' . \Illuminate\Support\Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('siswa/foto', $filename, 'public');
            DB::table('siswas')->where('id', $siswa->id)->update(['foto' => $path]);
            $siswa->foto = $path;
            unset($input['foto']);
        } catch (\Exception $e) {
            Log::error('Photo upload failed: ' . $e->getMessage());
        }
    }

    $tableColumns = Schema::getColumnListing('siswas');
    $ignoredColumns = ['id', 'peserta_didik_id', 'created_at', 'updated_at', 'berkas', '_token'];

    foreach ($input as $key => $value) {
        if (in_array($ignoredColumns, $key)) continue; // Perbaikan: in_array($needle, $haystack)
        if (!in_array($key, $tableColumns) && $key !== 'no_hp_akun') continue;

        $newVal = ($value === '' || $value === 'null' || is_null($value)) ? '' : trim((string)$value);

        if ($key === 'alamat_jalan') $dbValRaw = $user->alamat;
        elseif ($key === 'no_hp_akun') $dbValRaw = $user->no_hp;
        else $dbValRaw = $siswa->getRawOriginal($key);

        $oldVal = ($dbValRaw === '' || $dbValRaw === 'null' || is_null($dbValRaw)) ? '' : trim((string)$dbValRaw);

        // --- NORMALISASI TANGGAL ---
        if (str_contains($key, 'tanggal') || str_contains($key, 'date')) {
            if ($newVal) $newVal = substr($newVal, 0, 10);
            if ($oldVal) $oldVal = substr($oldVal, 0, 10);
        }

        // --- LOGIKA BARU: NORMALISASI TAHUN (DARI KONTROLLER 2) ---
        if (in_array($key, ['tahun_lahir_ayah', 'tahun_lahir_ibu', 'tahun_lahir_wali'])) {
            if ($newVal) {
                preg_match('/\d{4}/', $newVal, $matches);
                $newVal = $matches[0] ?? '';
            }
            if ($oldVal) {
                preg_match('/\d{4}/', $oldVal, $matches);
                $oldVal = $matches[0] ?? '';
            }
        }

        // Bandingkan setelah dinormalisasi
        if ($newVal === $oldVal) continue;

        $finalValue = ($newVal === '') ? null : $newVal;
        if (in_array($key, $this->lockedColumns)) $pendingChanges[$key] = $finalValue;
        else $directChanges[$key] = $finalValue;
    }

    if (!empty($directChanges)) DB::table('siswas')->where('id', $siswa->id)->update($directChanges);

    if (!empty($pendingChanges)) {
        // ===== LIMIT PENGAJUAN =====
        // 1. Check: Apakah ada pengajuan yang masih PENDING (belum diverifikasi)?
        $pendingCount = PengajuanPerubahanSiswa::where('siswa_id', $siswa->id)
            ->where('status', 'pending')
            ->count();

        if ($pendingCount > 0) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda masih memiliki pengajuan yang sedang diverifikasi',
                'detail' => 'Tunggu sampai pengajuan sebelumnya selesai diverifikasi sebelum membuat pengajuan baru.',
                'pending_count' => $pendingCount,
                'user' => $user->fresh()->load('siswa')
            ], 422); // 422 Unprocessable Entity
        }

        // 2. Check: Hitung total pengajuan dalam 30 hari terakhir
        $recentRequestsCount = PengajuanPerubahanSiswa::where('siswa_id', $siswa->id)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->count();

        if ($recentRequestsCount >= 5) {
            return response()->json([
                'status' => 'error',
                'message' => 'Batas pengajuan perubahan data telah tercapai',
                'detail' => 'Anda telah membuat 5 pengajuan dalam 30 hari terakhir. Coba lagi minggu depan.',
                'requests_this_month' => $recentRequestsCount,
                'user' => $user->fresh()->load('siswa')
            ], 429); // 429 Too Many Requests
        }

        // 3. Proses pengajuan jika lolos semua checks
        PengajuanPerubahanSiswa::create([
            'siswa_id' => $siswa->id,
            'data_perubahan' => $pendingChanges,
            'status' => 'pending',
            'keterangan' => 'Pengajuan dari aplikasi mobile'
        ]);
    }

    return response()->json([
        'status' => 'success',
        'message' => 'Proses pembaruan selesai',
        'direct_updated' => !empty($directChanges),
        'pending_submitted' => !empty($pendingChanges),
        'user' => $user->fresh()->load('siswa')
    ]);
}

    public function cetakBiodata(Request $request)
    {
        $user = $request->user();
        $siswa = $user->siswa;
        if (!$siswa) return response()->json(['message' => 'Data tidak ditemukan'], 404);
        $sekolah = DB::table('sekolahs')->first();
        $siswa->load('pengguna');
        $siswas = collect([$siswa]);
        $pdf = Pdf::loadView('admin.kesiswaan.mobile.pdf.biodata_siswa', compact('siswas', 'sekolah'));
        $pdf->setPaper('a4', 'portrait');
        return $pdf->stream('Biodata_' . $siswa->nama . '.pdf');
    }
}
