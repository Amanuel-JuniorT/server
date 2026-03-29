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
     */
    public function set(string $key, $value)
    {
        $config = SystemConfiguration::where('key', $key)->first();
        
        if ($config) {
            $config->value = $value;
            $config->save();
            
            Cache::forget($this->cachePrefix . $key);
            return true;
        }

        return false;
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
