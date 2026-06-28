<?php

namespace App\Exports;

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



class NoticeExport implements
    FromCollection,
    WithHeadings,
    WithStyles,
    WithEvents
{
     // Current application search filters dynamically maintain karein
 
       
    /**
     * @return \Illuminate\Support\Collection
     */
    private $d;
    public function __construct( $d)
    {
        // Build collection from provided notices array
        $data = [];
        $slNo = 1; // Increment counter initialize

        // Ensure we iterate over the provided data array
        foreach ($d as $notice) {
            $data[] = [
                'Sl. No.' => $slNo++, // Add row serial sequence number
                'Company Name' => $notice->company_name ?? null,
                'Notice Type' => $notice->notice_type ?? null,
                'Quantity' => $notice->quantity ?? null,
                'Notice Date' => isset($notice->notice_date) ? \Carbon\Carbon::parse($notice->notice_date)->format('d-m-Y') : null,
                'Notice Post Date' => isset($notice->notice_post_date) ? \Carbon\Carbon::parse($notice->notice_post_date)->format('d-m-Y') : null,
                'Notify Days' => isset($notice->notify_day) ? $notice->notify_day." Day(s)" : null,
                'Status' => isset($notice->filing_status) ? strtoupper($notice->filing_status) : null,
            ];
        }

        $this->d = collect($data);
    }
    public function collection()
    {
        return $this->d;
    }
    public function headings(): array
    {
        return ['Sl. No.', 'Company Profile', 'Notice Category', 'Quantity', 'Notice Date', 'Post Date', 'Notify Days Later', 'Filing Status'];
    }

    // CUSTOM HEADINGS STYLING BACKGROUND ENGINE
    public function styles(Worksheet $sheet)
    {
        return [
            // Row 1 (Headings) text bold, white color, with Royal Blue Background (#1E40AF)
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '1E40AF']
                ]
            ],
        ];
    }
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {

                $sheet = $event->sheet->getDelegate();

                // Top 3 rows insert
                $sheet->insertNewRowBefore(1, 3);

                // Title
                $sheet->mergeCells('A1:G1');
                $sheet->setCellValue('A1', 'NOTICE MANAGEMENT REPORT');

                // Date
                $sheet->mergeCells('A2:G2');
                $sheet->setCellValue(
                    'A2',
                    'Report Generated On: ' . now()->format('d M Y')
                );
                // Horizontal line effect
                $sheet->mergeCells('A3:G3');
                $sheet->setCellValue('A3', str_repeat(' ', 100));
                // Title Style
                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 18,
                        'color' => ['rgb' => '1E3A8A'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);

                // Date Style
                $sheet->getStyle('A2')->applyFromArray([
                    'font' => [
                        'size' => 11,
                        'color' => ['rgb' => '4B5563'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);


                $sheet->getStyle('A4')->getAlignment()
                    ->setHorizontal(Alignment::HORIZONTAL_CENTER);

                // Auto width
                foreach (range('A', 'G') as $column) {
                    $sheet->getStyle('A4:G4')->applyFromArray([
                        'font' => [
                            'bold' => true,
                            'color' => ['rgb' => 'FFFFFF']
                        ],
                        'fill' => [
                            'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                            'startColor' => ['rgb' => '1E40AF']
                        ],
                        'alignment' => [
                            'horizontal' => Alignment::HORIZONTAL_CENTER
                        ]
                    ]);
                    $sheet->getColumnDimension($column)
                        ->setAutoSize(true);
                }
                // Last row find karo
                $lastRow = $sheet->getHighestRow();

                // Table range (Heading Row 4 se last row tak)
                $tableRange = 'A1:G' . $lastRow;

                // All Borders
                $sheet->getStyle($tableRange)->applyFromArray([
                    'borders' => [
                        'outline' => [
                            'borderStyle' => Border::BORDER_MEDIUM,
                            'color' => ['rgb' => '000000'],
                        ],
                        'inside' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                ]);
            },
        ];
    }
}
