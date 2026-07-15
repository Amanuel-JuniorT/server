<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\Wallet;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AdminWalletController extends Controller
{
  public function getTopups(Request $request)
  {
    try {
      $status = $request->query('status'); // Optional status filter from query param

      $query = Transaction::where('type', 'topup')
        ->with(['wallet.user:id,name,email,phone']);

      if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
        $query->where('status', $status);
      }

      $topups = $query->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($transaction) {
          return [
            'id' => $transaction->id,
            'amount' => $transaction->amount,
            'status' => $transaction->status,
            'note' => $transaction->note,
            'created_at' => $transaction->created_at,
            'receipt_path' => $transaction->receipt_path ? \Storage::url($transaction->receipt_path) : null,
            'user' => $transaction->wallet->user,
          ];
        });

      return response()->json([
        'success' => true,
        'data' => $topups
      ]);
    } catch (\Exception $e) {
      Log::error('Error fetching topups: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch topups'
      ], 500);
    }
  }

  public function verifyTopup($id)
  {
    try {
      $transaction = Transaction::findOrFail($id);

      if ($transaction->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Transaction is not pending'
        ], 400);
      }

      DB::beginTransaction();

      // Update transaction status
      $transaction->status = 'approved';
      $transaction->save();

      // Credit the wallet
      $wallet = $transaction->wallet;
      $wallet->balance += $transaction->amount;
      $wallet->save();

      AuditService::high('Wallet Top-up Approved', $transaction, "Approved top-up of {$transaction->amount} ETB for {$transaction->wallet->user->name}");

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Top-up verified and wallet credited'
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Error verifying topup: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to verify topup'
      ], 500);
    }
  }

  public function rejectTopup(Request $request, $id)
  {
    try {
      $transaction = Transaction::findOrFail($id);

      if ($transaction->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Transaction is not pending'
        ], 400);
      }

      // Update transaction status
      $transaction->status = 'rejected';
      $transaction->note = $transaction->note . ' - Rejected: ' . $request->input('reason', 'No reason provided');
      $transaction->save();

      AuditService::high('Wallet Top-up Rejected', $transaction, "Rejected top-up of {$transaction->amount} ETB for {$transaction->wallet->user->name}. Reason: " . ($request->reason ?? 'No reason provided'));

      return response()->json([
        'success' => true,
        'message' => 'Top-up rejected'
      ]);
    } catch (\Exception $e) {
      Log::error('Error rejecting topup: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to reject topup'
      ], 500);
    }
  }
  public function getWithdrawals(Request $request)
  {
    try {
      $status = $request->query('status'); // Optional status filter from query param

      $query = Transaction::where('type', 'withdraw')
        ->with(['wallet.user:id,name,email,phone']);

      if ($status && in_array($status, ['pending', 'approved', 'rejected'])) {
        $query->where('status', $status);
      }

      $withdrawals = $query->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($transaction) {
          return [
            'id' => $transaction->id,
            'amount' => $transaction->amount,
            'status' => $transaction->status,
            'note' => $transaction->note,
            'created_at' => $transaction->created_at,
            'receipt_path' => $transaction->receipt_path ? \Storage::url($transaction->receipt_path) : null,
            'user' => $transaction->wallet->user,
          ];
        });

      return response()->json([
        'success' => true,
        'data' => $withdrawals
      ]);
    } catch (\Exception $e) {
      Log::error('Error fetching withdrawals: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to fetch withdrawals'
      ], 500);
    }
  }

  public function verifyWithdrawal(Request $request, $id)
  {
    try {
      $transaction = Transaction::findOrFail($id);

      if ($transaction->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Transaction is not pending'
        ], 400);
      }

      $request->validate([
        'receipt' => 'required|file|image|max:4096',
      ]);

      DB::beginTransaction();

      if ($request->hasFile('receipt')) {
        $path = $request->file('receipt')->store('receipts/withdrawals', 'public');
        $transaction->receipt_path = $path;
      }

      // Update transaction status
      $transaction->status = 'approved';
      $transaction->save();

      // Note: We don't deduct balance here because it was already deducted when requested in WalletController::withdraw.

      AuditService::high('Wallet Withdrawal Approved', $transaction, "Approved withdrawal of " . abs($transaction->amount) . " ETB for {$transaction->wallet->user->name}");

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Withdrawal verified and approved'
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Error verifying withdrawal: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to verify withdrawal: ' . $e->getMessage()
      ], 500);
    }
  }

  public function rejectWithdrawal(Request $request, $id)
  {
    try {
      $transaction = Transaction::findOrFail($id);

      if ($transaction->status !== 'pending') {
        return response()->json([
          'success' => false,
          'message' => 'Transaction is not pending'
        ], 400);
      }

      DB::beginTransaction();

      // Update transaction status
      $transaction->status = 'rejected';
      $transaction->note = $transaction->note . ' - Rejected: ' . $request->input('reason', 'No reason provided');
      $transaction->save();

      // Refund the withdrawal amount back to user's wallet
      // The original amount is stored as a negative value (e.g. -100)
      $refundAmount = abs($transaction->amount);
      
      $wallet = $transaction->wallet;
      $wallet->balance += $refundAmount;
      $wallet->save();
      
      // We should also refund the withdrawal fee if it was created right after the withdrawal request
      // Let's find a payment transaction created around the same time
      $feeTransaction = Transaction::where('wallet_id', $wallet->id)
        ->where('type', 'payment')
        ->where('note', 'Withdrawal fee')
        ->where('created_at', '>=', $transaction->created_at->subSeconds(5))
        ->where('created_at', '<=', $transaction->created_at->addSeconds(5))
        ->first();
        
      if ($feeTransaction) {
          $feeRefund = abs($feeTransaction->amount);
          $wallet->balance += $feeRefund;
          $wallet->save();
          
          // Mark fee as reversed/rejected
          $feeTransaction->status = 'rejected';
          $feeTransaction->note = $feeTransaction->note . ' (Refunded due to rejection)';
          $feeTransaction->save();
      }

      AuditService::high('Wallet Withdrawal Rejected', $transaction, "Rejected withdrawal of " . abs($transaction->amount) . " ETB for {$transaction->wallet->user->name}. Reason: " . ($request->reason ?? 'No reason provided'));

      DB::commit();

      return response()->json([
        'success' => true,
        'message' => 'Withdrawal rejected and funds returned to wallet'
      ]);
    } catch (\Exception $e) {
      DB::rollBack();
      Log::error('Error rejecting withdrawal: ' . $e->getMessage());
      return response()->json([
        'success' => false,
        'message' => 'Failed to reject withdrawal'
      ], 500);
    }
  }
}
