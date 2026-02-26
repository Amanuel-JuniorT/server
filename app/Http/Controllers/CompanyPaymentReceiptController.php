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
            'contract_period_start' => 'required|date',
            'contract_period_end' => 'required|date|after:contract_period_start',
            'receipt_image_url' => 'required|url',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $receipt = CompanyPaymentReceipt::create([
                'company_id' => $companyId,
                'contract_period_start' => $request->contract_period_start,
                'contract_period_end' => $request->contract_period_end,
                'receipt_image_url' => $request->receipt_image_url,
                'amount' => $request->amount,
                'status' => 'pending',
            ]);

            // Broadcast notification to admins
            try {
                broadcast(new GlobalAdminNotification("New payment receipt submitted for company ID: {$companyId}", 'payment_receipt', [
                    'company_id' => $companyId,
                    'amount' => $request->amount,
                ]))->toOthers();
            } catch (\Exception $e) {
                \Log::warning('Failed to broadcast payment receipt notification: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'data' => $receipt,
                'message' => 'Payment receipt submitted successfully'
            ], 201);
        } catch (\Exception $e) {
            Log::error('Failed to submit payment receipt', [
                'company_id' => $companyId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit payment receipt'
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
