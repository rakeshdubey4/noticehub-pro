<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Notice;
use App\Models\EmailLog; // Injected log trace model framework entity 
use App\Mail\DueFilingNotification;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class SendNoticeEmails extends Command
{
    protected $signature = 'notice:send-emails';
    protected $description = 'Send daily combined email for due filings';

    public function handle()
    {
        $today = Carbon::today();

        // Wo saare records filter karein jo 'filed' ya 'not needed' nahi hain
        // Aur jinki Notice Date + Notify Day ke baad aaj ki tarikh match ya cross ho chuki hai
        $allPendingNotices = Notice::where('filing_status', 'pending')->get();

        $dueNotices = $allPendingNotices->filter(function ($notice) use ($today) {
            $noticeDate = Carbon::parse($notice->notice_date);
            $targetDate = $noticeDate->addDays($notice->notify_day);
            return $today->greaterThanOrEqualTo($targetDate);
        });

        // Agar records hain to ek single combined email send karein fixed email id par
        if ($dueNotices->count() > 0) {
            $fixedEmail = 'srdubey4@gmail.com'; // Aapki fixed target email id
            Mail::to($fixedEmail)->send(new DueFilingNotification($dueNotices));

             
            // AUTOMATIC EMAIL TRACE BACKUP INJECTION PIPELINE SYSTEM
            EmailLog::create([
                'recipient_email'     => $fixedEmail,
                'record_count'        => $dueNotices->count(),
                'sent_date'           => $today->format('Y-m-d'),
                'included_notice_ids' => $dueNotices->pluck('id')->toArray(),
            ]);
            
            // Flag check update karein records me
            Notice::whereIn('id', $dueNotices->pluck('id'))->update(['email_sent' => true]);
            $this->info($dueNotices->count() . ' daily Overdue records consolidated, email logs sent successfully.');
        } else {
            $this->info('No due filings found for today.');
        }
    }
}

