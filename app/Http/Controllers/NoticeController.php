<?php

namespace App\Http\Controllers;

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
use App\Exports\NoticeExport;

class NoticeController extends Controller
{
    // Dashboard Summary aur Listing ke liye
    public function index(Request $request)
    {
        // Multiple request array parameters input fetch karein
        $search       = $request->input('search');
        $noticeType   = $request->input('notice_type');
        $filingStatus = $request->input('filing_status');

        $noticesQuery = Notice::query();

        // 1. Parameter 1: Company Profile Text Search
        if ($search) {
            $noticesQuery->where('company_name', 'like', "%{$search}%");
        }

        // 2. Parameter 2: Specific Notice Category Dropdown Filter
        if ($noticeType) {
            $noticesQuery->where('notice_type', $noticeType);
        }

        // 3. Parameter 3: Filing Status Lifecycle Dropdown Filter
        if ($filingStatus) {
            $noticesQuery->where('filing_status', $filingStatus);
        }

        // Paginated database results compiling
        $notices = $noticesQuery->latest()->paginate(10)->withQueryString();

        // Summary data calculations
        $summary = [
            'total'      => Notice::count(),
            'pending'    => Notice::where('filing_status', 'pending')->count(),
            'filed'      => Notice::where('filing_status', 'filed')->count(),
            'not_needed' => Notice::where('filing_status', 'not needed')->count(),

            // NEW TIME-SENSITIVE HIGH ANALYTICS INSIGHTS DATA PIPELINES
            'pending_last_24h' => Notice::where('filing_status', 'pending')
                ->where('created_at', '>=', now()->subHours(24))
                ->count(),

            'filed_this_month' => Notice::where('filing_status', 'filed')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
        ];

        // Dropdown filters list dynamic unique listing logic
        $uniqueNoticeTypes = Notice::pluck('notice_type')->unique()->filter()->values()->all();

        // FETCH HISTORICAL EMAIL AUDITING TRAIL ENTRIES (Latest 5 logs records)
        $emailHistoryLogs = EmailLog::latest()->take(5)->get();

        return Inertia::render('Dashboard', [
            'notices'             => $notices,
            'summary'             => $summary,
            'uniqueNoticeTypes'   => $uniqueNoticeTypes,
            'emailHistoryLogs'    => $emailHistoryLogs, // Transmitted logs collection data properties stream
            'filters'             => $request->only(['search', 'notice_type', 'filing_status']),
            'isAdmin' => Auth::check() && Auth::user()->is_admin == 1 // Ensure you have admin flag or logic
        ]);
    }

