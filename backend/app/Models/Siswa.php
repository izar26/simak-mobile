<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

use App\Models\Pengguna;
use App\Models\Rombel;
use App\Models\PelanggaranNilai;
use App\Models\MutasiKeluar;
use App\Models\Tagihan;
use App\Models\Tunggakan;
use App\Models\Pembayaran;
use App\Models\Voucher;
use App\Models\BerkasSiswa;
use App\Models\AlumniTestimoni;
use App\Models\TracerStudy;
use App\Models\Sekolah;

class Siswa extends Model
{
    use HasFactory;

    protected $table = 'siswas';
    protected $primaryKey = 'id';

    /**
     * =====================================================
     * BAGIAN ASLI (TIDAK DIUBAH)
     * =====================================================
     */
    protected $fillable = [
        'id','peserta_didik_id','registrasi_id','qr_token',
        'nama','nipd','nisn','nik','jenis_kelamin','tempat_lahir',
        'tanggal_lahir','agama_id','agama_id_str','email',
        'nomor_telepon_rumah','nomor_telepon_seluler','no_wa',
        'tinggi_badan','berat_badan','kebutuhan_khusus',
        'anak_keberapa',
        'alamat_jalan','rt','rw','nama_dusun','dusun',
        'desa_kelurahan','kecamatan','kabupaten_kota','provinsi',
        'kode_pos','lintang','bujur','kode_wilayah',
        'nama_ayah','nik_ayah','pekerjaan_ayah_id','pekerjaan_ayah_id_str',
        'nama_ibu','nik_ibu','pekerjaan_ibu_id','pekerjaan_ibu_id_str',
        'nama_wali','nik_wali','pekerjaan_wali_id','pekerjaan_wali_id_str',
        'sekolah_asal','tanggal_masuk_sekolah','jenis_pendaftaran_id',
        'jenis_pendaftaran_id_str','semester_id','anggota_rombel_id',
        'rombongan_belajar_id','tingkat_pendidikan_id','nama_rombel',
        'kurikulum_id','kurikulum_id_str','status','foto',
        'no_kk','hobi','cita_cita','no_wa_ayah','no_wa_ibu',
        'no_wa_wali','npsn_sekolah_asal','no_seri_ijazah',
        'no_seri_skhun','no_ujian_nasional','no_registrasi_akta_lahir',
        'no_kks','penerima_kps','no_kps','layak_pip',
        'alasan_layak_pip','penerima_kip','no_kip','nama_di_kip',
        'alasan_menolak_kip','tahun_lahir_ayah',
        'pendidikan_ayah_id_str','penghasilan_ayah_id_str',
        'kebutuhan_khusus_ayah','tahun_lahir_ibu',
        'pendidikan_ibu_id_str','penghasilan_ibu_id_str',
        'kebutuhan_khusus_ibu','tahun_lahir_wali',
        'pendidikan_wali_id_str','penghasilan_wali_id_str',
        'alat_transportasi_id_str','jenis_tinggal_id_str',
        'jarak_rumah_ke_sekolah_km','waktu_tempuh_menit',
        'jumlah_saudara_kandung',
    ];

    protected $casts = [
        'riwayat_penyakit' => 'array',
        'data_ayah' => 'array',
        'data_ibu' => 'array',
        'data_wali_laki' => 'array',
        'data_wali_perempuan' => 'array',
        'kepribadian' => 'array',
        'prestasi' => 'array',
        'tanggal_lahir' => 'date:Y-m-d',
        'tanggal_masuk_sekolah' => 'date',
    ];


    /**
     * =====================================================
     * RELASI ASLI (TIDAK DIUBAH)
     * =====================================================
     */

    public function tracer(): HasOne
    {
        return $this->hasOne(TracerStudy::class, 'siswa_id', 'id');
    }

    public function testimoni(): HasOne
    {
        return $this->hasOne(AlumniTestimoni::class, 'siswa_id', 'id');
    }

    public function rombel(): BelongsTo
    {
        return $this->belongsTo(Rombel::class, 'rombongan_belajar_id', 'rombongan_belajar_id');
    }

    public function pelanggaran(): HasMany
    {
        return $this->hasMany(PelanggaranNilai::class, 'nipd', 'nipd');
    }

    public function mutasiKeluar()
    {
        return $this->morphOne(MutasiKeluar::class, 'keluarable');
    }

    public function tagihans()
    {
        return $this->hasMany(Tagihan::class);
    }

    public function tunggakans()
    {
        return $this->hasMany(Tunggakan::class);
    }

    public function pembayarans()
    {
        return $this->hasMany(Pembayaran::class);
    }

    public function vouchers()
    {
        return $this->hasMany(Voucher::class);
    }

    public function berkas()
    {
        return $this->hasMany(BerkasSiswa::class, 'siswa_id');
    }

    public function pengguna()
    {
        return $this->hasOne(Pengguna::class, 'peserta_didik_id', 'peserta_didik_id');
    }

    public function scopeAktif($query)
    {
        return $query->where('status', 'Aktif');
    }


    /**
     * =====================================================
     * TAMBAHAN DARI MODEL KEDUA (TANPA MENGUBAH YANG LAMA)
     * =====================================================
     */

    protected $appends = ['nama_kelas_fixed'];

    public function getNamaKelasFixedAttribute()
    {
        if (!empty($this->nama_rombel)) {
            return $this->nama_rombel;
        }

        $rombel = DB::table('rombels')
            ->where('anggota_rombel', 'like', '%' . $this->peserta_didik_id . '%')
            ->first();

        return $rombel ? $rombel->nama : 'Belum Masuk Kelas';
    }

    public function sekolah()
    {
        return $this->belongsTo(Sekolah::class, 'sekolah_id', 'sekolah_id');
    }

    public function pengajuan_perubahan()
    {
        return $this->hasMany(PengajuanPerubahanSiswa::class, 'siswa_id');
    }
}
