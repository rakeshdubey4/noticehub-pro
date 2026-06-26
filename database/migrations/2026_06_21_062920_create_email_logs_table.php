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
        Schema::create('email_logs', function (Blueprint $table) {
           $table->id();
        $table->string('recipient_email'); // Kisko email bheja gaya
        $table->integer('record_count');     // Report me total kitne notices include the
        $table->date('sent_date');          // Kis date execution matrix ko trigger dispatch mila
        $table->json('included_notice_ids')->nullable(); // Data reference map arrays tracking profiles
        $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_logs');
    }
};
