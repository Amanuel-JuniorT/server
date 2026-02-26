<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ResendEmailService;

class TestResendEmail extends Command
{
  /**
   * The name and signature of the console command.
   *
   * @var string
   */
  protected $signature = 'test:email {email : The email address to send the test email to}';

  /**
   * The console command description.
   *
   * @var string
   */
  protected $description = 'Send a test email using Resend to verify configuration';

  /**
   * Execute the console command.
   */
  public function handle(ResendEmailService $resendService)
  {
    $email = $this->argument('email');

    $this->info("Sending test email to {$email}...");

    if (empty(env('RESEND_API_KEY'))) {
      $this->error("Error: RESEND_API_KEY is missing from .env");
      return 1;
    }

    $success = $resendService->sendTestEmail($email);

    if ($success) {
      $this->info("✅ Test email sent successfully!");
      return 0;
    } else {
      $this->error("❌ Failed to send test email. Check your logs for details.");
      return 1;
    }
  }
}
