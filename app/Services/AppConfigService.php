<?php

namespace App\Services;

use App\Models\SystemConfiguration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppConfigService
{
    protected $cachePrefix = 'sys_config_';

    /**
     * Get a configuration value by key.
     */
    public function get(string $key, $default = null)
    {
        return Cache::rememberForever($this->cachePrefix . $key, function () use ($key, $default) {
            $config = SystemConfiguration::where('key', $key)->first();
            
            if (!$config instanceof SystemConfiguration) {
                return $default;
            }

            return $config->getTypedValue();
        });
    }

    /**
     * Update a configuration value and clear cache.
     * Creates the record if it doesn't exist yet.
     */
    public function set(string $key, $value)
    {
        $config = SystemConfiguration::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        Cache::forget($this->cachePrefix . $key);
        return true;
    }

    /**
     * Get all settings in a specific group.
     */
    public function getGroup(string $group)
    {
        return SystemConfiguration::where('group', $group)->get()->mapWithKeys(function ($item) {
            return [$item->key => $item->getTypedValue()];
        })->toArray();
    }
}
