<?php

namespace App\Http\Controllers;

use App\Models\Promotion;
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

        AuditService::low('Promotion Status Toggled', $promotion, "Toggled active status for promotion: {$promotion->title}. New status: " . ($promotion->is_active ? 'Active' : 'Inactive'));

        return response()->json([
            'message' => 'Promotion status updated',
            'promotion' => $promotion
        ]);
    }
}
