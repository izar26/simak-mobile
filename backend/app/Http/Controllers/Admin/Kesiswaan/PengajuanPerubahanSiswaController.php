<?php

namespace App\Http\Controllers\Admin\Kesiswaan;

use App\Http\Controllers\Controller;
use App\Models\PengajuanPerubahanSiswa;
use App\Models\Siswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PengajuanPerubahanSiswaController extends Controller
{
    /**
     * Menampilkan daftar pengajuan perubahan data.
     */
    public function index(Request $request)
    {
        $tab = $request->query('tab', 'pending'); // pending or history

        $query = PengajuanPerubahanSiswa::with(['siswa.rombel'])
            ->orderBy('created_at', 'desc');

        if ($tab == 'history') {
            $query->whereIn('status', ['disetujui', 'ditolak']);
        } else {
            $query->where('status', 'pending');
        }

        $pengajuans = $query->paginate(9)->withQueryString();

        // Hitung badge count & Stats
        $pendingCount = PengajuanPerubahanSiswa::where('status', 'pending')->count();
        $approvedCount = PengajuanPerubahanSiswa::where('status', 'disetujui')->count();
        $rejectedCount = PengajuanPerubahanSiswa::where('status', 'ditolak')->count();

        return view('admin.kesiswaan.pengajuan_perubahan.index', compact('pengajuans', 'tab', 'pendingCount', 'approvedCount', 'rejectedCount'));
    }

    /**
     * Menampilkan detail pengajuan.
     */
    public function show($id)
    {
        $pengajuan = PengajuanPerubahanSiswa::with('siswa')->findOrFail($id);
        
        // Data perubahan dalam bentuk array
        $perubahan = $pengajuan->data_perubahan; // Sudah dicast ke array di Model

        return view('admin.kesiswaan.pengajuan_perubahan.show', compact('pengajuan', 'perubahan'));
    }

    /**
     * Menyetujui pengajuan perubahan.
     */
    public function approve(Request $request, $id)
    {
        $pengajuan = PengajuanPerubahanSiswa::findOrFail($id);

        if ($pengajuan->status !== 'pending') {
            return redirect()->back()->with('error', 'Pengajuan ini sudah diproses sebelumnya.');
        }

        DB::beginTransaction();
        try {
            // 1. Update Data Siswa
            $siswa = Siswa::findOrFail($pengajuan->siswa_id);
            
            // Ambil data perubahan (pastikan formatnya array key => value)
            $dataBaru = $pengajuan->data_perubahan;

            // Filter data agar hanya kolom yang ada di tabel siswa yang diupdate (untuk keamanan)
            // Namun, karena ini admin yang approve, kita asumsikan data valid.
            // Bisa ditambahkan validasi field whitelist jika perlu.
            
            $siswa->update($dataBaru);

            // 2. Update Status Pengajuan
            $pengajuan->update([
                'status' => 'disetujui',
                'catatan_operator' => $request->input('catatan_operator')
            ]);

            DB::commit();

            return redirect()->route('admin.kesiswaan.pengajuan-perubahan.index')
                ->with('success', 'Pengajuan berhasil disetujui dan data siswa telah diperbarui.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Terjadi kesalahan: ' . $e->getMessage());
        }
    }

    /**
     * Menolak pengajuan perubahan.
     */
    public function reject(Request $request, $id)
    {
        $request->validate([
            'catatan_operator' => 'required|string|max:255',
        ]);

        $pengajuan = PengajuanPerubahanSiswa::findOrFail($id);

        if ($pengajuan->status !== 'pending') {
            return redirect()->back()->with('error', 'Pengajuan ini sudah diproses sebelumnya.');
        }

        $pengajuan->update([
            'status' => 'ditolak',
            'catatan_operator' => $request->input('catatan_operator')
        ]);

        return redirect()->route('admin.kesiswaan.pengajuan-perubahan.index')
            ->with('success', 'Pengajuan berhasil ditolak.');
    }
}
