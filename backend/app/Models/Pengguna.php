<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Cache;
use App\Models\Role;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use App\Models\Siswa;
use App\Models\Sekolah;
use App\Models\Gtk;
use App\Models\TugasPegawaiDetail;
use App\Models\Tapel;
use App\Observers\PenggunaObserver;

use Illuminate\Support\Str;


class Pengguna extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * Nama tabel yang terhubung.
     */
    protected $table = 'penggunas';
    protected $with = ['roles'];
    protected $guard = 'web';

    /**
     * Atribut yang boleh diisi massal.
     */
    protected $fillable = [
        'sekolah_id',
        'username',
        'nama',
        'password',
        'alamat',
        'no_telepon',
        'no_hp',
        'peran_id_str',
        'status',

        'ptk_id',
        'peserta_didik_id',
        'tahun_pelajaran',
    ];

    /**
     * Atribut yang disembunyikan.
     */

    /**
     * Atribut yang di-casting.
     */
    protected $casts = [
        'password' => 'hashed', // Otomatis hash password saat diisi
    ];

    public function gtk()
    {
        // Menghubungkan kolom 'ptk_id' di tabel 'penggunas'
        // dengan kolom 'ptk_id' di tabel 'gtks'
        return $this->belongsTo(Gtk::class, 'ptk_id', 'ptk_id');
    }
    public function siswa()
    {
        // Menghubungkan kolom 'peserta_didik_id' di tabel 'penggunas'
        // dengan kolom 'peserta_didik_id' di tabel 'siswas'
        // Pastikan Anda sudah punya model App\Models\Siswa
        return $this->belongsTo(Siswa::class, 'peserta_didik_id', 'peserta_didik_id');
    }

    /**
     * Relasi ke tabel Sekolah (Opsional, tapi bagus untuk kelengkapan)
     */
    public function sekolah()
    {
        return $this->belongsTo(Sekolah::class, 'sekolah_id', 'sekolah_id');
    }

    public function scopeTapelAktif($query) // <--- PASTIKAN NAMA INI TEPAT
    {
        // Ambil data dari session
        $tapel = session('tapel_aktif');

        // Jika ada session tapel, filter query-nya
        if ($tapel) {
            // Asumsi kolomnya adalah 'tahun_pelajaran'
            return $query->where('tahun_pelajaran', $tapel);
        }

        return $query;
    }

    public static function mapPeranToRole($userOrPeran): ?string
    {
        // 1. Normalisasi Input
        if (is_string($userOrPeran)) {
            $peranAwal = $userOrPeran;
            $userObj = null;
        } else {
            $peranAwal = $userOrPeran->peran_id_str;
            $userObj = $userOrPeran;
        }

        // 2. LOGIKA KHUSUS PTK
        if ($peranAwal === 'PTK') {

            if (!$userObj || empty($userObj->ptk_id)) {
                \Log::warning("Gagal Mapping Role PTK: User {$userObj?->nama} tidak memiliki ptk_id.");
                return null;
            }

            $jenisPtk = \Illuminate\Support\Facades\DB::table('gtks')
                ->where('ptk_id', $userObj->ptk_id)
                ->value('jenis_ptk_id_str');

            if (!$jenisPtk) {
                \Log::warning("Gagal Mapping Role PTK: Data GTK untuk id {$userObj->ptk_id} tidak ditemukan di tabel gtks.");
                return null;
            }

            if (\Illuminate\Support\Str::contains($jenisPtk, 'Guru')) {
                return 'Guru';
            }

            if ($jenisPtk === 'Kepala Sekolah') {
                return 'Kepala Sekolah';
            }

            return 'Tenaga Kependidikan';
        }

        // 3. NON-PTK → LANGSUNG DARI TABEL PENGGUNA
        return $peranAwal ?: null;
    }


    public function syncDapodikRole(): void
{
    if (!$this->gtk) {
        Log::warning("DEBUG: User {$this->nama} tidak punya relasi GTK.");
        return;
    }

    $rolesToEnsure = [];

    // 1. Role Dasar (Guru/Tendik)
    $baseRole = self::mapPeranToRole($this);
    if ($baseRole) {
        $rolesToEnsure[] = $baseRole;
    }

    // 2. DEBUG JABATAN
    $tapelAktif = \App\Models\Tapel::where('is_active', 1)->first();
    Log::info("DEBUG: Mencoba Sync {$this->nama}. Tapel Aktif: " . ($tapelAktif->tahun_ajaran ?? 'KOSONG'));

    // Ambil semua TugasPegawaiDetail langsung berdasarkan ptk_id & tahun ajaran dari parent
    $tugasAktif = \App\Models\TugasPegawaiDetail::query()
        ->where('ptk_id', $this->ptk_id)
        ->whereHas('parent', function($q) use ($tapelAktif) {
            $q->where('tahun_pelajaran', $tapelAktif?->tahun_ajaran);
        })
        ->with('jabatan')
        ->get();

    Log::info("DEBUG: Jumlah data detail ditemukan: " . $tugasAktif->count());

    foreach ($tugasAktif as $detail) {
        $namaJabatan = $detail->jabatan?->nama_jabatan;
        if ($namaJabatan && Role::where('name', $namaJabatan)->exists()) {
            $rolesToEnsure[] = $namaJabatan;
        } else {
            Log::warning("DEBUG: Role '{$namaJabatan}' untuk detail ID {$detail->id} tidak ditemukan.");
        }
    }

    $finalRoles = collect($rolesToEnsure)->unique()->values()->toArray();
    $this->syncRoles($finalRoles);

    Log::info("DEBUG: Hasil Akhir Role untuk {$this->nama}: " . implode(', ', $finalRoles));
}

}
