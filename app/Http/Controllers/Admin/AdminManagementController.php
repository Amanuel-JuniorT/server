<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminInvitation;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminManagementController extends Controller
{
  public function index()
  {
    $admins = Admin::with('company')
      ->where('role', '!=', 'super_admin') // Usually super admin manages others, but doesn't edit other super admins this way potentially
      ->orWhere('id', '!=', auth()->id()) // Don't manage self here if desired, or allow it.
      ->orderBy('created_at', 'desc')
      ->get();

    $invitations = AdminInvitation::with('invitedBy', 'company')
      ->pending() // Custom scope we added
      ->orderBy('created_at', 'desc')
      ->get();

    return Inertia::render('admin/admin-management', [
      'admins' => $admins,
      'invitations' => $invitations,
      'companies' => \App\Models\Company::select('id', 'name')->get() // For the invite dropdown
    ]);
  }

  public function deactivate($id)
  {
    $admin = Admin::findOrFail($id);

    // Prevent deactivating super admins or yourself
    if ($admin->isSuperAdmin() || $admin->id === auth()->id()) {
      return redirect()->back()->with('error', 'Cannot deactivate this admin.');
    }

    $admin->update(['is_active' => false]);

    AuditService::critical('Admin Deactivated', $admin, "Deactivated access for admin: {$admin->name} ({$admin->email})");

    return redirect()->back()->with('success', 'Admin deactivated.');
  }

  public function reactivate($id)
  {
    $admin = Admin::findOrFail($id);
    $admin->update(['is_active' => true]);

    AuditService::high('Admin Reactivated', $admin, "Reactivated access for admin: {$admin->name} ({$admin->email})");

    return redirect()->back()->with('success', 'Admin reactivated.');
  }
}
