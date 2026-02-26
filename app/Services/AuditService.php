<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Record an administrative action.
     */
    public static function log(string $action, $subject = null, string $impact = 'low', ?string $details = null)
    {
        return AuditLog::create([
            'admin_id' => Auth::id(),
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->id : null,
            'details' => $details,
            'impact' => $impact
        ]);
    }

    /**
     * Log a critical action.
     */
    public static function critical(string $action, $subject = null, ?string $details = null)
    {
        return self::log($action, $subject, 'critical', $details);
    }

    /**
     * Log a high priority action.
     */
    public static function high(string $action, $subject = null, ?string $details = null)
    {
        return self::log($action, $subject, 'high', $details);
    }

    /**
     * Log a medium priority action.
     */
    public static function medium(string $action, $subject = null, ?string $details = null)
    {
        return self::log($action, $subject, 'medium', $details);
    }
}
