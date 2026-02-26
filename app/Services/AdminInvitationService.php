<?php

namespace App\Services;

use App\Models\Admin;
use App\Models\AdminInvitation;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;

class AdminInvitationService
{
  private $resendService;

  public function __construct(ResendEmailService $resendService)
  {
    $this->resendService = $resendService;
  }

  public function createInvitation($email, $role, $companyId, $invitedBy)
  {
    // Cancel any existing pending invitations for this email
    AdminInvitation::where('email', $email)->pending()->delete();

    $token = Str::random(40);

    $invitation = AdminInvitation::create([
      'email' => $email,
      'token' => $token,
      'role' => $role,
      'company_id' => $companyId, // Nullable for superadmin invites
      'invited_by' => $invitedBy->id,
      'expires_at' => now()->addHours(48),
    ]);

    $this->resendService->sendInvitationEmail($email, $token, $invitedBy, $role);

    return $invitation;
  }

  public function validateToken($token)
  {
    $invitation = AdminInvitation::where('token', $token)->first();

    if (!$invitation) {
      return null;
    }

    if ($invitation->isExpired()) {
      return null;
    }

    if ($invitation->isAccepted()) {
      return null;
    }

    return $invitation;
  }

  public function acceptInvitation($token, $password, $name)
  {
    $invitation = $this->validateToken($token);

    if (!$invitation) {
      throw new \Exception("Invalid or expired invitation token.");
    }

    // Create the admin
    $admin = Admin::create([
      'name' => $name,
      'email' => $invitation->email,
      'password' => \Hash::make($password),
      'role' => $invitation->role,
      'company_id' => $invitation->company_id,
      'email_verified_at' => now(), // Auto-verify email since they owned the inbox to get the link
      'is_active' => true,
    ]);

    // Mark invitation as accepted
    $invitation->update(['accepted_at' => now()]);

    return $admin;
  }

  public function cancelInvitation($id)
  {
    $invitation = AdminInvitation::find($id);
    if ($invitation && !$invitation->isAccepted()) {
      $invitation->delete();
      return true;
    }
    return false;
  }

  public function resendInvitation($id)
  {
    $invitation = AdminInvitation::find($id);

    if (!$invitation || $invitation->isAccepted()) {
      return false;
    }

    // Generate new token and refresh expiration
    $invitation->token = Str::random(40);
    $invitation->expires_at = now()->addHours(48);
    $invitation->save();

    // Resend email
    $this->resendService->sendInvitationEmail(
      $invitation->email,
      $invitation->token,
      $invitation->invitedBy,
      $invitation->role
    );

    return true;
  }
}
