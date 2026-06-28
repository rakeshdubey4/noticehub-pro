<?php

namespace App\Http\Controllers;

use App\Exports\NoticeExport;
use App\Models\Notice;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Models\EmailLog;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;


class ReportController extends Controller
{
    // 1. Excel Generation Utility (Saves as spreadsheet data array file)
    public function exportExcel(Request $request)
    {
        // Current application search filters dynamically maintain karein
        $notices = Notice::when($request->search, function ($q) use ($request) {
            return $q->where('company_name', 'like', "%{$request->search}%");
        })->when($request->notice_type, function ($q) use ($request) {
            return $q->where('notice_type', $request->notice_type);
        })->when($request->filing_status, function ($q) use ($request) {
            return $q->where('filing_status', $request->filing_status);
        })->latest()->get();

        $data = [];
        $slNo = 1; // Increment counter initialize karein
        foreach ($notices as $notice) {
            $data[] = [
                'Sl. No.' => $slNo++, // Add row serial sequence number
                'Company Name' => $notice->company_name,
                'Notice Type' => $notice->notice_type,
                'Quantity' => $notice->quantity,
                'Notice Date' => \Carbon\Carbon::parse($notice->notice_date)->format('d-m-Y'),
                'Notice Post Date' => \Carbon\Carbon::parse($notice->notice_post_date)->format('d-m-Y'),
                'Notify Days' => $notice->notify_day . " Day(s)",
                'Status' => strtoupper($notice->filing_status)
            ];
        }

        // Class binding with customizable background styles logic
        return Excel::download(new NoticeExport($notices), 'Notices_Report_' . now()->format('Y-m-d') . ".xlsx");
    }

    // 2. PDF Rendering Engine (Generates formatted report grid download)
    public function exportPdf(Request $request)
    {
        $notices = Notice::when($request->search, function ($q) use ($request) {
            return $q->where('company_name', 'like', "%{$request->search}%");
        })->when($request->notice_type, function ($q) use ($request) {
            return $q->where('notice_type', $request->notice_type);
        })->when($request->filing_status, function ($q) use ($request) {
            return $q->where('filing_status', $request->filing_status);
        })->latest()->get();

        // Use current dynamic blade structure for compilation
        $pdf = Pdf::loadView('reports.notice_report', ['dueNotices' => $notices]);
        return $pdf->download('Notices_Report_' . now()->format('Y-m-d') . '.pdf');
    }
}
