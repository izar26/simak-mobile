@extends('layouts.admin')

@section('content')
<div class="container-xxl flex-grow-1 container-p-y">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h4 class="fw-bold m-0">
                <span class="text-muted fw-light">Kesiswaan /</span> Pengajuan Perubahan Data
            </h4>
            <p class="text-muted mb-0">Kelola permintaan pembaruan data dari siswa</p>
        </div>
        <nav aria-label="breadcrumb">
            <ol class="breadcrumb breadcrumb-style1 m-0">
                <li class="breadcrumb-item"><a href="{{ url('/admin/dashboard') }}">Home</a></li>
                <li class="breadcrumb-item active">Pengajuan</li>
            </ol>
        </nav>
    </div>

    {{-- STATS SUMMARY --}}
    <div class="row g-4 mb-4">
        <div class="col-sm-6 col-xl-4">
            <div class="card card-border-shadow-warning h-100">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">
                        <h5 class="mb-0 me-2">{{ $pendingCount }}</h5>
                        <small class="text-muted">Menunggu Verifikasi</small>
                    </div>
                    <div class="card-icon">
                        <span class="badge bg-label-warning rounded p-2">
                            <i class="bx bx-time-five bx-sm"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6 col-xl-4">
            <div class="card card-border-shadow-success h-100">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">
                        <h5 class="mb-0 me-2">{{ $approvedCount }}</h5>
                        <small class="text-muted">Total Disetujui</small>
                    </div>
                    <div class="card-icon">
                        <span class="badge bg-label-success rounded p-2">
                            <i class="bx bx-check-circle bx-sm"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-sm-6 col-xl-4">
            <div class="card card-border-shadow-danger h-100">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div class="card-title mb-0">
                        <h5 class="mb-0 me-2">{{ $rejectedCount }}</h5>
                        <small class="text-muted">Total Ditolak</small>
                    </div>
                    <div class="card-icon">
                        <span class="badge bg-label-danger rounded p-2">
                            <i class="bx bx-x-circle bx-sm"></i>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    {{-- MAIN CONTENT --}}
    <div class="card">
        {{-- TABS HEADER --}}
        <div class="card-header border-bottom">
            <ul class="nav nav-tabs card-header-tabs" role="tablist">
                <li class="nav-item">
                    <a href="{{ route('admin.kesiswaan.pengajuan-perubahan.index', ['tab' => 'pending']) }}" 
                       class="nav-link {{ $tab == 'pending' ? 'active' : '' }}">
                        <i class="bx bx-envelope me-1"></i> Masuk
                        @if($pendingCount > 0)
                            <span class="badge rounded-pill bg-danger ms-1">{{ $pendingCount }}</span>
                        @endif
                    </a>
                </li>
                <li class="nav-item">
                    <a href="{{ route('admin.kesiswaan.pengajuan-perubahan.index', ['tab' => 'history']) }}" 
                       class="nav-link {{ $tab == 'history' ? 'active' : '' }}">
                        <i class="bx bx-history me-1"></i> Riwayat Proses
                    </a>
                </li>
            </ul>
        </div>

        {{-- LIST CONTENT --}}
        <div class="card-body pt-0">
            @if($tab == 'pending')
                <div class="list-group list-group-flush mt-2">
                    @forelse($pengajuans as $item)
                        <div class="list-group-item list-group-item-action d-flex flex-column flex-md-row align-items-md-center justify-content-between border-bottom py-3 px-0">
                            {{-- LEFT: USER INFO --}}
                            <div class="d-flex align-items-center mb-2 mb-md-0" style="flex: 1;">
                                <div class="avatar avatar-md me-3">
                                    @if($item->siswa->foto && \Illuminate\Support\Facades\Storage::disk('public')->exists($item->siswa->foto))
                                        <img src="{{ asset('storage/' . $item->siswa->foto) }}" alt="Avatar" class="rounded-circle" style="object-fit: cover;">
                                    @else
                                        <span class="avatar-initial rounded-circle bg-label-primary">
                                            {{ substr($item->siswa->nama ?? '?', 0, 1) }}
                                        </span>
                                    @endif
                                </div>
                                <div>
                                    <h6 class="mb-0 fw-bold text-dark">{{ $item->siswa->nama ?? 'Siswa Tidak Ditemukan' }}</h6>
                                    <small class="text-muted">{{ $item->siswa->rombel->nama ?? 'Tanpa Kelas' }} • NISN: {{ $item->siswa->nisn ?? '-' }}</small>
                                </div>
                            </div>

                            {{-- CENTER: REQUEST SUMMARY --}}
                            <div class="mb-2 mb-md-0 px-md-3" style="flex: 2;">
                                <div class="d-flex flex-column">
                                    <span class="text-xs text-uppercase text-muted fw-bold mb-1" style="font-size: 0.7rem;">Mengajukan Perubahan:</span>
                                    <div class="d-flex flex-wrap gap-1">
                                        @php 
                                            $changes = array_keys($item->data_perubahan ?? []);
                                            $displayLimit = 4; 
                                        @endphp
                                        @foreach(array_slice($changes, 0, $displayLimit) as $field)
                                            <span class="badge bg-label-secondary">
                                                {{ ucwords(str_replace('_', ' ', $field)) }}
                                            </span>
                                        @endforeach
                                        @if(count($changes) > $displayLimit)
                                            <span class="badge bg-label-secondary">+{{ count($changes) - $displayLimit }}</span>
                                        @endif
                                    </div>
                                    @if($item->keterangan)
                                        <small class="text-muted mt-1 text-truncate" style="max-width: 300px;">
                                            <i class="bx bx-comment-detail me-1"></i> "{{ $item->keterangan }}"
                                        </small>
                                    @endif
                                </div>
                            </div>

                            {{-- RIGHT: TIME & ACTION --}}
                            <div class="d-flex align-items-center justify-content-md-end gap-3" style="flex: 1;">
                                <div class="text-end d-none d-md-block">
                                    <span class="d-block text-muted small">{{ $item->created_at->format('d M Y') }}</span>
                                    <span class="d-block text-xs text-muted">{{ $item->created_at->format('H:i') }}</span>
                                </div>
                                <a href="{{ route('admin.kesiswaan.pengajuan-perubahan.show', $item->id) }}" class="btn btn-primary shadow-sm btn-sm px-3">
                                    Tinjau <i class="bx bx-chevron-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                    @empty
                        <div class="text-center py-5">
                            <div class="mb-3">
                                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800926.png" alt="Empty" style="width: 150px; opacity: 0.7;">
                            </div>
                            <h5 class="text-muted">Tidak ada pengajuan baru</h5>
                            <p class="text-muted small">Saat ini tidak ada permintaan perubahan data yang perlu diverifikasi.</p>
                        </div>
                    @endforelse
                </div>
            @else
                {{-- HISTORY VIEW (CLEAN LOG STYLE) --}}
                <div class="table-responsive text-nowrap mt-3">
                    <table class="table table-hover">
                        <thead class="table-light">
                            <tr>
                                <th>Waktu</th>
                                <th>Siswa</th>
                                <th>Status</th>
                                <th>Operator</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            @forelse($pengajuans as $item)
                            <tr>
                                <td>
                                    <span class="fw-semibold">{{ $item->created_at->format('d/m/Y') }}</span>
                                    <br><small class="text-muted">{{ $item->created_at->format('H:i') }}</small>
                                </td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <div class="avatar avatar-xs me-2">
                                            @if($item->siswa->foto)
                                                <img src="{{ asset('storage/' . $item->siswa->foto) }}" alt="Avatar" class="rounded-circle">
                                            @else
                                                <span class="avatar-initial rounded-circle bg-label-secondary text-dark">
                                                    {{ substr($item->siswa->nama ?? '?', 0, 1) }}
                                                </span>
                                            @endif
                                        </div>
                                        <div class="d-flex flex-column">
                                            <span class="text-dark fw-medium">{{ $item->siswa->nama ?? '-' }}</span>
                                            <small class="text-muted">{{ count($item->data_perubahan ?? []) }} perubahan</small>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    @if($item->status == 'disetujui')
                                        <span class="badge bg-label-success">Disetujui</span>
                                    @else
                                        <span class="badge bg-label-danger">Ditolak</span>
                                    @endif
                                </td>
                                <td>
                                    <small class="text-muted fst-italic">
                                        {{ $item->catatan_operator ? Str::limit($item->catatan_operator, 25) : '(Tanpa Catatan)' }}
                                    </small>
                                </td>
                                <td class="text-end">
                                    <a href="{{ route('admin.kesiswaan.pengajuan-perubahan.show', $item->id) }}" class="btn btn-sm btn-icon btn-label-secondary">
                                        <i class="bx bx-chevron-right"></i>
                                    </a>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="5" class="text-center py-4 text-muted">Belum ada riwayat.</td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            @endif

            <div class="mt-4">
                {{ $pengajuans->links() }}
            </div>
        </div>
    </div>
</div>
@endsection
