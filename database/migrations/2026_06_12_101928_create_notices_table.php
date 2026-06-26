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
    Schema::create('notices', function (Blueprint $table) {
        $table->id();
        $table->string('company_name');
        $table->string('notice_type');
        $table->date('notice_date');
        $table->date('notice_post_date');
        $table->integer('notify_day'); // Kitne din baad notify karna hai
        $table->boolean('email_sent')->default(false);
        // Status: 'pending', 'filed', 'not needed'
        $table->string('filing_status')->default('pending'); 
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notices');
    }
};
