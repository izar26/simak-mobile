<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AppVersionController extends Controller
{
    public function checkVersion()
    {
        // Ganti nilai ini setiap kali rilis versi baru
        $latestVersion = '0.0.2'; // Contoh: Versi terbaru di server
        $forceUpdate = false; // Set true jika update bersifat wajib (critical bug fix)
        $changelog = "Perbaikan bug pada notifikasi dan peningkatan performa.";
        
        // Pastikan nama file APK sesuai dengan yang diupload di storage/app/public/apk/
        $apkFilename = 'app-release.apk'; 
        
        // URL Download (mengarah ke storage public link)
        // Pastikan sudah menjalankan `php artisan storage:link`
        $downloadUrl = url('storage/apk/' . $apkFilename);

        return response()->json([
            'latest_version' => $latestVersion,
            'force_update' => $forceUpdate,
            'download_url' => $downloadUrl,
            'changelog' => $changelog,
        ]);
    }
}