    // Ajax/Inertia Request se New Notice Insert karna (Admin Only)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'required|string|max:255',
            'notice_type' => 'required|string',
            'notice_date' => 'required|date',
            'notice_post_date' => 'required|date',
            'notify_day' => 'required|integer|min:0',
        ]);

        // Force integer conversion before entry insertion
        $validated['notify_day'] = (int) $validated['notify_day'];

        Notice::create($validated);
        return redirect()->back()->with('success', 'Notice created successfully!');
    }

    // Notice Update karne ke liye (Admin Only)
    public function update(Request $request, Notice $notice)
    {
        $validated = $request->validate([
            'company_name'     => 'sometimes|string|max:255',
            'notice_type'      => 'sometimes|string|max:255',
            'notice_date'      => 'sometimes|date_format:Y-m-d',
            'notice_post_date' => 'sometimes|date_format:Y-m-d',
            'notify_day'       => 'sometimes|integer|min:0',
            'filing_status'    => 'sometimes|string|in:pending,filed,not needed'
        ]);

        if (isset($validated['notify_day'])) {
            $validated['notify_day'] = (int) $validated['notify_day'];
        }

        $notice->update($validated);
        return redirect()->back()->with('success', 'Notice updated successfully!');
    }

    // Notice Delete karne ke liye (Admin Only)
    public function destroy(Notice $notice)
    {
        $notice->delete();
        return redirect()->back()->with('success', 'Notice deleted successfully!');
    }

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

        // $data = [];
        // $slNo = 1; // Increment counter initialize karein
        // foreach ($notices as $notice) {
        //     $data[] = [
        //         'Sl. No.' => $slNo++, // Add row serial sequence number
        //         'Company Name' => $notice->company_name,
        //         'Notice Type' => $notice->notice_type,
        //         'Notice Date' => \Carbon\Carbon::parse($notice->notice_date)->format('d-m-Y'),
        //         'Notice Post Date' => \Carbon\Carbon::parse($notice->notice_post_date)->format('d-m-Y'),
        //         'Notify Days' => $notice->notify_day." Day(s)",
        //         'Status' => strtoupper($notice->filing_status)
        //     ];
        // }

        // Class binding with customizable background styles logic
        // return Excel::download(new class($data) implements FromCollection, WithHeadings, WithStyles, WithEvents {
        //     private $d;
        //     public function __construct($d)
        //     {
        //         $this->d = collect($d);
        //     }
        //     public function collection()
        //     {
        //         return $this->d;
        //     }
        //     public function headings(): array
        //     {
        //         return ['Sl. No.', 'Company Profile', 'Notice Category', 'Notice Date', 'Post Date', 'Notify Days Later', 'Filing Status'];
        //     }

        //     // CUSTOM HEADINGS STYLING BACKGROUND ENGINE
        //     public function styles(Worksheet $sheet)
        //     {
        //         return [
        //             // Row 1 (Headings) text bold, white color, with Royal Blue Background (#1E40AF)
        //             1 => [
        //                 'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
        //                 'fill' => [
        //                     'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
        //                     'startColor' => ['rgb' => '1E40AF']
        //                 ]
        //             ],
        //         ];
        //     }
        //     public function registerEvents(): array
        //     {
        //         return [
        //             AfterSheet::class => function (AfterSheet $event) {

        //                 $sheet = $event->sheet->getDelegate();

        //                 // Top 3 rows insert
        //                 $sheet->insertNewRowBefore(1, 3);

        //                 // Title
        //                 $sheet->mergeCells('A1:G1');
        //                 $sheet->setCellValue('A1', 'NOTICE MANAGEMENT REPORT');

        //                 // Date
        //                 $sheet->mergeCells('A2:G2');
        //                 $sheet->setCellValue(
        //                     'A2',
        //                     'Report Generated On: ' . now()->format('d M Y')
        //                 );
        //                 // Horizontal line effect
        //                 $sheet->mergeCells('A3:G3');
        //                 $sheet->setCellValue('A3', str_repeat(' ', 100));
        //                 // Title Style
        //                 $sheet->getStyle('A1')->applyFromArray([
        //                     'font' => [
        //                         'bold' => true,
        //                         'size' => 18,
        //                         'color' => ['rgb' => '1E3A8A'],
        //                     ],
        //                     'alignment' => [
        //                         'horizontal' => Alignment::HORIZONTAL_CENTER,
        //                     ],
        //                 ]);

        //                 // Date Style
        //                 $sheet->getStyle('A2')->applyFromArray([
        //                     'font' => [
        //                         'size' => 11,
        //                         'color' => ['rgb' => '4B5563'],
        //                     ],
        //                     'alignment' => [
        //                         'horizontal' => Alignment::HORIZONTAL_CENTER,
        //                     ],
        //                 ]);


        //                 $sheet->getStyle('A4')->getAlignment()
        //                     ->setHorizontal(Alignment::HORIZONTAL_CENTER);

        //                 // Auto width
        //                 foreach (range('A', 'G') as $column) {
        //                     $sheet->getStyle('A4:G4')->applyFromArray([
        //                         'font' => [
        //                             'bold' => true,
        //                             'color' => ['rgb' => 'FFFFFF']
        //                         ],
        //                         'fill' => [
        //                             'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
        //                             'startColor' => ['rgb' => '1E40AF']
        //                         ],
        //                         'alignment' => [
        //                             'horizontal' => Alignment::HORIZONTAL_CENTER
        //                         ]
        //                     ]);
        //                     $sheet->getColumnDimension($column)
        //                         ->setAutoSize(true);
        //                 }
        //                 // Last row find karo
        //                 $lastRow = $sheet->getHighestRow();

        //                 // Table range (Heading Row 4 se last row tak)
        //                 $tableRange = 'A1:G' . $lastRow;

        //                 // All Borders
        //                 $sheet->getStyle($tableRange)->applyFromArray([
        //                     'borders' => [
        //                         'outline' => [
        //                             'borderStyle' => Border::BORDER_MEDIUM,
        //                             'color' => ['rgb' => '000000'],
        //                         ],
        //                         'inside' => [
        //                             'borderStyle' => Border::BORDER_THIN,
        //                             'color' => ['rgb' => '000000'],
        //                         ],
        //                     ],
        //                 ]);
        //             },
        //         ];
        //     }
        // }, 'Notices_Report_' . now()->format('Y-m-d') . ".xlsx");
        return Excel::download(
    new NoticeExport($notices),
    'Notices_Report.xlsx'
);
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
        $pdf = Pdf::loadView('emails.due_notices', ['dueNotices' => $notices]);
        return $pdf->download('Notices_Report_' . now()->format('Y-m-d') . '.pdf');
    }
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'], // Default user raw context password verify karega
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Password successfully updated.');
    }

    public function bulkUpdateStatus(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:notices,id',
            'filing_status' => 'required|string|in:pending,filed,not needed'
        ]);

        // Single query execution logic kafi fast updates complete karegi
        Notice::whereIn('id', $validated['ids'])->update([
            'filing_status' => $validated['filing_status']
        ]);

        return redirect()->back()->with('success', 'Selected records modified successfully.');
    }
}
