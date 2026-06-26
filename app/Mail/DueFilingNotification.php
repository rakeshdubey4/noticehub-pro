<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DueFilingNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $dueNotices;

    /**
     * Create a new message instance.
     */
    public function __construct($dueNotices)
    {
        $this->dueNotices = $dueNotices;
    }

    public function build()
    {
        return $this->subject('Alert: Due Filings Records Notification')
                    ->view('emails.due_notices'); // Blade view table template ke liye
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Due Filing Notification',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
          //  view: 'view.name',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
