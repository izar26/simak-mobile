<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pengajuan_perubahan_siswas', function (Blueprint $table) {
            $table->id();
            // Asumsi tabel siswas menggunakan 'id' sebagai primary key
            $table->unsignedBigInteger('siswa_id');
            // Menyimpan field apa saja yang diubah dalam format JSON
            // Contoh: {"nama": "Budi Baru", "tempat_lahir": "Bandung"}
            $table->json('data_perubahan');
            
            $table->enum('status', ['pending', 'disetujui', 'ditolak'])->default('pending');
            $table->text('keterangan')->nullable(); // Alasan pengajuan
            $table->text('catatan_operator')->nullable(); // Catatan dari operator saat approve/reject
            
            $table->timestamps();

            // Foreign key (optional, remove if siswas table structure is complex/different)
            // $table->foreign('siswa_id')->references('id')->on('siswas')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_perubahan_siswas');
    }
};