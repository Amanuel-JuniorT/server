<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
use App\Models\PromotionCampaign;
use App\Models\UserPromotion;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PromotionController extends Controller
{
    /**
     * Get all active promotions
     */
    public function index(Request $request)
    {
        $type = $request->query('type');
        
        $query = Promotion::active()->orderBy('created_at', 'desc');
        
        if ($type) {
            $query->ofType($type);
        }
        
        $promotions = $query->get();
        
        return response()->json($promotions);
    }

    /**
     * Get all promotions (admin)
     */
    public function adminIndex()
    {
        $promotions = Promotion::orderBy('created_at', 'desc')->get();
        return response()->json($promotions);
    }

    /**
     * Get a single promotion
     */
    public function show($id)
    {
        $promotion = Promotion::find($id);
        
        if (!$promotion) {
            return response()->json(['message' => 'Promotion not found'], 404);
        }
        
        return response()->json($promotion);
    }

    /**
     * Create a new promotion (admin)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'image_url' => 'nullable|url',
            'type' => 'required|in:news,promotion,alert',
            'expiry_date' => 'nullable|date|after:now',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $promotion = Promotion::create($request->all());

        AuditService::medium('Promotion Created', $promotion, "Created promotion/news: {$promotion->title}");

        return response()->json([
            'message' => 'Promotion created successfully',
            'promotion' => $promotion
        ], 201);
    }

    /**
     * Update a promotion (admin)
     */
    public function update(Request $request, $id)
    {
        $promotion = Promotion::find($id);
        
        if (!$promotion) {
            return response()->json(['message' => 'Promotion not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'string',
            'image_url' => 'nullable|url',
            'type' => 'in:news,promotion,alert',
            'expiry_date' => 'nullable|date',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $promotion->update($request->all());

        AuditService::medium('Promotion Updated', $promotion, "Updated promotion/news: {$promotion->title}");

        return response()->json([
            'message' => 'Promotion updated successfully',
            'promotion' => $promotion
        ]);
    }

    /**
     * Delete a promotion (admin)
     */
    public function destroy($id)
    {
        $promotion = Promotion::find($id);
        
        if (!$promotion) {
            return response()->json(['message' => 'Promotion not found'], 404);
        }

        $promotion->delete();

        AuditService::medium('Promotion Deleted', null, "Deleted promotion ID: {$id}");

        return response()->json(['message' => 'Promotion deleted successfully']);
    }

    /**
     * Toggle promotion active status (admin)
     */
    public function toggleActive($id)
    {
        $promotion = Promotion::find($id);
        
        if (!$promotion) {
            return response()->json(['message' => 'Promotion not found'], 404);
        }

        $promotion->is_active = !$promotion->is_active;
        $promotion->save();

        AuditService::log('Promotion Status Toggled', $promotion, 'low', "Toggled active status for promotion: {$promotion->title}. New status: " . ($promotion->is_active ? 'Active' : 'Inactive'));

        return response()->json([
            'message' => 'Promotion status updated',
            'promotion' => $promotion
        ]);
    }

    /**
     * Get the active promotions in the user's wallet.
     */
    public function userWallet(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        try {
            $wallet = UserPromotion::with('campaign')
                ->where('user_id', $user->id)
                ->whereIn('status', ['available', 'applied'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $wallet
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('userWallet error: ' . $e->getMessage());
            // Return empty gracefully — table might not be migrated yet
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
    }

    /**
     * Apply a promotion code to the user's wallet.
     */
    public function applyCode(Request $request)
    {
        $request->validate([
            'code' => 'required|string|max:50'
        ]);

        $user = $request->user();
        $code = strtoupper($request->code);

        $campaign = PromotionCampaign::where('code', $code)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('start_date')
                  ->orWhere('start_date', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('end_date')
                  ->orWhere('end_date', '>=', now());
            })
            ->first();

        if (!$campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid or expired promotion code'
            ], 404);
        }

        // Check if user already has this promotion
        $existing = UserPromotion::where('user_id', $user->id)
            ->where('promotion_campaign_id', $campaign->id)
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You have already applied this promotion'
            ], 400);
        }

        // Check campaign budget
        if ($campaign->total_budget && $campaign->current_spend >= $campaign->total_budget) {
            return response()->json([
                'success' => false,
                'message' => 'This promotion campaign has reached its budget limit'
            ], 400);
        }

        // Create user promotion record
        $userPromotion = UserPromotion::create([
            'user_id' => $user->id,
            'promotion_campaign_id' => $campaign->id,
            'status' => 'applied',
            'rides_remaining' => $campaign->usage_limit_per_user
        ]);

        return response()->json([
            'success' => true,
            'message' => "Promotion '{$campaign->name}' applied successfully!",
            'data' => $userPromotion->load('campaign')
        ]);
    }
}
