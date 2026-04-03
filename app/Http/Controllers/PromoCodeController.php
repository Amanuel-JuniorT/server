<?php

namespace App\Http\Controllers;

use App\Models\PromotionCampaign;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PromoCodeController extends Controller
{
    /**
     * Display a listing of the promo codes.
     */
    public function index()
    {
        $campaigns = PromotionCampaign::orderBy('created_at', 'desc')->get();
        
        return Inertia::render('promo-codes', [
            'campaigns' => $campaigns
        ]);
    }

    /**
     * Store a newly created promo code in storage.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'code' => 'required|string|max:50|unique:promotion_campaigns',
            'discount_type' => ['required', Rule::in(['percent', 'fixed', 'flat_fare'])],
            'discount_value' => 'required|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'min_trip_amount' => 'nullable|numeric|min:0',
            'total_budget' => 'nullable|numeric|min:0',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'target_user_type' => ['required', Rule::in(['passenger', 'driver'])],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $request->all();
        $data['min_trip_amount'] = $data['min_trip_amount'] ?: 0;

        $campaign = PromotionCampaign::create($data);

        AuditService::medium('Promo Code Created', $campaign, "Created financial promo code: {$campaign->code}");

        return redirect()->back()->with('success', 'Promo code successfully created.');
    }

    /**
     * Update the specified promo code in storage.
     */
    public function update(Request $request, $id)
    {
        $campaign = PromotionCampaign::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'code' => ['required', 'string', 'max:50', Rule::unique('promotion_campaigns')->ignore($campaign->id)],
            'discount_type' => ['required', Rule::in(['percent', 'fixed', 'flat_fare'])],
            'discount_value' => 'required|numeric|min:0',
            'max_discount_amount' => 'nullable|numeric|min:0',
            'min_trip_amount' => 'nullable|numeric|min:0',
            'total_budget' => 'nullable|numeric|min:0',
            'usage_limit_per_user' => 'nullable|integer|min:1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'target_user_type' => ['required', Rule::in(['passenger', 'driver'])],
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $data = $request->all();
        $data['min_trip_amount'] = $data['min_trip_amount'] ?: 0;

        $campaign->update($data);

        AuditService::medium('Promo Code Updated', $campaign, "Updated financial promo code: {$campaign->code}");

        return redirect()->back()->with('success', 'Promo code successfully updated.');
    }

    /**
     * Remove the specified promo code from storage.
     */
    public function destroy($id)
    {
        $campaign = PromotionCampaign::findOrFail($id);
        
        // Optionally check if it has user promotions mapped
        if ($campaign->userPromotions()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete a promo code that has already been claimed by users. Please suspend (deactivate) it instead.']);
        }

        $code = $campaign->code;
        $campaign->delete();

        AuditService::high('Promo Code Deleted', null, "Deleted financial promo code: {$code}");

        return redirect()->back()->with('success', 'Promo code successfully deleted.');
    }

    /**
     * Toggle the active status.
     */
    public function toggleActive($id)
    {
        $campaign = PromotionCampaign::findOrFail($id);
        $campaign->is_active = !$campaign->is_active;
        $campaign->save();

        AuditService::log('Promo Code Toggled', $campaign, 'low', "Toggled active status for promo code: {$campaign->code}. New status: " . ($campaign->is_active ? 'Active' : 'Suspended'));

        return redirect()->back()->with('success', 'Promo code status updated.');
    }
}
