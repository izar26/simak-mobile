<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanPerubahanSiswa extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'data_perubahan' => 'array',
    ];

    public function siswa()
    {
        return $this->belongsTo(Siswa::class, 'siswa_id', 'id');
    }
}
