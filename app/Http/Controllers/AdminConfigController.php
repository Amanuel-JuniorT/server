<?php

namespace App\Http\Controllers;

use App\Services\AppConfigService;
use App\Models\SystemConfiguration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminConfigController extends Controller
{
    protected $configService;

    public function __construct(AppConfigService $configService)
    {
        $this->configService = $configService;
    }

    /**
     * Get all configurations in the 'rewards' group.
     */
    public function getRewardsConfig()
    {
        $configs = SystemConfiguration::where('group', 'rewards')->get();
        return response()->json([
            'success' => true,
            'data' => $configs
        ]);
    }

    /**
     * Update multiple configurations.
     */
    public function updateConfig(Request $request)
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($request->settings as $setting) {
            $this->configService->set($setting['key'], $setting['value'], 'rewards');
        }

        return response()->json([
            'success' => true,
            'message' => 'Configurations updated successfully'
        ]);
    }
}
