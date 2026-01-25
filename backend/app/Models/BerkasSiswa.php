<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BerkasSiswa extends Model
{
    use HasFactory;

    protected $fillable = [
        'siswa_id',
        'judul',
        'file_path',
        'file_type',
    ];

    // Relasi balik ke Siswa
    public function siswa()
    {
        return $this->belongsTo(Siswa::class);
    }
}
