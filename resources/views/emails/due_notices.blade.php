<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Notice Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #334155;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
        }

        .divider {
            border-bottom: 2px solid #666;
            margin-top: 10px;
            margin-bottom: 15px;
        }

        .container {
            max-width: 750px;
            margin: 0 auto;
            background: #ffffff;
            padding: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
        }

        h2 {
            color: #0f172a;
            margin-top: 0;
            font-size: 20px;
        }

        p {
            font-size: 14px;
            color: #64748b;
            line-height: 1.5;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            text-align: left;
            font-size: 13px;
        }

        th {
            background-color: #f1f5f9;
            color: #475569;
            font-weight: 600;
            padding: 12px;
            border-bottom: 2px solid #cbd5e1;
        }

        td {
            padding: 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 9999px;
            background-color: #fef3c7;
            color: #d97706;
            text-transform: uppercase;
        }

        .footer {
            margin-top: 24px;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
        }
    </style>
</head>

<body>
    <!-- Header -->
    <table width="100%" style="border-collapse: collapse;">
        <tr>
            <td align="center">
                <div style="font-size:24px;font-weight:bold;color:#1e3a8a;">
                    Notice Management System
                </div>

                <div style="font-size:12px;font-weight:bold;margin-top:5px;">
                    Official Notices Summary Report
                </div>

                <div style="font-size:11px;margin-top:3px;">
                    Date: {{ now()->format('d M Y') }}
                </div>
            </td>
        </tr>
    </table>

    <hr style="border:1px solid #666;margin-top:10px;margin-bottom:20px;">

    <div class="container">

        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">Sl. No.</th> <!-- New Sl No. Header in PDF -->
                    <th>Company Profile</th>
                    <th>Notice Category</th>
                    <!-- ALAG ALAG COLUMNS EMAIL ME -->
                    <th>Notice Date</th>
                    <th>Notice Post Date</th>
                    <th>Target Alert Date</th>
                    <th>Filing Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($dueNotices as $notice)
                <tr>
                    <!-- Native blade variable counts sequences accurately from 1 onwards -->
                    <td style="font-weight: bold; color: #64748b;">{{ $loop->iteration }}</td>
                    <td style="font-weight: bold; color: #0f172a;">{{ $notice->company_name }}</td>
                    <td>{{ $notice->notice_type }}</td>
                    <!-- DATE FORMAT CHANGED TO dd-mm-yyyy -->
                    <td>{{ \Carbon\Carbon::parse($notice->notice_date)->format('d-m-Y') }}</td>
                    <td>{{ \Carbon\Carbon::parse($notice->notice_post_date)->format('d-m-Y') }}</td>

                    <!-- Email table dynamic alert target compilation column -->
                    <td>
                        @php
                        $noticeDate = \Carbon\Carbon::parse($notice->notice_date);
                        $targetTriggerDate = $noticeDate->addDays((int) $notice->notify_day);
                        @endphp
                        <strong style="color: #4f46e5;">{{ $targetTriggerDate->format('d-m-Y') }}</strong>
                        <div style="font-size: 11px; color: #94a3b8;">({{ $notice->notify_day }} Days configuration buffer)</div>
                    </td>

                    <td><span class="badge">{{ $notice->filing_status }}</span></td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <p style="margin-top: 24px; font-size: 13px;"><strong>Note:</strong> Yeh report automatic har din check hoti rahigi jabtak filing status <em>'filed'</em> ya <em>'not needed'</em> me change nahi ho jata.</p>
        <br>
        <p>Best regards,<br>Your Notification System</p>
        <div class="footer">Automated System Generation Directory Log • Laravel 13 & React App</div>
    </div>
</body>

</html>