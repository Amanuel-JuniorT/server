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
            'receipt_path' => $transaction->receipt_path ? asset($transaction->receipt_path) : null,
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
}
