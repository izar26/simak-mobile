@extends('layouts.admin')

@section('content')
<h4 class="fw-bold py-3 mb-4">
    <span class="text-muted fw-light">Kesiswaan / Pengajuan Perubahan /</span> Detail Pengajuan
</h4>

<div class="row">
    <div class="col-md-8">
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Perbandingan Data</h5>
                <span class="badge bg-label-{{ $pengajuan->status == 'pending' ? 'warning' : ($pengajuan->status == 'disetujui' ? 'success' : 'danger') }}">
                    {{ ucfirst($pengajuan->status) }}
                </span>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered table-striped">
                        <thead class="table-light">
                            <tr>
                                <th>Kolom Data</th>
                                <th>Data Saat Ini (Database)</th>
                                <th>Data Diajukan (Baru)</th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($perubahan as $key => $newValue)
                                <tr>
                                    <td class="fw-bold">{{ ucwords(str_replace('_', ' ', $key)) }}</td>
                                    <td class="text-muted">
                                        {{ $pengajuan->siswa->$key ?? '(Kosong)' }}
                                    </td>
                                    <td class="text-primary fw-bold">
                                        {{ $newValue ?? '(Kosong)' }}
                                    </td>
                                </tr>
                            @empty
                                <tr>
                                    <td colspan="3" class="text-center">Tidak ada data yang berubah dalam JSON.</td>
                                </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>

                @if($pengajuan->keterangan)
                    <div class="alert alert-secondary mt-3 mb-0">
                        <h6 class="alert-heading fw-bold mb-1"><i class="bx bx-info-circle me-1"></i> Alasan Siswa:</h6>
                        <p class="mb-0">{{ $pengajuan->keterangan }}</p>
                    </div>
                @endif
            </div>
        </div>
    </div>

    <div class="col-md-4">
        {{-- CARD PROFIL SINGKAT --}}
        <div class="card mb-4">
            <div class="card-body text-center">
                <div class="avatar-wrapper mb-3 d-inline-block">
                    @if($pengajuan->siswa->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists($pengajuan->siswa->foto))
                        <img src="{{ asset('storage/' . $pengajuan->siswa->foto) }}" alt="Foto" class="rounded-circle" style="width: 100px; height: 100px; object-fit: cover;">
                    @else
                        <div class="avatar avatar-xl">
                            <span class="avatar-initial rounded-circle bg-label-primary fs-3">
                                {{ substr($pengajuan->siswa->nama, 0, 1) }}
                            </span>
                        </div>
                    @endif
                </div>
                <h5 class="mb-1">{{ $pengajuan->siswa->nama }}</h5>
                <p class="text-muted mb-0">{{ $pengajuan->siswa->nisn }}</p>
                <p class="text-muted small">{{ $pengajuan->siswa->rombel->nama ?? 'Tanpa Kelas' }}</p>
            </div>
        </div>

        {{-- CARD AKSI --}}
        @if($pengajuan->status == 'pending')
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Aksi Verifikasi</h5>
            </div>
            <div class="card-body">
                <form action="{{ route('admin.kesiswaan.pengajuan-perubahan.approve', $pengajuan->id) }}" method="POST" class="mb-2">
                    @csrf
                    @method('PATCH')
                    <input type="hidden" name="catatan_operator" value="Data telah diverifikasi dan disetujui.">
                    <button type="submit" class="btn btn-success w-100 mb-2" onclick="return confirm('Apakah Anda yakin ingin menyetujui perubahan ini? Data siswa akan langsung diperbarui.')">
                        <i class="bx bx-check-circle me-1"></i> Setujui Perubahan
                    </button>
                </form>

                <button type="button" class="btn btn-danger w-100" data-bs-toggle="modal" data-bs-target="#modalTolak">
                    <i class="bx bx-x-circle me-1"></i> Tolak Pengajuan
                </button>
            </div>
        </div>
        @else
        <div class="card">
            <div class="card-body">
                <h6 class="fw-bold">Riwayat Proses</h6>
                <p class="mb-1">Diproses pada: <br> <strong>{{ $pengajuan->updated_at->format('d M Y H:i') }}</strong></p>
                @if($pengajuan->catatan_operator)
                    <hr>
                    <p class="mb-1 fw-bold">Catatan Operator:</p>
                    <p class="text-muted mb-0">{{ $pengajuan->catatan_operator }}</p>
                @endif
            </div>
        </div>
        @endif
        
        <a href="{{ route('admin.kesiswaan.pengajuan-perubahan.index') }}" class="btn btn-outline-secondary w-100 mt-3">
            <i class="bx bx-arrow-back me-1"></i> Kembali
        </a>
    </div>
</div>

{{-- MODAL TOLAK --}}
<div class="modal fade" id="modalTolak" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-sm modal-dialog-centered">
        <form action="{{ route('admin.kesiswaan.pengajuan-perubahan.reject', $pengajuan->id) }}" method="POST" class="modal-content">
            @csrf
            @method('PATCH')
            <div class="modal-header">
                <h5 class="modal-title">Tolak Pengajuan</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div class="mb-3">
                    <label class="form-label">Alasan Penolakan</label>
                    <textarea name="catatan_operator" class="form-control" rows="3" required placeholder="Contoh: Data tidak sesuai dengan dokumen pendukung..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Batal</button>
                <button type="submit" class="btn btn-danger">Tolak</button>
            </div>
        </form>
    </div>
</div>

@endsection
