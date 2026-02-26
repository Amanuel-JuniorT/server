<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Services\UnifiedNotificationService;
use App\Events\NewRideRequested;
use App\Events\PaymentCompleted;

class NotificationController extends Controller
{
    public function __construct(
        private readonly UnifiedNotificationService $notificationService
    ) {}

    /**
     * Send admin notification to all drivers
     */
    public function sendAdminNotification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'string|in:info,warning,urgent,maintenance',
            'priority' => 'string|in:low,normal,high,urgent',
            'target_audience' => 'string|in:all_drivers,online_drivers,specific_drivers',
            'driver_ids' => 'array',
            'driver_ids.*' => 'integer|exists:drivers,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $title = $data['title'];
        $message = $data['message'];
        $type = $data['type'] ?? 'info';
        $priority = $data['priority'] ?? 'normal';
        $targetAudience = $data['target_audience'] ?? 'all_drivers';

        try {
            // Prepare notification data
            $notificationData = [
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'priority' => $priority,
                'timestamp' => now()->toISOString(),
                'admin_notification' => true
            ];

            // Determine target drivers
            $targetDrivers = $this->getTargetDrivers($targetAudience, $data['driver_ids'] ?? []);

            if (empty($targetDrivers)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No drivers found for the specified criteria'
                ], 404);
            }

            // Send notification to drivers via hybrid service
            $userIds = $targetDrivers->pluck('user_id')->toArray();
            
            $this->notificationService->notifyUsers(
                $userIds,
                $title,
                $message,
                $notificationData,
                null, // Manual trigger usually doesn't need a specific Laravel event class unless specified
                'Driver'
            );

            // Manual broadcast for 'admin' channel if needed (for specific UI elements)
            foreach ($targetDrivers as $driver) {
                try {
                    broadcast(new \App\Events\GlobalAdminNotification($notificationData))->toOthers();
                    $sentCount++;
                } catch (\Exception $e) {
                    Log::error("Failed to broadcast admin notification to driver {$driver->id}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Admin notification sent successfully to {$sentCount} drivers",
                'data' => [
                    'sent_count' => $sentCount,
                    'total_targeted' => count($targetDrivers),
                    'notification' => $notificationData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send admin notification: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send admin notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send notification to specific driver
     */
    public function sendDriverNotification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'driver_id' => 'required|integer|exists:drivers,id',
            'title' => 'required|string|max:255',
            'message' => 'required|string|max:1000',
            'type' => 'string|in:ride_request,ride_update,payment,admin,info',
            'priority' => 'string|in:low,normal,high,urgent',
            'data' => 'array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $driverId = $data['driver_id'];
        $title = $data['title'];
        $message = $data['message'];
        $type = $data['type'] ?? 'info';
        $priority = $data['priority'] ?? 'normal';
        $extraData = $data['data'] ?? [];

        try {
            $driver = Driver::with('user')->findOrFail($driverId);

            // Prepare notification data
            $notificationData = array_merge([
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'priority' => $priority,
                'timestamp' => now()->toISOString(),
                'driver_id' => $driverId
            ], $extraData);

            // Send via Unified Notification Service (Reverb + FCM)
            $this->notificationService->notifyUser(
                $driver->user_id,
                $title,
                $message,
                $notificationData,
                null, // Handle generic notification
                'Driver'
            );

            // Log the notification
            Log::info("Notification sent to driver {$driverId}: {$title}", [
                'driver_id' => $driverId,
                'driver_name' => $driver->user->name,
                'notification_title' => $title,
                'notification_type' => $type,
                'priority' => $priority
            ]);

            return response()->json([
                'success' => true,
                'message' => "Notification sent successfully to driver {$driver->user->name}",
                'data' => [
                    'driver_id' => $driverId,
                    'driver_name' => $driver->user->name,
                    'notification' => $notificationData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send notification to driver {$driverId}: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send ride request notification to nearby drivers
     */
    public function sendRideRequestNotification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ride_id' => 'required|integer|exists:rides,id',
            'pickup_lat' => 'required|numeric',
            'pickup_lng' => 'required|numeric',
            'destination_lat' => 'required|numeric',
            'destination_lng' => 'required|numeric',
            'pickup_address' => 'required|string',
            'destination_address' => 'required|string',
            'passenger_name' => 'required|string',
            'fare' => 'required|numeric|min:0',
            'radius_km' => 'numeric|min:1|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();
        $radiusKm = $data['radius_km'] ?? 10; // Default 10km radius

        try {
            // Find nearby drivers by joining with locations table
            $nearbyDrivers = Driver::selectRaw("
                drivers.*,
                (6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) AS distance
            ", [$data['pickup_lat'], $data['pickup_lng'], $data['pickup_lat']])
                ->join('locations', 'drivers.id', '=', 'locations.driver_id')
                ->whereRaw("(6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude)))) <= ?", [$data['pickup_lat'], $data['pickup_lng'], $data['pickup_lat'], $radiusKm])
                ->where('drivers.status', 'online')
                ->orderByRaw("(6371 * acos(cos(radians(?)) * cos(radians(locations.latitude)) * 
                cos(radians(locations.longitude) - radians(?)) + sin(radians(?)) * 
                sin(radians(locations.latitude))))", [$data['pickup_lat'], $data['pickup_lng'], $data['pickup_lat']])
                ->limit(20) // Limit to 20 nearest drivers
                ->get();

            if ($nearbyDrivers->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No nearby drivers found'
                ], 404);
            }

            // Prepare ride request data
            $rideRequestData = [
                'ride_id' => $data['ride_id'],
                'pickup_lat' => $data['pickup_lat'],
                'pickup_lng' => $data['pickup_lng'],
                'destination_lat' => $data['destination_lat'],
                'destination_lng' => $data['destination_lng'],
                'pickup_address' => $data['pickup_address'],
                'destination_address' => $data['destination_address'],
                'passenger_name' => $data['passenger_name'],
                'fare' => $data['fare'],
                'timestamp' => now()->toISOString()
            ];

            // Send notification to each nearby driver (hybrid)
            $userIds = $nearbyDrivers->pluck('user_id')->toArray();
            $ride = \App\Models\Ride::find($data['ride_id']);

            $this->notificationService->notifyUsers(
                $userIds,
                "New Ride Request",
                "New ride request from {$data['passenger_name']} at {$data['pickup_address']}",
                $rideRequestData,
                new NewRideRequested($ride),
                'Driver'
            );
            $sentCount = count($userIds);

            return response()->json([
                'success' => true,
                'message' => "Ride request sent to {$sentCount} nearby drivers",
                'data' => [
                    'ride_id' => $data['ride_id'],
                    'sent_count' => $sentCount,
                    'total_nearby' => $nearbyDrivers->count(),
                    'radius_km' => $radiusKm,
                    'ride_request' => $rideRequestData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send ride request notifications: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send ride request notifications',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Send payment notification to driver
     */
    public function sendPaymentNotification(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'ride_id' => 'required|integer|exists:rides,id',
            'driver_id' => 'required|integer|exists:drivers,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string|in:cash,wallet,card',
            'passenger_name' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $validator->validated();

        try {
            $driver = Driver::with('user')->findOrFail($data['driver_id']);

            // Prepare payment notification data
            $paymentData = [
                'ride_id' => $data['ride_id'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'passenger_name' => $data['passenger_name'],
                'timestamp' => now()->toISOString()
            ];

            // Send via Unified Notification Service (Reverb + FCM)
            $this->notificationService->notifyUser(
                $driver->user_id,
                "Payment Received",
                "You received " . number_format($data['amount'], 2) . " ETB from {$data['passenger_name']}",
                $paymentData,
                new PaymentCompleted($paymentData, $driver->user_id),
                'Driver'
            );

            // Log the payment notification
            Log::info("Payment notification sent to driver {$data['driver_id']}: {$data['amount']}", [
                'driver_id' => $data['driver_id'],
                'driver_name' => $driver->user->name,
                'ride_id' => $data['ride_id'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method']
            ]);

            return response()->json([
                'success' => true,
                'message' => "Payment notification sent successfully to driver {$driver->user->name}",
                'data' => [
                    'driver_id' => $data['driver_id'],
                    'driver_name' => $driver->user->name,
                    'payment' => $paymentData
                ]
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to send payment notification to driver {$data['driver_id']}: " . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to send payment notification',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get target drivers based on audience criteria
     */
    private function getTargetDrivers(string $targetAudience, array $specificDriverIds = []): \Illuminate\Database\Eloquent\Collection
    {
        switch ($targetAudience) {
            case 'all_drivers':
                return Driver::with('user')->where('status', '!=', 'inactive')->get();
                
            case 'online_drivers':
                return Driver::with('user')->where('status', 'online')->get();
                
            case 'specific_drivers':
                if (empty($specificDriverIds)) {
                    return collect();
                }
                return Driver::with('user')->whereIn('id', $specificDriverIds)->get();
                
            default:
                return collect();
        }
    }

    /**
     * Get notification statistics
     */
    public function getNotificationStats(): JsonResponse
    {
        try {
            $stats = [
                'total_drivers' => Driver::count(),
                'online_drivers' => Driver::where('status', 'online')->count(),
                'offline_drivers' => Driver::where('status', 'offline')->count(),
                'inactive_drivers' => Driver::where('status', 'inactive')->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get notification statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
