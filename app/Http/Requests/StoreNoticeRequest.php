<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreNoticeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'company_name' => [
                'required',
                'string',
                'max:255'
            ],

            'notice_type' => [
                'required',
                'string',
                'max:255'
            ],

            'notify_day' => [
                'nullable',
                'integer',
                'min:1'
            ],
            'quantity' => [
                'required',
                'integer',
                'min:1'
            ],

            'notice_number' => [
                'nullable',
                'string',
                'max:255'
            ],

            'notice_date' => [
                'required',
                'date'
            ],

            'filing_status' => [
                'required'
            ],
        ];
    }

    public function messages(): array
    {
        return [

            'company_name.required' =>
                'Company Name is required.',

            'notice_type.required' =>
                'Notice Type is required.',

            'quantity.required' =>
                'Quantity is required.',

            'quantity.min' =>
                'Quantity must be at least 1.',
            'notify_day.min' =>
                'Notify Day must be at least 1.',
        ];
    }
}