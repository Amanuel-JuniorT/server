<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\CompanyGroupRideInstance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CompanyAnalyticsController extends Controller
{
    /**
     * Get monthly spend per employee for a company.
     */
    public function spend(Request $request, $companyId)
    {
        try {
            $month = $request->query('month', now()->month);
            $year = $request->query('year', now()->year);

            $spendData = CompanyGroupRideInstance::where('company_id', $companyId)
                ->where('status', 'completed')
                ->whereMonth('completed_at', $month)
                ->whereYear('completed_at', $year)
                ->select('employee_id', DB::raw('SUM(price) as total_spend'), DB::raw('COUNT(*) as total_rides'))
                ->with('employee:id,name')
                ->groupBy('employee_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $spendData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch company spend analytics', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch spend analytics'], 500);
        }
    }

    /**
     * Get driver performance metrics for a company.
     */
    public function driverPerformance(Request $request, $companyId)
    {
        try {
            $performanceData = CompanyGroupRideInstance::where('company_id', $companyId)
                ->whereNotNull('driver_id')
                ->select(
                    'driver_id',
                    DB::raw('COUNT(*) as total_assigned'),
                    DB::raw('COUNT(CASE WHEN status = "completed" THEN 1 END) as total_completed'),
                    DB::raw('COUNT(CASE WHEN status = "cancelled" AND cancelled_by = "driver" THEN 1 END) as total_cancelled_by_driver')
                )
                ->with('driver.user:id,name')
                ->groupBy('driver_id')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $performanceData
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch company driver performance', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch driver performance'], 500);
        }
    }

    /**
     * Get overall rides summary (completed vs cancelled vs requested).
     */
    public function ridesSummary(Request $request, $companyId)
    {
        try {
            $summary = CompanyGroupRideInstance::where('company_id', $companyId)
                ->select('status', DB::raw('COUNT(*) as count'))
                ->groupBy('status')
                ->get()
                ->pluck('count', 'status');

            return response()->json([
                'success' => true,
                'data' => $summary
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch company rides summary', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to fetch rides summary'], 500);
        }
    }

    /**
     * Export all ride instances for a company in CSV format.
     */
    public function export(Request $request, $companyId)
    {
        try {
            $rides = CompanyGroupRideInstance::where('company_id', $companyId)
                ->with(['employee:id,name', 'driver.user:id,name', 'rideGroup:id,group_name'])
                ->orderBy('scheduled_time', 'desc')
                ->get();

            $filename = "company_{$companyId}_rides_export_" . now()->format('Ymd') . ".csv";
            $headers = [
                "Content-type"        => "text/csv",
                "Content-Disposition" => "attachment; filename=$filename",
                "Pragma"              => "no-cache",
                "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
                "Expires"             => "0"
            ];

            $columns = ['ID', 'Route', 'Employee', 'Driver', 'Pickup', 'Destination', 'Scheduled Time', 'Status', 'Price'];

            $callback = function() use ($rides, $columns) {
                $file = fopen('php://output', 'w');
                fputcsv($file, $columns);

                foreach ($rides as $ride) {
                    fputcsv($file, [
                        $ride->id,
                        $ride->rideGroup->group_name ?? 'N/A',
                        $ride->employee->name ?? 'N/A',
                        $ride->driver->user->name ?? 'N/A',
                        $ride->pickup_address,
                        $ride->destination_address,
                        $ride->scheduled_time->toDateTimeString(),
                        $ride->status,
                        $ride->price
                    ]);
                }
                fclose($file);
            };

            return response()->stream($callback, 200, $headers);
        } catch (\Exception $e) {
            Log::error('Failed to export company rides', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Failed to export ride data'], 500);
        }
    }
}
