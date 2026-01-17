<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BerkasSiswa extends Model
{
    use HasFactory;

    protected $table = 'berkas_siswas';
    protected $guarded = [];
}
