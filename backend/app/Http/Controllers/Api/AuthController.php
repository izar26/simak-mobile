<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Pengguna;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = Pengguna::where('username', $request->username)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Username atau Password salah'
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Load data siswa jika ada
        if ($user->siswa) {
            $user->load('siswa.berkas');
             // Fetch data sekolah manual
             $sekolah = DB::table('sekolahs')->first();
             // Fetch data tapel aktif
             $tapel = DB::table('tapel')->where('is_active', 1)->first();
             
             $user->siswa->sekolah = $sekolah;
             $user->siswa->tapel_aktif = $tapel;
        }

        return response()->json([
            'message' => 'Login berhasil',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil'
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('siswa.berkas');
        
        // Fetch data sekolah manual karena tidak ada Model Sekolah
        $sekolah = DB::table('sekolahs')->first();
        
        // Fetch data tapel aktif
        $tapel = DB::table('tapel')->where('is_active', 1)->first();
        
        // Inject data ke dalam object user agar frontend mudah mengaksesnya
        if ($user->siswa) {
            $user->siswa->sekolah = $sekolah;
            $user->siswa->tapel_aktif = $tapel;
        }

        return $user;
    }
}
