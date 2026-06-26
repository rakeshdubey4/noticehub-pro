<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailLog extends Model
{
    protected $fillable = [
        'recipient_email',
        'record_count',
        'sent_date',
        'included_notice_ids'
    ];

    protected $casts = [
        'included_notice_ids' => 'array',
        'sent_date'           => 'date:Y-m-d'
    ];
}

