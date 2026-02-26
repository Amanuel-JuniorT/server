<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'admin_id',
        'action',
        'subject_type',
        'subject_id',
        'details',
        'impact'
    ];

    /**
     * Get the admin who performed the action.
     */
    public function admin()
    {
        return $this->belongsTo(Admin::class, 'admin_id');
    }

    /**
     * Get the subject of the audit log.
     */
    public function subject()
    {
        return $this->morphTo();
    }
}
