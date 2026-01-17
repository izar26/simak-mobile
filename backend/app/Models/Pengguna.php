<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class Pengguna extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'penggunas';

    protected $fillable = [
        'username',
        'password',
        'nama',
        'email',
        'peran_id_str',
        'no_hp',
        'alamat'
    ];

    protected $hidden = [
        'password',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    public function siswa()
    {
        return $this->hasOne(Siswa::class, 'peserta_didik_id', 'peserta_didik_id');
    }
}
