<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Siswa extends Model
{
    use HasFactory;

    protected $table = 'siswas';
    
    // Karena kita hanya membaca data, unguarded aman
    protected $guarded = [];

    protected $appends = ['nama_kelas_fixed'];

    public function getNamaKelasFixedAttribute()
    {
        if (!empty($this->nama_rombel)) {
            return $this->nama_rombel;
        }

        // Cari di tabel rombels jika nama_rombel kosong
        $rombel = \Illuminate\Support\Facades\DB::table('rombels')
            ->where('anggota_rombel', 'like', '%' . $this->peserta_didik_id . '%')
            ->first();

        return $rombel ? $rombel->nama : 'Belum Masuk Kelas';
    }

    public function berkas()
    {
        return $this->hasMany(BerkasSiswa::class, 'siswa_id', 'id');
    }

    // Jika ingin mendefinisikan relasi balik ke pengguna (opsional)
    public function pengguna()
    {
        return $this->hasOne(Pengguna::class, 'peserta_didik_id', 'peserta_didik_id');
    }

    public function sekolah()
    {
        return $this->belongsTo(Sekolah::class, 'sekolah_id', 'sekolah_id');
    }
}
