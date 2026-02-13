import ReactNativeBlobUtil from 'react-native-blob-util';
import { Platform, Alert, Linking } from 'react-native';
import packageJson from '../../package.json';
import api from './api';

const ANDROID_PACKAGE_NAME = 'com.simakmobile'; // Sesuaikan jika beda

interface VersionResponse {
    latest_version: string;
    force_update: boolean;
    download_url: string;
    changelog: string;
}

export const checkAppUpdate = async (): Promise<VersionResponse | null> => {
    if (Platform.OS !== 'android') return null;

    try {
        // 1. Fetch Version dari Backend
        // Gunakan axios instance dari api.ts yang sudah ada base URL-nya
        const response = await api.get('/app/version');
        const data: VersionResponse = response.data;

        // 2. Bandingkan Versi
        const currentVersion = packageJson.version;
        if (compareVersions(data.latest_version, currentVersion) > 0) {
            return data;
        }
        return null;
    } catch (error) {
        console.error('Failed to check update:', error);
        return null;
    }
};

export const downloadAndInstallApk = async (
    url: string,
    onProgress: (progress: number) => void
): Promise<void> => {
    try {
        const { dirs } = ReactNativeBlobUtil.fs;
        const filePath = `${dirs.DownloadDir}/simak-update.apk`;

        // 1. Download File
        await ReactNativeBlobUtil.config({
            path: filePath,
            fileCache: true,
            addAndroidDownloads: {
                useDownloadManager: true,
                notification: true,
                title: 'Mengunduh Update SIMAK',
                description: 'Mohon tunggu...',
                mime: 'application/vnd.android.package-archive',
                path: filePath,
            },
        })
            .fetch('GET', url)
            .progress((received, total) => {
                const percentage = Math.floor((Number(received) / Number(total)) * 100);
                onProgress(percentage);
            });

        // 2. Install APK
        ReactNativeBlobUtil.android.actionViewIntent(
            filePath,
            'application/vnd.android.package-archive'
        );
    } catch (error) {
        Alert.alert('Error', 'Gagal mengunduh update.');
        console.error(error);
    }
};

// Helper SemVer Compare
const compareVersions = (v1: string, v2: string) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const val1 = parts1[i] || 0;
        const val2 = parts2[i] || 0;
        if (val1 > val2) return 1;
        if (val1 < val2) return -1;
    }
    return 0;
};
