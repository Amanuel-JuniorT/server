<?php

namespace App\Http\Controllers;

use App\Models\CompanyPaymentReceipt;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Events\GlobalAdminNotification;

class CompanyPaymentReceiptController extends Controller
{
    /**
     * Submit payment receipt (Company Admin)
     */
    public function store(Request $request, $companyId)
    {
        $validator = Validator::make($request->all(), [
            'contract_period_start' => 'nullable|date',
            'contract_period_end' => 'nullable|date|after:contract_period_start',
            'receipt_image_url' => 'nullable|url',
            'receipt_file' => 'nullable|image|max:10240', // 10MB max
            'amount' => 'nullable|numeric|min:0',
            'package_purchase_id' => 'nullable|exists:company_package_purchases,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $amount = $request->amount;
            
            // If amount is missing but package_purchase_id is provided, get it from the purchase record
            if (!$amount && $request->package_purchase_id) {
                $purchase = \App\Models\CompanyPackagePurchase::find($request->package_purchase_id);
                if ($purchase) {
                    $amount = $purchase->amount_paid;
                }
            }

            // Ensure amount is not null finally
            if (!$amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'The amount field is required when not linked to a purchase.'
                ], 422);
            }

            $receiptPath = null;
            $imageUrl = $request->receipt_image_url;

            // Handle file upload if provided
            if ($request->hasFile('receipt_file')) {
                $file = $request->file('receipt_file');
                $timestamp = time();
                $filename = $timestamp . '_' . $file->getClientOriginalName();
                // Omit Disk to use Default filesystem (Supabase on prod, local elsewhere)
                $receiptPath = $file->storeAs('receipts/' . $companyId, $filename);
                $imageUrl = \Illuminate\Support\Facades\Storage::url($receiptPath);
            }

            // If no file but URL is provided (manual input), set receipt_path to the URL or a placeholder
            if (!$receiptPath && $imageUrl) {
                $receiptPath = $imageUrl; // DB requires it, use URL if no file
            }

            if (!$receiptPath) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please provide either a receipt image file or a receipt URL.'
                ], 422);
            }

            $receipt = CompanyPaymentReceipt::create([
                'company_id' => $companyId,
                'contract_period_start' => $request->contract_period_start,
                'contract_period_end' => $request->contract_period_end,
                'receipt_path' => $receiptPath,
                'receipt_image_url' => $imageUrl,
                'amount' => $amount,
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            // If this receipt is for a specific package purchase, link it
            if ($request->package_purchase_id) {
                $purchase = \App\Models\CompanyPackagePurchase::find($request->package_purchase_id);
                if ($purchase && $purchase->company_id == $companyId) {
                    $purchase->update(['company_payment_receipt_id' => $receipt->id]);
                    
                    // Also update the purchase status to pending_verification if it was pending_payment
                    if ($purchase->status === 'pending_payment') {
                        // We'll keep it as pending_payment until admin verifies, 
                        // but the UI will now show that a receipt is attached.
                    }
                }
            }

            // Broadcast notification to admins
            try {
                broadcast(new GlobalAdminNotification("New payment receipt submitted for company ID: {$companyId}", 'payment_receipt', [
                    'company_id' => $companyId,
                    'amount' => $amount,
                ]))->toOthers();
            } catch (\Exception $e) {
                Log::warning('Failed to broadcast payment receipt notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => $receipt,
                'message' => 'Payment receipt submitted successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to submit payment receipt', [
                'company_id' => $companyId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit payment receipt: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * List receipts for a company
     */
    public function index($companyId)
    {
        try {
            $receipts = CompanyPaymentReceipt::where('company_id', $companyId)
                ->with('verifiedBy')
                ->orderBy('submitted_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $receipts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch receipts'
            ], 500);
        }
    }

    /**
     * Get all pending receipts (Super Admin)
     */
    public function getPending()
    {
        try {
            $receipts = CompanyPaymentReceipt::where('status', 'pending')
                ->with(['company', 'verifiedBy'])
                ->orderBy('submitted_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $receipts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch pending receipts'
            ], 500);
        }
    }

    /**
     * Verify payment receipt (Super Admin)
     */
    public function verify(Request $request, $receiptId)
    {
        try {
            $receipt = CompanyPaymentReceipt::findOrFail($receiptId);

            if ($receipt->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt has already been processed'
                ], 409);
            }

            $receipt->verify($request->user()->id);

            // ACTIVATION LOGIC for Ride Packages
            $purchase = \App\Models\CompanyPackagePurchase::where('company_payment_receipt_id', $receipt->id)
                ->where('status', 'pending_payment')
                ->first();

            if ($purchase) {
                $purchase->update(['status' => 'active']);
                
                // Add the rides to the company balance
                $company = \App\Models\Company::find($purchase->company_id);
                if ($company) {
                    $company->increment('total_remaining_rides', $purchase->rides_purchased);
                    
                    Log::info("Ride Package Activated", [
                        'purchase_id' => $purchase->id,
                        'company_id' => $company->id,
                        'rides_added' => $purchase->rides_purchased
                    ]);
                }
            }

            AuditService::high('Company Receipt Verified', $receipt, "Verified receipt of {$receipt->amount} ETB for company: {$receipt->company->name}");

            return response()->json([
                'success' => true,
                'data' => $receipt,
                'message' => 'Receipt verified successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to verify receipt', [
                'receipt_id' => $receiptId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify receipt'
            ], 500);
        }
    }

    /**
     * Reject payment receipt (Super Admin)
     */
    public function reject(Request $request, $receiptId)
    {
        $validator = Validator::make($request->all(), [
            'rejection_reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $receipt = CompanyPaymentReceipt::findOrFail($receiptId);

            if ($receipt->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'Receipt has already been processed'
                ], 409);
            }

            $receipt->reject($request->user()->id, $request->rejection_reason);

            AuditService::high('Company Receipt Rejected', $receipt, "Rejected receipt of {$receipt->amount} ETB for company: {$receipt->company->name}. Reason: {$request->rejection_reason}");

            return response()->json([
                'success' => true,
                'data' => $receipt,
                'message' => 'Receipt rejected'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to reject receipt', [
                'receipt_id' => $receiptId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject receipt'
            ], 500);
        }
    }
}
