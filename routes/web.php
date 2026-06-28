<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\ReportController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});



// Public route: Guest aur Registered users dono dashboard data view kar sakte hain
Route::get('/', [NoticeController::class, 'index'])->name('home');
Route::get('/dashboard', [NoticeController::class, 'index'])->name('dashboard');
Route::get('/reports/excel', [ReportController::class, 'exportExcel'])->name('reports.export.excel');
Route::get('/reports/pdf', [ReportController::class, 'exportPdf'])->name('reports.export.pdf');
Route::put('/user/change-password', [NoticeController::class, 'changePassword'])->name('user.change-password');
Route::get('/companies/suggestions', [NoticeController::class, 'companySuggestions']);
Route::get('/autocomplete/company', [NoticeController::class, 'companySuggestions'])
    ->name('autocomplete.company');

Route::get('/autocomplete/notice-type', [NoticeController::class, 'noticeTypeSuggestions'])
    ->name('autocomplete.notice-type');

// Protected Admin Routes: Sirf login verified admin users access kar payenge

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/notices', [NoticeController::class, 'store'])->name('notices.store');
    Route::put('/notices/{notice}', [NoticeController::class, 'update'])->name('notices.update');
    Route::delete('/notices/{notice}', [NoticeController::class, 'destroy'])->name('notices.destroy');
    Route::post('/notices/bulk-update-status', [NoticeController::class, 'bulkUpdateStatus'])->name('notices.bulk-update-status');

});

require __DIR__.'/auth.php';
