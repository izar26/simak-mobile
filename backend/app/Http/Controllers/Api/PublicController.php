<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class PublicController extends Controller
{
    public function getSekolah()
    {
        $sekolah = DB::table('sekolahs')->first();

        if (!$sekolah) {
            return response()->json(['message' => 'Data sekolah tidak ditemukan'], 404);
        }

        return response()->json([
            'nama' => $sekolah->nama,
            'alamat' => "{$sekolah->alamat_jalan}, {$sekolah->kecamatan}, {$sekolah->kabupaten_kota}",
            'logo' => $sekolah->logo,
            'telepon' => $sekolah->nomor_telepon,
            'email' => $sekolah->email,
            'website' => $sekolah->website,
        ]);
    }
}
