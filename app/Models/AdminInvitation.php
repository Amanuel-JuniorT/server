<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AdminInvitation extends Model
{
  use HasFactory;

  protected $fillable = [
    'email',
    'token',
    'role',
    'company_id',
    'invited_by',
    'expires_at',
    'accepted_at',
  ];

  protected $casts = [
    'expires_at' => 'datetime',
    'accepted_at' => 'datetime',
    'company_id' => 'integer',
    'invited_by' => 'integer',
  ];

  public function invitedBy()
  {
    return $this->belongsTo(Admin::class, 'invited_by');
  }

  public function company()
  {
    return $this->belongsTo(Company::class);
  }

  public function scopeValid($query)
  {
    return $query->where('expires_at', '>', now())
      ->whereNull('accepted_at');
  }

  public function scopeExpired($query)
  {
    return $query->where('expires_at', '<=', now());
  }

  public function scopePending($query)
  {
    return $query->whereNull('accepted_at');
  }

  public function isExpired(): bool
  {
    return $this->expires_at->isPast();
  }

  public function isAccepted(): bool
  {
    return !is_null($this->accepted_at);
  }
}
