<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ResendEmailService
{
  private $apiKey;
  private $fromEmail;
  private $fromName;

  public function __construct()
  {
    $this->apiKey = env('RESEND_API_KEY');
    $this->fromEmail = env('RESEND_FROM_EMAIL', 'onboarding@resend.dev');
    $this->fromName = env('RESEND_FROM_NAME', 'Admin System');
  }

  public function sendInvitationEmail($to, $token, $invitedBy, $role)
  {
    $inviteUrl = url("/admin/accept-invitation/{$token}");
    $subject = "You've been invited to join the Admin Panel";

    $html = "
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Hello!</h2>
                <p>You have been invited by <strong>{$invitedBy->name}</strong> to join the admin panel as a <strong>{$role}</strong>.</p>
                <div style='margin: 30px 0;'>
                    <a href='{$inviteUrl}' style='background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;'>Accept Invitation</a>
                </div>
                <p>This invitation will expire in 48 hours.</p>
                <p>If you did not expect this invitation, you can ignore this email.</p>
                <hr style='margin-top: 30px; border: none; border-top: 1px solid #eee;'>
                <p style='color: #888; font-size: 12px;'>If the button doesn't work, copy and paste this link into your browser:<br>{$inviteUrl}</p>
            </div>
        ";

    if (app()->environment('local')) {
      Log::info("Admin Invitation URL generated: {$inviteUrl}");
    }

    return $this->send($to, $subject, $html);
  }

  public function sendVerificationEmail($user)
  {
    // For manual verification flow if needed, though Laravel has built-in
    // We might hook into standard verification or custom one
    // For now, let's assume we use this for custom flows if standard doesn't work directly with Resend easily
    // Standard Laravel verification notifications use Mailables. 
    // We will likely need to customize the Notification to use this service OR configure Laravel Mail to use Resend via SMTP/API driver.
    // For simplicity, let's create a direct method here we can call.

    // However, standard Laravel 'MustVerifyEmail' uses the 'SendEmailVerificationNotification' inside the model.
    // We typically override `sendEmailVerificationNotification` in the User/Admin model.

    $url = \Illuminate\Support\Facades\URL::temporarySignedRoute(
      'verification.verify',
      now()->addMinutes(60),
      ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())]
    );

    $subject = "Verify Email Address";
    $html = "
            <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
                <h2>Verify Your Email Address</h2>
                <p>Please click the button below to verify your email address.</p>
                <div style='margin: 30px 0;'>
                    <a href='{$url}' style='background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;'>Verify Email Address</a>
                </div>
                <p>If you did not create an account, no further action is required.</p>
                <hr style='margin-top: 30px; border: none; border-top: 1px solid #eee;'>
                <p style='color: #888; font-size: 12px;'>If the button doesn't work, copy and paste this link into your browser:<br>{$url}</p>
            </div>
        ";

    if (app()->environment('local')) {
      Log::info("Verification URL generated for {$user->email}: {$url}");
    }

    return $this->send($user->email, $subject, $html);
  }

  public function sendTestEmail($to)
  {
    $subject = "Test Email from EthioCab Admin";
    $html = "
          <div style='font-family: sans-serif; max-width: 600px; margin: 0 auto;'>
              <h2>It Works!</h2>
              <p>This is a test email to verify that your Resend configuration is working correctly.</p>
              <p>Time: " . now()->toDateTimeString() . "</p>
          </div>
      ";

    return $this->send($to, $subject, $html);
  }

  private function send($to, $subject, $html)
  {
    if (!$this->apiKey) {
      Log::warning("Resend API key not found. Email to {$to} not sent.");
      return false;
    }

    try {
      $response = Http::withHeaders([
        'Authorization' => 'Bearer ' . $this->apiKey,
        'Content-Type' => 'application/json',
      ])->post('https://api.resend.com/emails', [
        'from' => "{$this->fromName} <{$this->fromEmail}>",
        'to' => [$to],
        'subject' => $subject,
        'html' => $html,
      ]);

      if ($response->successful()) {
        Log::info("Email sent to {$to} via Resend.");
        return true;
      } else {
        Log::error("Failed to send email via Resend: " . $response->body());
        return false;
      }
    } catch (\Exception $e) {
      Log::error("Exception sending email via Resend: " . $e->getMessage());
      return false;
    }
  }
}
