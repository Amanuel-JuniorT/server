<?php

namespace App\Jobs;

use App\Services\FcmService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendFcmMessage implements ShouldQueue
{
  use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

  /** @var array<string> */
  public array $tokens;
  public string $title;
  public string $body;
  /** @var array<string,string> */
  public array $data;
  public bool $highPriority;

  /**
   * @param array<string> $tokens
   * @param array<string,string> $data
   */
  public function __construct(array $tokens, string $title, string $body, array $data = [], bool $highPriority = true)
  {
    $this->tokens = $tokens;
    $this->title = $title;
    $this->body = $body;
    $this->data = $data;
    $this->highPriority = $highPriority;
  }

  public function handle(FcmService $fcm): void
  {
    // Chunk to avoid FCM limits
    foreach (array_chunk($this->tokens, 500) as $chunk) {
      $fcm->sendToTokens($chunk, $this->title, $this->body, $this->data, $this->highPriority);
    }
  }
}
