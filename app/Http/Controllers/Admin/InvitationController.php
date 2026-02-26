<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminInvitationService;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class InvitationController extends Controller
{
  protected $invitationService;

  public function __construct(AdminInvitationService $invitationService)
  {
    $this->invitationService = $invitationService;
  }

  /**
   * Store a new invitation.
   */
  public function store(Request $request)
  {
    $validated = $request->validate([
      'email' => 'required|email|unique:admins,email',
      'role' => 'required|in:admin,company_admin',
      'company_id' => [
        'nullable',
        'integer',
        'exists:companies,id',
        Rule::requiredIf(fn() => $request->role === 'company_admin')
      ],
    ]);

    try {
      $invitation = $this->invitationService->createInvitation(
        $validated['email'],
        $validated['role'],
        $validated['company_id'] ?? null,
        $request->user()
      );

      AuditService::high('Admin Invitation Sent', $invitation, "Sent admin invitation to: {$validated['email']} for role: {$validated['role']}");

      return redirect()->back()->with('success', 'Invitation sent successfully.');
    } catch (\Exception $e) {
      return redirect()->back()->with('error', 'Failed to send invitation: ' . $e->getMessage());
    }
  }

  /**
   * Show the invitation acceptance form.
   */
  public function showAcceptForm($token)
  {
    $invitation = $this->invitationService->validateToken($token);

    if (!$invitation) {
      return Inertia::render('admin/accept-invitation-error', [
        'message' => 'This invitation is invalid, expired, or has already been accepted.'
      ]);
    }

    return Inertia::render('admin/accept-invitation', [
      'token' => $token,
      'email' => $invitation->email,
      'invited_by' => $invitation->invitedBy->name,
      'role' => $invitation->role
    ]);
  }

  /**
   * Process invitation acceptance.
   */
  public function accept(Request $request)
  {
    $validated = $request->validate([
      'token' => 'required|string',
      'name' => 'required|string|max:255',
      'password' => 'required|string|min:8|confirmed',
    ]);

    try {
      $admin = $this->invitationService->acceptInvitation(
        $validated['token'],
        $validated['password'],
        $validated['name']
      );

      // Log the admin in immediately
      auth()->guard('web')->login($admin);

      AuditService::high('Admin Invitation Accepted', $admin, "Invitation accepted by: {$admin->name} ({$admin->email})");

      return redirect()->route('dashboard')->with('success', 'Account created successfully.');
    } catch (\Exception $e) {
      return redirect()->back()->withErrors(['message' => $e->getMessage()]);
    }
  }

  /**
   * Resend an invitation.
   */
  public function resend($id)
  {
    try {
      $success = $this->invitationService->resendInvitation($id);
      if ($success) {
        AuditService::medium('Admin Invitation Resent', null, "Resent invitation ID: {$id}");
        return redirect()->back()->with('success', 'Invitation resent successfully.');
      }
      return redirect()->back()->with('error', 'Unable to resend invitation.');
    } catch (\Exception $e) {
      return redirect()->back()->with('error', 'Error resending invitation: ' . $e->getMessage());
    }
  }

  /**
   * Cancel/Delete an invitation.
   */
  public function cancel($id)
  {
    try {
      $this->invitationService->cancelInvitation($id);
      AuditService::medium('Admin Invitation Cancelled', null, "Cancelled invitation ID: {$id}");
      return redirect()->back()->with('success', 'Invitation cancelled.');
    } catch (\Exception $e) {
      return redirect()->back()->with('error', 'Error cancelling invitation: ' . $e->getMessage());
    }
  }
}
