<?php

namespace App\Http\Controllers;

use App\Events\RideScheduled;
use App\Models\User;
use App\Models\Driver;
use App\Models\Vehicle;
use App\Models\Ride;
use App\Models\Company;
use App\Models\CompanyGroupRideInstance;
use App\Models\CompanyEmployee;
use App\Models\CompanyDriverContract;
use Inertia\Inertia;
use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Validator;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $stats = [
            'passengers' => User::where('role', 'passenger')->count(),
            'total_drivers' => User::where('role', 'driver')->count(),
            'active_drivers' => Driver::where('approval_state', 'approved')->count(),
            'pending_drivers' => Driver::where('approval_state', 'pending')->count(),
            'rejected_drivers' => Driver::where('approval_state', 'rejected')->count(),
            'vehicles' => Vehicle::count(),
            'rides' => Ride::count(),
            'companies' => Company::count(),
            'active_companies' => Company::where('is_active', true)->count(),
            'company_employees' => CompanyEmployee::where('status', 'approved')->count(),
            'pending_company_requests' => CompanyEmployee::where('status', 'pending')->count(),
            'total_revenue' => \App\Models\Payment::where('status', 'paid')->sum('amount'),
            'pending_payment_receipts' => \App\Models\CompanyPaymentReceipt::where('status', 'pending')->count(),
            'pending_wallet_topups' => \App\Models\Transaction::where('type', 'topup')->where('status', 'pending')->count(),
        ];

        // Rides over time (last 30 days)
        $ridesOverTime = Ride::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // Recent rides
        $recentRides = Ride::with(['passenger', 'driver.user'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Recent registrations
        $recentRegistrations = User::orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        // Active drivers with locations
        $activeDrivers = Driver::with(['user', 'location'])
            ->whereIn('status', ['available', 'on_ride'])
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'name' => $driver->user->name ?? 'Unknown',
                    'lat' => $driver->location->latitude ?? null,
                    'lng' => $driver->location->longitude ?? null,
                    'status' => $driver->status,
                ];
            })
            ->filter(fn($d) => $d['lat'] !== null && $d['lng'] !== null)
            ->values();

        return Inertia::render('admin', [
            'stats' => $stats,
            'ridesOverTime' => $ridesOverTime,
            'recentRides' => $recentRides,
            'recentRegistrations' => $recentRegistrations,
            'activeDrivers' => $activeDrivers,
        ]);
    }

    /**
     * Get admin dashboard statistics
     */
    public function adminStats()
    {
        $userCount = User::count();
        $driverCount = Driver::count();
        $vehicleCount = Vehicle::count();
        $rideCount = Ride::count();

        return response()->json([
            'users' => $userCount,
            'drivers' => $driverCount,
            'vehicles' => $vehicleCount,
            'rides' => $rideCount,
        ]);
    }

    /**
     * Get companies management page
     */
    public function companies()
    {
        $companies = Company::withCount(['employees' => function ($query) {
            $query->where('status', 'approved');
        }])->orderBy('created_at', 'desc')->get();

        // Get all approved drivers for assignment
        $drivers = Driver::with('user')
            ->where('approval_state', 'approved')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($driver) {
                return [
                    'id' => $driver->id,
                    'name' => $driver->user->name ?? 'Unknown',
                    'email' => $driver->user->email ?? '',
                    'phone' => $driver->user->phone ?? '',
                    'license_number' => $driver->license_number ?? '',
                ];
            });

        $stats = [
            'total_companies' => Company::count(),
            'active_companies' => Company::where('is_active', true)->count(),
            'total_employees' => CompanyEmployee::where('status', 'approved')->count(),
            'pending_requests' => CompanyEmployee::where('status', 'pending')->count(),
        ];

        return Inertia::render('companies', [
            'companies' => $companies,
            'drivers' => $drivers,
            'stats' => $stats,
        ]);
    }

    /**
     * Assign a driver to a company
     */
    public function assignDriverToCompany(Request $request, $companyId)
    {
        $validator = Validator::make($request->all(), [
            'driver_id' => 'required|exists:drivers,id',
            'contract_start_date' => 'required|date|after_or_equal:today',
            'contract_end_date' => 'nullable|date|after:contract_start_date',
            'status' => 'required|in:active,pending',
            'terms' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $company = Company::findOrFail($companyId);
            $driver = Driver::findOrFail($request->driver_id);

            // Check if driver is approved
            if ($driver->approval_state !== 'approved') {
                return redirect()->back()->with('error', 'Driver must be approved before assignment.');
            }

            // Check if contract already exists
            $existingContract = CompanyDriverContract::where('company_id', $companyId)
                ->where('driver_id', $driver->id)
                ->where('status', 'active')
                ->first();

            if ($existingContract) {
                return redirect()->back()->with('error', 'This driver already has an active contract with this company.');
            }

            $contract = CompanyDriverContract::create([
                'company_id' => $companyId,
                'driver_id' => $driver->id,
                'status' => $request->status,
                'contract_start_date' => $request->contract_start_date,
                'contract_end_date' => $request->contract_end_date,
                'terms' => $request->terms,
            ]);

            AuditService::medium('Driver Assigned to Company', $contract, "Assigned driver {$driver->user->name} to {$company->name}");

            return redirect()->back()->with('success', 'Driver assigned to company successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to assign driver: ' . $e->getMessage());
        }
    }

    /**
     * Get company employees management page
     */
    public function companyEmployees()
    {
        $employees = CompanyEmployee::with(['user', 'company'])
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_employees' => CompanyEmployee::where('status', 'approved')->count(),
            'pending_requests' => CompanyEmployee::where('status', 'pending')->count(),
            'approved_employees' => CompanyEmployee::where('status', 'approved')->count(),
            'rejected_requests' => CompanyEmployee::where('status', 'rejected')->count(),
        ];

        return Inertia::render('company-employees', [
            'employees' => $employees,
            'stats' => $stats,
        ]);
    }

    public function passengers()
    {
        $passengers = User::where('role', 'passenger')->orderBy('created_at', 'desc')->get();

        $passengers = $passengers->map(function ($passenger) {
            return [
                'id' => $passenger->id,
                'name' => $passenger->name,
                'email' => $passenger->email,
                'phone' => $passenger->phone,
                'created_at' => $passenger->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'updated_at' => $passenger->updated_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
            ];
        });

        return Inertia::render('passengers', [
            'passengers' => $passengers,
        ]);
    }

    public function drivers()
    {
        $drivers = Driver::with(['user', 'rides', 'vehicle.type'])->orderBy('created_at', 'desc')->get();
        $drivers = $drivers->map(function ($driver) {
            $user = $driver->user;
            $rides = $driver->rides->all();
            $no_of_rides = count($rides);
            $vehicle = $driver->vehicle;
            return [
                'noOfRides' => $no_of_rides,
                'id' => $driver->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'license_number' => $driver->license_number,
                'license_image_path' => asset('storage/' . $driver->license_image_path),
                'profile_picture_path' => asset('storage/' . $driver->profile_picture_path),
                'status' => $driver->status,
                'vehicle_type' => $vehicle && $vehicle->type ? $vehicle->type->display_name : 'N/A',
                'vehicle_details' => $vehicle ? "{$vehicle->make} {$vehicle->model} ({$vehicle->plate_number})" : 'N/A',
                'created_at' => $driver->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'updated_at' => $driver->updated_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'approval_state' => $driver->approval_state,
            ];
        });
        return Inertia::render('drivers', [
            'drivers' => $drivers,
        ]);
    }

    public function getRides()
    {
        $rides = Ride::with(['passenger', 'driver.user', 'notifiedDriver.user', 'payment', 'rating'])
            ->orderBy('created_at', 'desc')
            ->get();

        $formattedRides = $rides->map(function ($ride) {
            $driver = $ride->driver;
            $driverName = $driver && $driver->user ? $driver->user->name : 'Not Assigned';

            return [
                'id' => $ride->id,
                'passenger_id' => $ride->passenger_id,
                'passenger_name' => $ride->passenger ? $ride->passenger->name : 'Unknown',
                'passenger_phone' => $ride->passenger ? $ride->passenger->phone : 'N/A',
                'driver_id' => $ride->driver_id,
                'driver_name' => $driverName,
                'pickup_address' => $ride->pickup_address ?? 'N/A',
                'destination_address' => $ride->destination_address ?? 'N/A',
                'origin_lat' => $ride->origin_lat,
                'origin_lng' => $ride->origin_lng,
                'destination_lat' => $ride->destination_lat,
                'destination_lng' => $ride->destination_lng,
                'price' => $ride->price,
                'status' => $ride->status,
                'cash_payment' => $ride->cash_payment,
                'prepaid' => $ride->prepaid,
                'is_pool_ride' => $ride->is_pool_ride ?? false,
                'requested_at' => $ride->requested_at ? \Carbon\Carbon::parse($ride->requested_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
                'started_at' => $ride->started_at ? \Carbon\Carbon::parse($ride->started_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
                'completed_at' => $ride->completed_at ? \Carbon\Carbon::parse($ride->completed_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
                'cancelled_at' => $ride->cancelled_at ? \Carbon\Carbon::parse($ride->cancelled_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
                'created_at' => $ride->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'payment_status' => $ride->payment ? $ride->payment->status : null,
                'rating' => $ride->rating ? $ride->rating->score : null,
                'dispatched_by_admin_id' => $ride->dispatched_by_admin_id,
                'cancelled_by' => $ride->cancelled_by,
                'notified_driver_id' => $ride->notified_driver_id,
                'notified_driver_name' => $ride->notified_driver_name,
                'notified_driver_phone' => $ride->notified_driver_phone,
                'notified_drivers_count' => $ride->notified_drivers_count,
            ];
        });

        $stats = [
            'total_rides' => $rides->count(),
            'live_rides' => $rides->whereIn('status', ['accepted', 'in_progress'])->count(),
            'requested_rides' => $rides->where('status', 'requested')->count(),
            'completed_rides' => $rides->where('status', 'completed')->count(),
            'cancelled_rides' => $rides->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('rides', [
            'rides' => $formattedRides,
            'stats' => $stats,
        ]);
    }

    public function showRide($id)
    {
        $ride = Ride::with(['passenger', 'driver.user', 'driver.vehicle', 'notifiedDriver.user', 'payment', 'rating'])
            ->findOrFail($id);

        $formattedRide = [
            'id' => $ride->id,
            'passenger_id' => $ride->passenger_id,
            'passenger_name' => $ride->passenger ? $ride->passenger->name : 'Unknown',
            'passenger_phone' => $ride->passenger ? $ride->passenger->phone : 'N/A',
            'passenger_email' => $ride->passenger ? $ride->passenger->email : 'N/A',
            'driver_id' => $ride->driver_id,
            'driver_name' => $ride->driver && $ride->driver->user ? $ride->driver->user->name : 'Not Assigned',
            'driver_phone' => $ride->driver && $ride->driver->user ? $ride->driver->user->phone : 'N/A',
            'vehicle' => $ride->driver && $ride->driver->vehicle ? [
                'make' => $ride->driver->vehicle->make,
                'model' => $ride->driver->vehicle->model,
                'plate_number' => $ride->driver->vehicle->plate_number,
                'color' => $ride->driver->vehicle->color,
            ] : null,
            'pickup_address' => $ride->pickup_address ?? 'N/A',
            'destination_address' => $ride->destination_address ?? 'N/A',
            'origin_lat' => $ride->origin_lat,
            'origin_lng' => $ride->origin_lng,
            'destination_lat' => $ride->destination_lat,
            'destination_lng' => $ride->destination_lng,
            'price' => $ride->price,
            'status' => $ride->status,
            'cash_payment' => $ride->cash_payment,
            'prepaid' => $ride->prepaid,
            'is_pool_ride' => $ride->is_pool_ride ?? false,
            'requested_at' => $ride->requested_at ? \Carbon\Carbon::parse($ride->requested_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
            'started_at' => $ride->started_at ? \Carbon\Carbon::parse($ride->started_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
            'completed_at' => $ride->completed_at ? \Carbon\Carbon::parse($ride->completed_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
            'cancelled_at' => $ride->cancelled_at ? \Carbon\Carbon::parse($ride->cancelled_at)->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s') : null,
            'created_at' => $ride->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
            'payment_status' => $ride->payment ? $ride->payment->status : null,
            'payment_method' => $ride->payment ? $ride->payment->method : null,
            'rating' => $ride->rating ? $ride->rating->score : null,
            'rating_comment' => $ride->rating ? $ride->rating->comment : null,
            'dispatched_by_admin_id' => $ride->dispatched_by_admin_id,
            'cancelled_by' => $ride->cancelled_by,
            'notified_driver_id' => $ride->notified_driver_id,
            'notified_driver_name' => $ride->notified_driver_name,
            'notified_driver_phone' => $ride->notified_driver_phone,
            'notified_drivers_count' => $ride->notified_drivers_count,
        ];

        return Inertia::render('rides/show', [
            'ride' => $formattedRide,
        ]);
    }

    public function trackRide($id)
    {
        $ride = Ride::with(['driver.user', 'driver.vehicle'])->findOrFail($id);

        return Inertia::render('rides/track', [
            'ride' => $ride,
        ]);
    }

    public function driverProfile($id)
    {
        $driver = Driver::with(['user', 'vehicle.type'])->findOrFail($id);
        $driver->noOfRides = Ride::where('driver_id', $id)->where('status', 'completed')->count();

        // Ensure name and phone are accessible directly if the frontend expects it
        // and fix image paths
        $driver_data = [
            'id' => $driver->id,
            'user_id' => $driver->user_id,
            'name' => $driver->user->name ?? 'Unknown',
            'email' => $driver->user->email ?? 'Not provided',
            'phone' => $driver->user->phone ?? 'Not provided',
            'license_number' => $driver->license_number,
            'license_image_path' => $driver->license_image_path ? asset('storage/' . $driver->license_image_path) : null,
            'profile_picture_path' => $driver->profile_picture_path ? asset('storage/' . $driver->profile_picture_path) : null,
            'car_picture_path' => $driver->car_picture_path ? asset('storage/' . $driver->car_picture_path) : null,
            'status' => $driver->status,
            'rating' => $driver->rating,
            'noOfRides' => $driver->noOfRides,
            'approval_state' => $driver->approval_state,
            'reject_message' => $driver->reject_message,
            'created_at' => $driver->created_at,
            'updated_at' => $driver->updated_at,
        ];

        return Inertia::render('driver/profile', [
            'driver' => $driver_data,
            'user_id' => $id
        ]);
    }

    public function driverEarnings($id)
    {
        $driver = Driver::findOrFail($id);
        $rides = Ride::where('driver_id', $id)
            ->where('status', 'completed')
            ->orderBy('completed_at', 'desc')
            ->get();

        $totalEarnings = $rides->sum('price');

        return Inertia::render('driver/earnings', [
            'driver' => $driver,
            'rides' => $rides,
            'totalEarnings' => $totalEarnings,
            'user_id' => $id
        ]);
    }

    public function driverVehicle($id)
    {
        $driver = Driver::with('vehicle.type')->findOrFail($id);
        return Inertia::render('driver/vehicle', [
            'driver' => $driver,
            'vehicle' => $driver->vehicle,
            'user_id' => $id
        ]);
    }

    public function driverSchedule($id)
    {
        $driver = Driver::findOrFail($id);
        $schedules = CompanyGroupRideInstance::where('driver_id', $id)
            ->whereIn('status', ['requested', 'accepted'])
            ->where('scheduled_time', '>=', now())
            ->orderBy('scheduled_time', 'asc')
            ->get();

        return Inertia::render('driver/schedule', [
            'driver' => $driver,
            'schedules' => $schedules,
            'user_id' => $id
        ]);
    }

    public function rideTimeline($id)
    {
        $ride = Ride::findOrFail($id);

        // For now, return empty as there's no ride_events table yet
        return Inertia::render('rides/timeline', [
            'ride' => $ride,
            'events' => [],
        ]);
    }

    public function transactions()
    {
        $transactions = \App\Models\Transaction::with(['wallet.user'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                return [
                    'id' => $t->id,
                    'amount' => $t->amount,
                    'type' => $t->type,
                    'status' => $t->status,
                    'note' => $t->note,
                    'user_name' => $t->wallet->user->name ?? 'Unknown',
                    'user_phone' => $t->wallet->user->phone ?? 'N/A',
                    'created_at' => $t->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                ];
            });

        return Inertia::render('transactions', [
            'transactions' => $transactions,
        ]);
    }

    public function logs()
    {
        $logPath = storage_path('logs/laravel.log');
        $logs = [];

        if (file_exists($logPath)) {
            // Read last 100 lines
            $file = new \SplFileObject($logPath, 'r');
            $file->seek(PHP_INT_MAX);
            $totalLines = $file->key();
            $startLine = max(0, $totalLines - 100);

            $file->seek($startLine);
            while (!$file->eof()) {
                $line = trim($file->fgets());
                if ($line) {
                    $logs[] = $line;
                }
            }
        }

        return Inertia::render('logs', [
            'logs' => array_reverse($logs),
            'stats' => [
                'memory_usage' => round(memory_get_usage() / 1024 / 1024, 2) . ' MB',
                'uptime' => 'System Online',
            ]
        ]);
    }

    public function audit()
    {
        $audits = \App\Models\AuditLog::with('admin')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'subject' => $log->subject_type ? class_basename($log->subject_type) . " #" . $log->subject_id : 'System',
                    'admin' => $log->admin->name ?? 'System',
                    'admin_role' => $log->admin->role ?? 'system',
                    'date' => $log->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                    'impact' => $log->impact,
                    'details' => $log->details
                ];
            });

        return Inertia::render('audit', [
            'audits' => $audits,
        ]);
    }

    public function driversAlt()
    {
        $users = User::where('role', 'driver')
            ->with(['driver.rides', 'driver.vehicle.type'])
            ->orderBy('created_at', 'desc')
            ->get();

        $drivers = $users->map(function ($user) {
            $driver = $user->driver;

            if (!$driver) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'noOfRides' => 0,
                    'license_number' => 'N/A',
                    'license_image_path' => null,
                    'profile_picture_path' => null,
                    'status' => 'N/A',
                    'vehicle_type' => 'N/A',
                    'vehicle_details' => 'N/A',
                    'created_at' => $user->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                    'updated_at' => $user->updated_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                    'approval_state' => 'Not Submitted',
                    'reject_message' => ''
                ];
            }

            $vehicle = $driver->vehicle;
            $noOfRides = $driver->rides->count();

            return [
                'id' => $driver->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'noOfRides' => $noOfRides,
                'license_number' => $driver->license_number,
                'license_image_path' => $driver->license_image_path ? asset('storage/' . $driver->license_image_path) : null,
                'profile_picture_path' => $driver->profile_picture_path ? asset('storage/' . $driver->profile_picture_path) : null,
                'status' => $driver->status,
                'vehicle_type' => ($vehicle && $vehicle->type) ? $vehicle->type->display_name : 'N/A',
                'vehicle_details' => $vehicle ? "{$vehicle->make} {$vehicle->model} ({$vehicle->plate_number})" : 'N/A',
                'created_at' => $driver->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'updated_at' => $driver->updated_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                'approval_state' => $driver->approval_state,
                'reject_message' => $driver->reject_message ?? '',
            ];
        });

        return Inertia::render('drivers', [
            'drivers' => $drivers,
        ]);
    }

    /**
     * Super admin view: Company rides grouped by company
     */
    public function companyRides()
    {
        $companies = Company::orderBy('name')->get(['id', 'name']);

        $rides = CompanyGroupRideInstance::with(['company', 'employee', 'driver'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Group rides by company id for easier client rendering
        $grouped = $rides->groupBy('company_id')->map(function ($list) {
            return $list->values();
        });

        return Inertia::render('admin/company-rides', [
            'companies' => $companies,
            'ridesByCompany' => $grouped,
            'stats' => [
                'total' => $rides->count(),
                'requested' => $rides->where('status', 'requested')->count(),
                'accepted' => $rides->where('status', 'accepted')->count(),
                'in_progress' => $rides->where('status', 'in_progress')->count(),
                'completed' => $rides->where('status', 'completed')->count(),
                'cancelled' => $rides->where('status', 'cancelled')->count(),
            ],
        ]);
    }

    /**
     * Super admin cancels a company ride (requested or accepted)
     */
    public function cancelCompanyRide($id)
    {
        try {
            $ride = \App\Models\CompanyGroupRideInstance::findOrFail($id);
            if (!in_array($ride->status, ['requested', 'accepted'])) {
                return redirect()->back()->withErrors(['error' => 'Ride cannot be cancelled in current status']);
            }
            $ride->status = 'cancelled';
            $ride->save();
            return redirect()->back()->with('success', 'Ride cancelled successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to cancel ride: ' . $e->getMessage()]);
        }
    }

    /**
     * Super admin: create a company ride
     */
    public function createCompanyRide(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_id' => 'required|exists:companies,id',
            'employee_id' => 'required|exists:users,id',
            'pickup_address' => 'required|string|max:255',
            'destination_address' => 'required|string|max:255',
            'origin_lat' => 'required|numeric',
            'origin_lng' => 'required|numeric',
            'destination_lat' => 'required|numeric',
            'destination_lng' => 'required|numeric',
            'price' => 'nullable|numeric|min:0',
            'scheduled_time' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            // Ensure employee is approved for this company
            $approved = \App\Models\CompanyEmployee::where('company_id', $request->company_id)
                ->where('user_id', $request->employee_id)
                ->where('status', 'approved')
                ->exists();
            if (!$approved) {
                return redirect()->back()->withErrors(['employee_id' => 'Employee is not approved for the selected company'])->withInput();
            }

            $ride = DB::transaction(function () use ($request) {
                return \App\Models\CompanyGroupRideInstance::create([
                    'company_id' => $request->company_id,
                    'employee_id' => $request->employee_id,
                    'pickup_address' => $request->pickup_address,
                    'destination_address' => $request->destination_address,
                    'origin_lat' => $request->origin_lat,
                    'origin_lng' => $request->origin_lng,
                    'destination_lat' => $request->destination_lat,
                    'destination_lng' => $request->destination_lng,
                    'price' => $request->price,
                    'scheduled_time' => $request->scheduled_time ? \Carbon\Carbon::parse($request->scheduled_time) : now(),
                    'status' => 'requested',
                    'requested_at' => now(),
                    'assignment_retry_count' => 0,
                ]);
            });

            // Dispatch ride scheduled event
            event(new RideScheduled($ride));

            // Attempt immediate assignment using the shared service
            $assignmentService = app(\App\Services\CompanyRideAssignmentService::class);
            $result = $assignmentService->assignDriver($ride);
            if (!$result['success']) {
                // Schedule retry in background
                \App\Jobs\RetryCompanyRideAssignment::dispatch($ride)->delay(now()->addMinutes(5));
                return redirect()->back()->with('warning', 'Ride created. No driver available now; system will retry soon.');
            }

            return redirect()->back()->with('success', 'Ride created and driver assigned successfully');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['server' => 'Failed to create ride: ' . $e->getMessage()]);
        }
    }

    /**
     * JSON: Approved employees for a company (for admin UI)
     */
    public function approvedCompanyEmployees($id)
    {
        $employees = \App\Models\CompanyEmployee::with('user')
            ->where('company_id', $id)
            ->where('status', 'approved')
            ->get()
            ->map(function ($ce) {
                return [
                    'id' => $ce->user->id,
                    'name' => $ce->user->name,
                    'email' => $ce->user->email,
                ];
            });

        return response()->json(['employees' => $employees]);
    }

    public function passengerProfile($id)
    {
        $user = User::find($id);
        $passenger_data = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'profile_picture_path' => asset('storage/' . $user->profile_image),
            'created_at' => $user->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
            'updated_at' => $user->updated_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
        ];
        return Inertia::render('passenger/profile', ['passenger' => $passenger_data]);
    }


    /**
     * Get company profile with detailed information
     */
    public function companyProfile($id)
    {
        $company = Company::withCount([
            'employees' => function ($query) {
                $query->where('status', 'approved');
            },
            'rides',
            'driverContracts' => function ($query) {
                $query->where('status', 'active')
                    ->where('start_date', '<=', now())
                    ->where(function ($q) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', now());
                    });
            }
        ])->findOrFail($id);

        // Get statistics
        $stats = [
            'total_employees' => CompanyEmployee::where('company_id', $id)->count(),
            'approved_employees' => CompanyEmployee::where('company_id', $id)->where('status', 'approved')->count(),
            'pending_employees' => CompanyEmployee::where('company_id', $id)->where('status', 'pending')->count(),
            'total_rides' => CompanyGroupRideInstance::where('company_id', $id)->count(),
            'completed_rides' => CompanyGroupRideInstance::where('company_id', $id)->where('status', 'completed')->count(),
            'in_progress_rides' => CompanyGroupRideInstance::where('company_id', $id)->where('status', 'in_progress')->count(),
            'requested_rides' => CompanyGroupRideInstance::where('company_id', $id)->where('status', 'requested')->count(),
            'total_drivers' => CompanyDriverContract::where('company_id', $id)
                ->where('status', 'active')
                ->where('start_date', '<=', now())
                ->where(function ($query) {
                    $query->whereNull('end_date')
                        ->orWhere('end_date', '>=', now());
                })
                ->count(),
        ];

        // Get recent rides
        $recentRides = CompanyGroupRideInstance::with(['employee', 'driver.user'])
            ->where('company_id', $id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Get active drivers
        $activeDrivers = CompanyDriverContract::with(['driver.user', 'driver.vehicle'])
            ->where('company_id', $id)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->get()
            ->map(function ($contract) {
                return [
                    'id' => $contract->driver->id,
                    'name' => $contract->driver->user->name ?? 'Unknown',
                    'status' => $contract->driver->status,
                    'license_number' => $contract->driver->license_number,
                ];
            });

        return Inertia::render('company/profile', [
            'company' => $company,
            'stats' => $stats,
            'recentRides' => $recentRides,
            'activeDrivers' => $activeDrivers,
        ]);
    }

    /**
     * Get company employees for a specific company
     */
    public function companyEmployeesView($id)
    {
        $company = Company::findOrFail($id);

        $employees = CompanyEmployee::with(['user'])
            ->where('company_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_employees' => $employees->count(),
            'approved_employees' => $employees->where('status', 'approved')->count(),
            'pending_employees' => $employees->where('status', 'pending')->count(),
            'rejected_employees' => $employees->where('status', 'rejected')->count(),
        ];

        return Inertia::render('company/employees', [
            'company' => $company,
            'employees' => $employees,
            'stats' => $stats,
        ]);
    }

    /**
     * Get company drivers for a specific company
     */
    public function companyDriversView($id)
    {
        $company = Company::findOrFail($id);

        $contracts = CompanyDriverContract::with(['driver.user', 'driver.vehicle'])
            ->where('company_id', $id)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now());
            })
            ->get();

        $drivers = $contracts->map(function ($contract) {
            $driver = $contract->driver;
            $user = $driver->user ?? null;

            return [
                'id' => $driver->id,
                'name' => $user->name ?? 'Unknown',
                'email' => $user->email ?? '',
                'phone' => $user->phone ?? '',
                'license_number' => $driver->license_number ?? '',
                'status' => $driver->status ?? 'unknown',
                'approval_state' => $driver->approval_state ?? 'unknown',
                'vehicle' => $driver->vehicle ? [
                    'make' => $driver->vehicle->make,
                    'model' => $driver->vehicle->model,
                    'plate_number' => $driver->vehicle->plate_number,
                    'color' => $driver->vehicle->color,
                ] : null,
                'contract' => [
                    'id' => $contract->id,
                    'start_date' => $contract->start_date,
                    'end_date' => $contract->end_date,
                ],
            ];
        });

        $stats = [
            'total_drivers' => $drivers->count(),
            'available_drivers' => $drivers->where('status', 'available')->count(),
            'on_ride_drivers' => $drivers->where('status', 'on_ride')->count(),
        ];

        return Inertia::render('company/drivers', [
            'company' => $company,
            'drivers' => $drivers,
            'stats' => $stats,
        ]);
    }

    /**
     * Get company rides for a specific company
     */
    public function companyRidesView($id)
    {
        $company = Company::findOrFail($id);

        $rides = CompanyGroupRideInstance::with(['employee', 'driver.user', 'driver.vehicle'])
            ->where('company_id', $id)
            ->orderBy('created_at', 'desc')
            ->get();

        $stats = [
            'total_rides' => $rides->count(),
            'requested_rides' => $rides->where('status', 'requested')->count(),
            'accepted_rides' => $rides->where('status', 'accepted')->count(),
            'in_progress_rides' => $rides->where('status', 'in_progress')->count(),
            'completed_rides' => $rides->where('status', 'completed')->count(),
            'cancelled_rides' => $rides->where('status', 'cancelled')->count(),
        ];

        return Inertia::render('company/rides', [
            'company' => $company,
            'rides' => $rides,
            'stats' => $stats,
        ]);
    }

    public function passengerRides($id)
    {
        $rides = Ride::with('rating')->where('passenger_id', $id)->orderBy('created_at', 'desc')->get();
        $no_of_rides = count($rides);

        $totalSpent = $rides->where('status', 'completed')->sum('price');
        $averageRating = $rides->where('status', 'completed')->whereNotNull('rating')->avg('rating.score') ?? 0;

        $data = [
            'noOfRides' => $no_of_rides,
            'totalSpent' => round($totalSpent, 2),
            'averageRating' => round($averageRating, 1),
            'rides' => $rides->map(function ($ride) {
                $ride_data = [
                    'id' => $ride->id,
                    'created_at' => $ride->created_at->copy()->timezone('Africa/Addis_Ababa')->format('Y-m-d H:i:s'),
                    'pickup_address' => $ride->pickup_address,
                    'destination_address' => $ride->destination_address,
                    'price' => $ride->price,
                    'status' => $ride->status,
                    'rating' => $ride->rating ? $ride->rating->score : null,
                ];
                $driver = $ride->driver;
                if ($driver && $driver->user) {
                    $driver_name = $driver->user->name;
                    $driver_id = $driver->id;
                } else {
                    $driver_name = 'No driver';
                    $driver_id = null;
                }
                $ride_data['driver_name'] = $driver_name;
                $ride_data['driver_id'] = $driver_id;
                return $ride_data;
            }),
        ];
        return Inertia::render('passenger/rides', ['user_id' => $id, 'data' => $data]);
    }

    public function passengerPayments($id)
    {
        $user = User::with(['wallet.transactions' => function ($query) {
            $query->orderBy('created_at', 'desc');
        }])->findOrFail($id);

        $wallet = $user->wallet;
        $transactions = $wallet ? $wallet->transactions : collect();

        $totalSpent = $user->rides()
            ->where('status', 'completed')
            ->sum('price');

        $data = [
            'balance' => $wallet->balance ?? 0,
            'totalSpent' => round($totalSpent, 2),
            'lastRecharge' => $transactions->where('type', 'deposit')->first()?->created_at?->format('Y-m-d') ?? 'N/A',
            'transactions' => $transactions->map(function ($t) {
                return [
                    'id' => $t->id,
                    'amount' => $t->amount,
                    'method' => $t->type === 'deposit' ? 'wallet' : 'ride', // Simplified mapping
                    'status' => $t->status ?? 'completed',
                    'date' => $t->created_at->format('Y-m-d'),
                    'time' => $t->created_at->format('H:i'),
                    'description' => $t->note ?? 'Transaction',
                    'transactionId' => 'TXN-' . str_pad($t->id, 6, '0', STR_PAD_LEFT),
                ];
            }),
        ];

        return Inertia::render('passenger/payments', [
            'user_id' => $id,
            'data' => $data
        ]);
    }

    public function passengerFavorites($id)
    {
        $user = User::with('favorites')->findOrFail($id);
        $favorites = $user->favorites;

        $data = [
            'favorites' => $favorites->map(function ($f) {
                return [
                    'id' => $f->id,
                    'name' => $f->name,
                    'address' => $f->address,
                    'type' => $f->type,
                    'coordinates' => ['lat' => $f->latitude, 'lng' => $f->longitude],
                    'lastUsed' => $f->updated_at->format('Y-m-d'),
                    'useCount' => 0, // Placeholder as we don't track usage count yet
                ];
            }),
            'stats' => [
                'totalFavorites' => $favorites->count(),
                'totalUses' => 0,
                'avgUses' => 0,
            ]
        ];

        return Inertia::render('passenger/favorites', [
            'user_id' => $id,
            'data' => $data
        ]);
    }

    public function driverLocation($id)
    {
        $driver = Driver::find($id);
        return Inertia::render('driver/location', ['location' => $driver->location, 'status' => $driver->status]);
    }

    public function driverTrips($id)
    {
        $driver = Driver::find($id);
        $rides = $driver->rides->all();
        return Inertia::render('driver/trips', ['rides' => $rides]);
    }

    public function approveDriver(Driver $driver)
    {
        $driver->approval_state = 'approved';
        $driver->save();

        AuditService::high('Driver Approved', $driver, "Approved driver {$driver->user->name}");

        return Redirect::back();
    }

    public function rejectDriver(Request $request, Driver $driver)
    {
        // Optionally validate and log the reject reason
        $request->validate([
            'reject_message' => 'nullable|string|max:1000',
        ]);

        $driver->approval_state = 'rejected';
        $driver->reject_message = $request->input('reject_message');
        $driver->save();

        AuditService::high('Driver Rejected', $driver, "Rejected driver {$driver->user->name}. Reason: " . ($request->reject_message ?? 'No reason provided'));

        return Redirect::back();
    }

    public function requestRide() {}

    /**
     * Create a new company
     */
    public function createCompany(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:companies,name',
            'code' => 'nullable|string|max:10|unique:companies,code',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:companies,email',
            'admin_email' => 'required|email|max:255|unique:admins,email',
            'admin_password' => 'required|string|min:8',
        ], [
            'name.unique' => 'A company with this name already exists.',
            'code.unique' => 'A company with this code already exists.',
            'email.unique' => 'A company with this email already exists.',
            'email.email' => 'Please enter a valid email address.',
            'admin_email.required' => 'Admin email is required.',
            'admin_email.email' => 'Please enter a valid admin email address.',
            'admin_email.unique' => 'An admin with this email already exists.',
            'admin_password.required' => 'Admin password is required.',
            'admin_password.min' => 'Admin password must be at least 8 characters.',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $companyData = $request->only([
                'name',
                'description',
                'address',
                'phone',
                'email'
            ]);

            // Generate unique code if not provided
            if (!$request->has('code') || empty($request->code)) {
                $companyData['code'] = Company::generateCode();
            } else {
                $companyData['code'] = strtoupper($request->code);
            }

            $company = Company::create($companyData);

            // Create company admin account
            $admin = \App\Models\Admin::create([
                'name' => $company->name . ' Admin',
                'email' => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'role' => 'company_admin',
                'company_id' => $company->id,
            ]);

            AuditService::medium('Company Created', $company, "Created company {$company->name} and admin {$admin->email}");

            DB::commit();

            return redirect()->back()->with('success', 'Company and admin account created successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create company: ' . $e->getMessage())->withInput();
        }
    }
    /**
     * Update a company
     */
    public function updateCompany(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:companies,name,' . $id,
            'code' => 'nullable|string|max:10|unique:companies,code,' . $id,
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255|unique:companies,email,' . $id,
        ], [
            'name.unique' => 'A company with this name already exists.',
            'code.unique' => 'A company with this code already exists.',
            'email.unique' => 'A company with this email already exists.',
            'email.email' => 'Please enter a valid email address.',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $companyData = $request->only([
                'name',
                'description',
                'address',
                'phone',
                'email'
            ]);

            if ($request->has('code') && !empty($request->code)) {
                $companyData['code'] = strtoupper($request->code);
            }

            $company->update($companyData);

            return redirect()->back()->with('success', 'Company updated successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update company: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Delete a company
     */
    public function deleteCompany($id)
    {
        try {
            $company = Company::findOrFail($id);
            $company->delete();

            return redirect()->back()->with('success', 'Company deleted successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete company: ' . $e->getMessage());
        }
    }

    /**
     * Approve employee request
     */
    public function approveEmployee($id)
    {
        try {
            $employee = CompanyEmployee::findOrFail($id);

            // Check if employee request is pending
            if ($employee->status !== 'pending') {
                return redirect()->back()->with('error', 'Employee request is not pending');
            }

            DB::beginTransaction();

            // Update company employee record
            $employee->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => Auth::id()
            ]);

            // Update user record to make them an employee
            $employee->user->update([
                'is_employee' => true,
                'company_id' => $employee->company_id,
                'company_name' => $employee->company->name
            ]);

            AuditService::high('Employee Approved', $employee, "Approved employee {$employee->user->name} for {$employee->company->name}");

            DB::commit();

            return redirect()->back()->with('success', 'Employee request approved successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to approve employee request: ' . $e->getMessage());
        }
    }

    /**
     * Reject employee request
     */
    public function rejectEmployee(Request $request, $id)
    {
        try {
            $employee = CompanyEmployee::findOrFail($id);

            // Check if employee request is pending
            if ($employee->status !== 'pending') {
                return redirect()->back()->with('error', 'Employee request is not pending');
            }

            $employee->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejection_reason' => $request->input('rejection_reason')
            ]);

            AuditService::high('Employee Rejected', $employee, "Rejected employee {$employee->user->name} for {$employee->company->name}. Reason: " . ($request->rejection_reason ?? 'No reason provided'));

            return redirect()->back()->with('success', 'Employee request rejected successfully!');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to reject employee request: ' . $e->getMessage());
        }
    }
}
