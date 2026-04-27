// ==========================================
// GLOBAL TYPE DEFINITIONS
// ==========================================

// ✅ API RESPONSE TYPES
export interface BaseResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// ✅ ERROR TYPES
export type ErrorCode =
  | 'NETWORK'
  | 'AUTH'
  | 'VALIDATION'
  | 'SERVER'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface AppError {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  isRetryable: boolean;
  originalError?: any;
}

// ✅ NEWS & ANNOUNCEMENTS
export interface NewsItem {
  id: number;
  judul: string;
  ringkasan?: string;
  isi: string;
  gambar?: string;
  penulis?: string;
  created_at: string;
  updated_at?: string;
}

export interface AnnouncementItem {
  id: number;
  type: 'libur' | 'berita' | 'agenda' | 'pengumuman';
  title: string;
  date: string;
  content?: string;
  isi?: string;
  desc?: string;
  image?: string;
  lokasi?: string;
  jam?: string;
}

// ✅ BERKAS (FILES)
export interface BerkasItem {
  id: number;
  judul: string;
  file_path: string;
  file_type: string;
  size?: number;
  created_at: string;
}

// ✅ USER & SISWA
export interface SiswaData {
  nisn: string;
  nama: string;
  jenis_kelamin: 'L' | 'P';
  tempat_lahir?: string;
  tanggal_lahir?: string;
  agama?: string;
  foto?: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  desa_kelurahan?: string;
  kecamatan?: string;
  kabupaten_kota?: string;
  kode_pos?: string;
  rombel?: string;
  berkas?: BerkasItem[];
  sekolah?: SekolahData;
}

export interface UserData {
  id: number;
  email: string;
  siswa?: SiswaData;
  role?: string;
}

export interface SekolahData {
  id: number;
  nama: string;
  logo?: string;
  background_kartu_siswa?: string;
}

// ✅ FORM DATA
export interface EditProfileFormData {
  nama: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  alamat: string;
  rt: string;
  rw: string;
  desa_kelurahan: string;
  kecamatan: string;
  kabupaten_kota: string;
  kode_pos: string;
  foto?: string;
  nik_ayah?: string;
  nik_ibu?: string;
  nik_wali?: string;
}

// ✅ NAVIGATION
export type RootStackParamList = {
  Npsn: undefined;
  Login: { schoolData?: SekolahData };
  MainTabs: undefined;
  AnnouncementDetail: { item: AnnouncementItem };
  EditProfile: { user: UserData };
  Berkas: { user: UserData };
  StudentCard: { user: UserData };
  ScannerScreen: undefined;
};

// ✅ API REQUEST/RESPONSE
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserData;
}

export interface UploadBerkasRequest {
  file: any;
  judul: string;
}

export interface UploadBerkasResponse {
  berkas: BerkasItem;
}

// ✅ CACHE METADATA
export interface CacheMeta {
  timestamp: number;
  etag?: string;
  expiresIn: number;
}
