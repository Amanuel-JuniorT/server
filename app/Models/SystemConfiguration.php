<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemConfiguration extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group', 'description'];

    /**
     * Get a typed value.
     */
    public function getTypedValue()
    {
        return match ($this->type) {
            'boolean' => $this->value === 'true' || $this->value === '1',
            'integer' => (int) $this->value,
            'decimal' => (float) $this->value,
            'json' => json_decode($this->value, true),
            default => $this->value,
        };
    }
}
