<?php

namespace App\Services;

use App\Models\Notice;

class NoticeService
{
    /**
     * Create a new notice.
     */
    public function store(array $data): Notice
    {
        return Notice::create($data);
    }

    /**
     * Update an existing notice.
     */
    public function update(Notice $notice, array $data): Notice
    {
        $notice->update($data);

        return $notice->refresh();
    }

    /**
     * Delete notice.
     */
    public function delete(Notice $notice): void
    {
        $notice->delete();
    }
}