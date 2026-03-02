import { Platform, PermissionsAndroid, Alert } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

/**
 * Meminta izin penyimpanan dengan cara yang kompatibel untuk berbagai versi Android.
 * - Android 13+ (SDK 33+): Tidak perlu izin manual untuk public downloads.
 * - Android 10-12 (SDK 29-32): Tidak perlu WRITE_EXTERNAL_STORAGE jika pakai DownloadManager/MediaStore.
 * - Android 9- (SDK < 29): Butuh WRITE_EXTERNAL_STORAGE.
 */
export const checkAndRequestDownloadPermission = async (): Promise<boolean> => {
    // iOS selalu boleh (selama masuk sandbox/share sheet)
    if (Platform.OS === 'ios') return true;

    const androidVersion = Number(Platform.Version);

    // Android 13+ (Tiramisu) dan ke atas
    // Tidak butuh permission 'WRITE_EXTERNAL_STORAGE' lagi.
    if (androidVersion >= 33) {
        return true;
    }

    // Android 10 (Q) sampai 12 (S)
    // Konsep Scoped Storage diperkenalkan.
    // Jika kita target SDK 29+, kita bisa tulis ke folder Downloads/Pictures tanpa permission
    // ASALKAN kita pakai API yang benar (MediaStore / DownloadManager).
    // Jadi kita bisa skip request permission di sini, KECUALI kita butuh baca file orang lain.
    if (androidVersion >= 29) {
        return true;
    }

    // Android 9 (Pie) ke bawah
    // Masih butuh permission tradisional
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
                title: 'Izin Penyimpanan',
                message: 'Aplikasi butuh izin untuk menyimpan file ke memori internal.',
                buttonNeutral: 'Nanti',
                buttonNegative: 'Batal',
                buttonPositive: 'Izinkan',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn(err);
        return false;
    }
};

/**
 * Helper untuk konfigurasi Download Manager yang 'aman' dan 'resmi'.
 * Otomatis menangani path download publik.
 */
export const getDownloadConfig = (fileName: string, mimeType: string, description: string) => {
    const { dirs } = ReactNativeBlobUtil.fs;
    // Gunakan folder Download publik standar
    const path = `${dirs.DownloadDir}/${fileName}`;

    return {
        fileCache: true,
        addAndroidDownloads: {
            useDownloadManager: true, // Wajib agar notifikasi muncul & bypass permission di Android 10+
            notification: true,
            path: path,
            description: description,
            mediaScannable: true,
            title: fileName,
            mime: mimeType,
        }
    };
};

/**
 * Menyimpan file gambar/video ke MediaStore (Gallery) atau Download folder.
 * Menghindari penggunaan Base64 string untuk file besar agar tidak crash (OOM).
 */
export const saveToMediaStore = async (sourcePath: string, fileName: string, mediaType: 'photo' | 'video' | 'download' = 'photo'): Promise<string> => {
    // 1. Bersihkan path file://
    const cleanSource = sourcePath.replace('file://', '');

    // 2. Tentukan destinasi berdasarkan versi Android
    const androidVersion = Number(Platform.Version);

    // Android 10+ (API 29+): Gunakan MediaCollection (Scoped Storage friendly)
    if (Platform.OS === 'android' && androidVersion >= 29) {
        try {
            // Copy file ke folder publik 'Downloads/Simak Mobile'
            await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
                {
                    name: fileName,
                    parentFolder: 'Simak Mobile', // Akan membuat folder Simak Mobile di dalam Downloads
                    mimeType: mediaType === 'photo' ? 'image/png' : 'application/pdf'
                },
                'Download', // Gunakan tipe Download agar file tersimpan di root Downloads HP, bukan App Data
                cleanSource
            );
            return 'Tersimpan di folder Download/Simak Mobile';
            
        } catch (e) {
            console.warn('MediaCollection failed, falling back to FS copy', e);
            // Fallback ke metode copy biasa jika MediaCollection gagal
        }
    }

    // 3. Fallback (Android 9 ke bawah ATAU jika MediaCollection gagal)
    // Asumsi permission WRITE_EXTERNAL_STORAGE sudah diberikan
    const { dirs } = ReactNativeBlobUtil.fs;
    const targetDir = `${dirs.DownloadDir}/Simak Mobile`;

    // Buat folder Simak Mobile di dalam DownloadDir jika belum ada
    const isDir = await ReactNativeBlobUtil.fs.isDir(targetDir);
    if (!isDir) {
        await ReactNativeBlobUtil.fs.mkdir(targetDir);
    }

    const destPath = `${targetDir}/${fileName}`;
    
    // Copy file langsung ke folder public Download/Simak Mobile
    await ReactNativeBlobUtil.fs.cp(cleanSource, destPath);

    // Scan agar muncul di file manager/gallery
    if (Platform.OS === 'android') {
        ReactNativeBlobUtil.fs.scanFile([{ path: destPath, mime: mediaType === 'photo' ? 'image/png' : 'application/pdf' }]);
    }

    return destPath;
};
