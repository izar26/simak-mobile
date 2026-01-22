<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Cetak Biodata Siswa</title>

    <style>
        /* Margin Halaman (Atas Kanan Bawah Kiri) - Bawah agak lebar buat Footer */
        @page { margin: 1cm 2cm 1.5cm 2cm; }

        body {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
        }
      /* WRAPPER PER SISWA (PENTING BUAT MULTI-PAGE) */
        .page-container {
            display: block;
            width: 100%;
            page-break-after: always; /* Paksa ganti halaman setelah div ini selesai */
            position: relative;
        }

        /* Hapus break di halaman terakhir agar tidak ada halaman kosong */
        .page-container:last-child {
            page-break-after: auto;
        }

        /* HEADER */
        .header-table { width: 100%; border-bottom: 3px solid #000; margin-bottom: 10px; padding-bottom: 5px; }
        .header-table td { vertical-align: middle; text-align: center; }
        .logo { width: 75px; height: auto; object-fit: contain; }

        .kop-text { text-align: center; padding: 0 10px; }
        .kop-h1 { font-size: 14px; font-weight: bold; margin: 0; text-transform: uppercase; }
        .kop-h2 { font-size: 16px; font-weight: bold; margin: 2px 0; text-transform: uppercase; }
        .kop-address { font-size: 10px; font-style: italic; margin-top: 2px; }

        /* JUDUL */
        .page-title { text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline; margin-top: 15px; margin-bottom: 5px; text-transform: uppercase; }
        .page-subtitle { text-align: center; font-size: 10px; margin-bottom: 20px; color: #333; }

        /* SECTIONS */
        .section-title { font-size: 11px; font-weight: bold; margin: 10px 0 5px 0; background-color: #e0e0e0; padding: 4px; border-left: 3px solid #000; text-transform: uppercase; }
        .sub-header { font-weight: bold; border-bottom: 1px solid #000; margin-bottom: 5px; padding-bottom: 2px; text-transform: uppercase; font-size: 10px; }

        /* TABEL */
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }
        .data-table td { padding: 2px 0; vertical-align: top; }

        /* Lebar Kolom Standar */
        .label { width: 145px; font-weight: bold; }
        .sep { width: 10px; text-align: center; }
        .val { width: auto; }

        /* Lebar Kolom Tabel Belah Dua (Ortu) */
        .label-half { width: 35%; font-weight: bold; }
        .sep-half { width: 5%; text-align: center; }
        .val-half { width: 60%; }

        /* FOTO & TTD */
        .photo-wrapper { text-align: center; vertical-align: top; padding-top: 5px; }
        .photo-container { width: 3cm; height: 4cm; border: 1px solid #000; padding: 2px; object-fit: cover; display: inline-block; }
/* Tambahkan ini di dalam tag <style> */
    /* Tanda Tangan Wrapper - Pastikan tidak pecah */
    .signature-wrapper {
        margin-top: 30px;
        page-break-inside: avoid; /* Jangan potong tanda tangan ke halaman lain */
            width: 100%;
        }
        .signature-box { text-align: center; width: 250px; float: right; margin-right: 10px; }

        /* Footer Fixed di Bawah Setiap Halaman */
        footer { position: fixed; bottom: 0; left: 0; right: 0; height: 20px; font-size: 8px; text-align: right; border-top: 1px solid #ccc; padding-top: 2px; color: #555; }
        .keep-together {
            page-break-inside: avoid;
            break-inside: avoid;
            display: block;
            width: 100%;
            margin-bottom: 10px;
        }
        .dotted-line {
            border-bottom: 1px dotted #000;
            width: 100%;
            height: 20px;
            margin-bottom: 5px;
        }
        .dots { border-bottom: 1px dotted #000; display: inline-block; min-width: 100px; height: 12px; }
.indent-item { padding-left: 20px; }
  .section-wrapper {
    page-break-inside: avoid;
    margin-bottom: 15px;
    display: block;
    width: 100%;
}
    </style>
</head>
<body>
    <footer>
        Dicetak melalui Sistem Informasi Sekolah pada {{ \Carbon\Carbon::now()->translatedFormat('d F Y H:i') }}
    </footer>

    {{-- LOOPING UTAMA --}}
    @foreach($siswas as $siswa)
    <div class="page-container">

        {{-- LOGIC KELAS --}}
        @php
            $namaKelas = $siswa->nama_rombel;
            if (empty($namaKelas)) $namaKelas = optional($siswa->rombel)->nama;
            if (empty($namaKelas) && $siswa->peserta_didik_id) {
                $rombelJson = \Illuminate\Support\Facades\DB::table('rombels')->where('anggota_rombel', 'like', '%'.$siswa->peserta_didik_id.'%')->first();
                if ($rombelJson) $namaKelas = $rombelJson->nama;
            }
            $namaKelas = $namaKelas ?? 'Belum Masuk Kelas';
        @endphp

        {{-- KOP SURAT --}}
        <table class="header-table">
            <tr>
                <td style="width: 15%; text-align: left;">
                    @if(isset($sekolah->logo) && file_exists(storage_path('app/public/' . $sekolah->logo)))
                        <img src="{{ public_path('storage/' . $sekolah->logo) }}" class="logo">
                    @else
                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/9c/Logo_Tut_Wuri_Handayani.png" class="logo" style="opacity: 0.6">
                    @endif
                </td>
                <td class="kop-text" style="width: 70%;">
                    <div class="kop-h1">PEMERINTAH PROVINSI JAWA BARAT</div>
                    <div class="kop-h1">DINAS PENDIDIKAN</div>
                    <div class="kop-h2">{{ strtoupper($sekolah->nama ?? 'SMK MERDEKA BANDUNG') }}</div>
                    <div class="kop-address">
                        {{ $sekolah->alamat_jalan ?? 'Jl. Pahlawan No. 123' }}
                        {{ isset($sekolah->kecamatan) ? ', '.$sekolah->kecamatan : '' }}
                        {{ isset($sekolah->kabupaten_kota) ? ', '.$sekolah->kabupaten_kota : '' }}
                        <br>
                        Website: {{ $sekolah->website ?? '-' }} | Email: {{ $sekolah->email ?? '-' }}
                    </div>
                </td>
                <td style="width: 15%;"></td>
            </tr>
        </table>

        <div class="page-title">BIODATA PESERTA DIDIK</div>
        <div class="page-subtitle">Laporan data per tanggal: {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</div>

        {{-- A. IDENTITAS --}}
        <div class="section-title">A. KETERANGAN PRIBADI</div>
        <table class="data-table">
            <tr>
                <td style="width: 75%; padding-right: 10px;">
                    <table class="data-table">
                        <tr><td class="label">Nama Lengkap</td><td class="sep">:</td><td class="val"><b>{{ $siswa->nama }}</b></td></tr>
                        <tr><td class="label">NIPD / NISN</td><td class="sep">:</td><td class="val">{{ $siswa->nipd ?? '-' }} / {{ $siswa->nisn ?? '-' }}</td></tr>
                        <tr><td class="label">NIK</td><td class="sep">:</td><td class="val">{{ $siswa->nik ?? '-' }}</td></tr>
                        <tr><td class="label">No. KK</td><td class="sep">:</td><td class="val">{{ $siswa->no_kk ?? '-' }}</td></tr>
                        <tr><td class="label">Tempat, Tgl Lahir</td><td class="sep">:</td><td class="val">{{ $siswa->tempat_lahir }}, {{ $siswa->tanggal_lahir ? \Carbon\Carbon::parse($siswa->tanggal_lahir)->translatedFormat('d F Y') : '-' }}</td></tr>
                        <tr><td class="label">Jenis Kelamin</td><td class="sep">:</td><td class="val">{{ ($siswa->jenis_kelamin == 'L' || $siswa->jenis_kelamin == 'Laki-laki') ? 'Laki-laki' : 'Perempuan' }}</td></tr>
                        <tr><td class="label">Agama</td><td class="sep">:</td><td class="val">{{ $siswa->agama_id_str ?? '-' }}</td></tr>
                        <tr><td class="label">Kewarganegaraan</td><td class="sep">:</td><td class="val">{{ $siswa->kewarganegaraan ?? 'Indonesia' }}</td></tr>
                        {{-- DATA BARU: Kebutuhan Khusus & Fisik --}}
                        <tr><td class="label">Kebutuhan Khusus</td><td class="sep">:</td><td class="val">{{ $siswa->kebutuhan_khusus ?? 'Tidak Ada' }}</td></tr>
                        <tr><td class="label">Tinggi / Berat Badan</td><td class="sep">:</td><td class="val">{{ $siswa->tinggi_badan ?? '...' }} cm / {{ $siswa->berat_badan ?? '...' }} kg</td></tr>

                        <tr><td class="label">Anak ke</td><td class="sep">:</td><td class="val">{{ $siswa->anak_keberapa ?? '-' }} (dari {{ $siswa->jumlah_saudara_kandung ?? '-' }} bersaudara)</td></tr>
                        <tr><td class="label">Alamat Rumah</td><td class="sep">:</td><td class="val">
                            {{ $siswa->alamat_jalan ?? '-' }} <br>
                            {{-- DATA BARU: Dusun --}}
                            {{ $siswa->dusun ? 'Dsn. '.$siswa->dusun : '' }}
                            RT {{ $siswa->rt ?? '-' }} / RW {{ $siswa->rw ?? '-' }} <br>
                            {{ $siswa->desa_kelurahan ?? '-' }}, {{ $siswa->kecamatan ?? '-' }} <br>
                            {{ $siswa->kabupaten_kota ?? '-' }} - {{ $siswa->kode_pos ?? '-' }}
                        </td></tr>
                        <tr><td class="label">No. Handphone</td><td class="sep">:</td><td class="val">{{ $siswa->nomor_telepon_seluler ?? '-' }}</td></tr>
                        <tr><td class="label">No. WA</td><td class="sep">:</td><td class="val">{{ $siswa->no_wa ?? '-' }}</td></tr>
                        <tr><td class="label">Email</td><td class="sep">:</td><td class="val">{{ $siswa->pengguna->username ?? '-' }}</td></tr>
                        <tr><td class="label">Hobi</td><td class="sep">:</td><td class="val">{{ $siswa->hobi ?? '-' }}</td></tr>
                        <tr><td class="label">Cita-cita</td><td class="sep">:</td><td class="val">{{ $siswa->cita_cita ?? '-' }}</td></tr>
                    </table>
                </td>
                <td class="photo-wrapper" style="width: 25%;">
                    @if($siswa->foto && file_exists(storage_path('app/public/' . $siswa->foto)))
                        <img src="{{ public_path('storage/' . $siswa->foto) }}" class="photo-container">
                    @else
                        <div class="photo-container" style="display: flex; align-items: center; justify-content: center; color: #aaa; background: #eee;">
                            <br><br>FOTO<br>3x4
                        </div>
                    @endif
                </td>
            </tr>
        </table>

        {{-- B. TRANSPORT --}}
        <div class="section-title">B. KETERANGAN TEMPAT TINGGAL & TRANSPORT</div>
        <table class="data-table">
            <tr><td class="label">Tempat Tinggal</td><td class="sep">:</td><td class="val">{{ $siswa->jenis_tinggal_id_str ?? '-' }}</td></tr>
            <tr><td class="label">Alat Transportasi</td><td class="sep">:</td><td class="val">{{ $siswa->alat_transportasi_id_str ?? '-' }}</td></tr>
            <tr><td class="label">Jarak ke Sekolah</td><td class="sep">:</td><td class="val">{{ $siswa->jarak_rumah_ke_sekolah_km ? $siswa->jarak_rumah_ke_sekolah_km.' km' : '-' }}</td></tr>
            <tr><td class="label">Waktu Tempuh</td><td class="sep">:</td><td class="val">{{ $siswa->waktu_tempuh_menit ? $siswa->waktu_tempuh_menit.' menit' : '-' }}</td></tr>
        </table>

        {{-- C. ORTU --}}
        <div class="section-title">C. KETERANGAN ORANG TUA / WALI</div>
        <table class="data-table" style="width: 100%;">
            <tr>
                <td style="width: 48%; padding-right: 2%;">
                    <div class="sub-header">AYAH KANDUNG</div>
                    <table class="data-table" style="width: 100%;">
                        <tr><td class="label-half">Nama</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->nama_ayah ?? '-' }}</td></tr>
                        <tr><td class="label-half">Tahun Lahir</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->tahun_lahir_ayah ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pendidikan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pendidikan_ayah_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pekerjaan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pekerjaan_ayah_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Penghasilan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->penghasilan_ayah_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">No. WA</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->no_wa_ayah ?? '-' }}</td></tr>
                    </table>
                </td>
                <td style="width: 48%; padding-left: 2%;">
                    <div class="sub-header">IBU KANDUNG</div>
                    <table class="data-table" style="width: 100%;">
                        <tr><td class="label-half">Nama</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->nama_ibu ?? '-' }}</td></tr>
                        <tr><td class="label-half">Tahun Lahir</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->tahun_lahir_ibu ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pendidikan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pendidikan_ibu_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pekerjaan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pekerjaan_ibu_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Penghasilan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->penghasilan_ibu_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">No. WA</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->no_wa_ibu ?? '-' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- WALI --}}
        <table class="data-table" style="margin-top: 5px;">
            <tr>
                <td style="width: 100%;">
                    <div class="sub-header">WALI</div>
                    <table class="data-table" style="width: 50%;">
                        <tr><td class="label-half">Nama Wali</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->nama_wali ?? '-' }}</td></tr>
                        <tr><td class="label-half">Tahun Lahir</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->tahun_lahir_wali ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pendidikan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pendidikan_wali_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Pekerjaan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->pekerjaan_wali_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">Penghasilan</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->penghasilan_wali_id_str ?? '-' }}</td></tr>
                        <tr><td class="label-half">No. WA</td><td class="sep-half">:</td><td class="val-half">{{ $siswa->no_wa_wali ?? '-' }}</td></tr>
                    </table>
                </td>
            </tr>
        </table>

        {{-- D. AKADEMIK --}}
        <div class="section-title">D. DATA AKADEMIK & BANTUAN SOSIAL</div>
        <table class="data-table">
            <tr><td class="label">Sekolah Asal</td><td class="sep">:</td><td class="val">{{ $siswa->sekolah_asal ?? '-' }} (NPSN: {{ $siswa->npsn_sekolah_asal ?? '-' }})</td></tr>
            <tr><td class="label">No. Ijazah SMP</td><td class="sep">:</td><td class="val">{{ $siswa->no_seri_ijazah ?? '-' }}</td></tr>
            <tr><td class="label">No. SKHUN</td><td class="sep">:</td><td class="val">{{ $siswa->no_seri_skhun ?? '-' }}</td></tr>
            <tr><td class="label">No. Peserta UN</td><td class="sep">:</td><td class="val">{{ $siswa->no_ujian_nasional ?? '-' }}</td></tr>
            <tr><td class="label">Diterima di Kelas</td><td class="sep">:</td><td class="val">{{ $namaKelas }}</td></tr>
            <tr><td class="label">Tanggal Masuk</td><td class="sep">:</td><td class="val">{{ $siswa->tanggal_masuk_sekolah ? \Carbon\Carbon::parse($siswa->tanggal_masuk_sekolah)->translatedFormat('d F Y') : '-' }}</td></tr>
            <tr><td class="label">Status Siswa</td><td class="sep">:</td><td class="val">{{ $siswa->status ?? 'Aktif' }}</td></tr>

            {{-- DATA BARU: Detail Bantuan --}}
            <tr><td class="label" style="vertical-align: top; padding-top: 5px;">Status Bantuan</td><td class="sep" style="vertical-align: top; padding-top: 5px;">:</td><td class="val" style="padding-top: 5px;">
                <table style="width: 100%; font-size: 11px;">
                    <tr>
                        <td style="width: 15%;"><b>PIP</b></td>
                        <td>: {{ $siswa->layak_pip ?? 'Tidak' }} {{ $siswa->alasan_layak_pip ? '('.$siswa->alasan_layak_pip.')' : '' }}</td>
                    </tr>
                    <tr>
                        <td><b>KIP</b></td>
                        <td>: {{ $siswa->penerima_kip == 'Ya' ? 'Ya (No: '.$siswa->no_kip.')' : 'Tidak' }}</td>
                    </tr>
                    <tr>
                        <td><b>KPS</b></td>
                        <td>: {{ $siswa->penerima_kps == 'Ya' ? 'Ya (No: '.$siswa->no_kps.')' : 'Tidak' }}</td>
                    </tr>
                    <tr>
                        <td><b>KKS</b></td>
                        <td>: {{ $siswa->no_kks ? $siswa->no_kks : '-' }}</td>
                    </tr>
                </table>
            </td></tr>
        </table>

        {{-- TANDA TANGAN --}}
        <div class="signature-wrapper">
            <div class="signature-box">
                <p>{{ $sekolah->kabupaten_kota ?? 'Bandung' }}, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}
                    <br>
                Siswa yang bersangkutan,</p>
                <br><br><br><br>
                <span style="font-weight: bold; text-decoration: underline;">{{ $siswa->nama }}</span>
                    <br>
                NISN: {{ $siswa->nisn ?? '...........................' }}
            </div>
            <div style="clear: both;"></div>
        </div>

    </div> {{-- END PAGE CONTAINER --}}
    <div class="keep-together">

    <div class="section-title">E. MENINGGALKAN SEKOLAH</div>
    <table class="data-table">
        <tr>
            <td style="width: 30%;">Tamat Belajar</td>
            <td class="sep">:</td>
            <td class="val">
                Tanggal: {{ $siswa->status == 'Lulus' ? \Carbon\Carbon::parse($siswa->tanggal_keluar)->translatedFormat('d F Y') : '.................' }}
                No. Ijazah: {{ $siswa->no_ijazah_keluar ?? '.................' }}
            </td>
        </tr>
        <tr>
            <td class="indent-item">Melanjutkan sekolah ke</td>
            <td class="sep">:</td>
            <td class="val">{{ $siswa->lanjut_ke ?? '' }}</td>
        </tr>
        <tr>
            <td class="indent-item">Alamat</td>
            <td class="sep">:</td>
            <td class="val">{{ $siswa->alamat_lanjut ?? '' }}</td>
        </tr>

        <tr>
            <td style="padding-top: 10px;">Pindah sekolah ke</td>
            <td class="sep" style="padding-top: 10px;">:</td>
            <td class="val" style="padding-top: 10px;">{{ $siswa->status == 'Mutasi' || $siswa->status == 'Pindah' ? ($siswa->pindah_ke ?? '') : '' }}</td>
        </tr>
        <tr>
            <td class="indent-item">Tanggal pindah</td>
            <td class="sep">:</td>
            <td class="val">
                Tanggal: {{ ($siswa->status == 'Mutasi' || $siswa->status == 'Pindah') && $siswa->tanggal_keluar ? \Carbon\Carbon::parse($siswa->tanggal_keluar)->translatedFormat('d F Y') : '.................' }}
                dari kelas: {{ $namaKelas }}
            </td>
        </tr>
        <tr>
            <td class="indent-item">Alamat sekolah</td>
            <td class="sep">:</td>
            <td class="val">{{ $siswa->alamat_sekolah_pindah ?? '' }}</td>
        </tr>
        <tr>
            <td class="indent-item">Alamat pindah</td>
            <td class="sep">:</td>
            <td class="val">{{ $siswa->alamat_rumah_pindah ?? '' }}</td>
        </tr>

        <tr>
            <td style="padding-top: 10px;">Putus sekolah</td>
            <td class="sep" style="padding-top: 10px;">:</td>
            <td class="val" style="padding-top: 10px;">
            Tanggal: {{ in_array($siswa->status, ['Putus Sekolah', 'Dikeluarkan', 'Mengundurkan Diri']) ? \Carbon\Carbon::parse($siswa->tanggal_keluar)->translatedFormat('d F Y') : '.................' }}
    <br> {{-- Tambahkan enter biar rapi --}}
    Alasan: {{ in_array($siswa->status, ['Putus Sekolah', 'Dikeluarkan', 'Mengundurkan Diri']) ? ($siswa->alasan_keluar ?? '-') : '.................' }}
            </td>
        </tr>
    </table>
    </div>
    <div class="section-wrapper">
        <div class="section-title">F. LAIN-LAIN</div>
        <div style="padding: 5px 0;">
            <strong>Catatan penting selama siswa belajar di sekolah ini:</strong>
            <div style="margin-top: 10px;">
                <div class="dotted-line"></div>
                <div class="dotted-line"></div>
                <div class="dotted-line"></div>
                <div class="dotted-line"></div>
                <div class="dotted-line"></div>
            </div>
        </div>
    </div>

            {{-- TANDA TANGAN --}}
            <div class="signature-wrapper">
                <div class="signature-box">
                    <p>{{ $sekolah->kabupaten_kota ?? 'Bandung' }}, {{ \Carbon\Carbon::now()->translatedFormat('d F Y') }}</p>
                    <p>Kepala Sekolah,</p>
                    <br><br><br><br>
                    <p style="font-weight: bold; text-decoration: underline;">{{ $sekolah->nama_kepala_sekolah ?? '(...........................................)' }}</p>
                    <p>NIP. {{ $sekolah->nip_kepala_sekolah ?? '...........................' }}</p>
                </div>
                <div style="clear: both;"></div>
            </div>

        </div> {{-- END PAGE CONTAINER --}}
        @endforeach
</body>
    </html>