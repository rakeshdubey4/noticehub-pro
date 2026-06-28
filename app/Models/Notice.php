<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Notice extends Model
{
     // Saare columns ko fillable array me add karein
    protected $fillable = [
        'company_name',
         'quantity',
        'notice_type',
        'notice_date',
        'notice_post_date',
        'notify_day',
        'filing_status',
        'email_sent'
    ];

    // DataType conversion framework enforce karein
    protected $casts = [
        'notify_day' => 'integer',
        'notice_date' => 'date:Y-m-d',
        'notice_post_date' => 'date:Y-m-d',
        'email_sent' => 'boolean'
    ];
}
