<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\Api\SiswaController;

Route::get('/sekolah', [PublicController::class, 'getSekolah']);
Route::get('/berita', [PublicController::class, 'getBerita']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/siswa/jadwal-hari-ini', [SiswaController::class, 'getJadwalHariIni']);
    Route::get('/siswa/jadwal-mingguan', [SiswaController::class, 'getJadwalMingguan']);
    Route::get('/siswa/absensi', [SiswaController::class, 'getRekapAbsensi']);
    Route::post('/siswa/update', [SiswaController::class, 'update']);
    Route::post('/siswa/upload-berkas', [SiswaController::class, 'uploadBerkas']);
    Route::post('/siswa/hapus-berkas', [SiswaController::class, 'hapusBerkas']);
    Route::get('/siswa/cetak-biodata', [SiswaController::class, 'cetakBiodata']);
});
