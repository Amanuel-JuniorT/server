<?php

namespace App\Http\Controllers;

use App\Models\SosAlert;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use App\Events\SosAlertReceived;

class AdminSosController extends Controller
{
    public function index()
    {
        $alerts = SosAlert::with(['user', 'ride', 'resolver'])
            ->latest()
            ->paginate(10);

        return Inertia::render('sos', [
            'alerts' => $alerts,
            'stats' => [
                'total' => SosAlert::count(),
                'open' => SosAlert::where('status', 'open')->count(),
                'resolved' => SosAlert::where('status', 'resolved')->count(),
            ]
        ]);
    }

    public function show(SosAlert $alert)
    {
        $alert->load(['user', 'ride.passenger', 'ride.driver.user', 'ride.driver.location', 'resolver']);

        return Inertia::render('sos-detail', [
            'alert' => $alert
        ]);
    }

    public function resolve(Request $request, SosAlert $alert)
    {
        $validated = $request->validate([
            'note' => 'nullable|string',
            'status' => 'required|in:resolved,false_alarm',
        ]);

        $alert->update([
            'status' => $validated['status'],
            'resolved_by' => Auth::id(),
            'resolved_at' => now(),
            'resolution_note' => $validated['note'],
        ]);

        AuditService::medium('SOS Alert Resolved', $alert, "Resolved SOS alert for user {$alert->user->name}. Status: {$validated['status']}");

        return back()->with('success', 'Alert resolved successfully');
    }
}
