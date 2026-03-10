<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\VehicleType;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Hash;
use App\Events\GlobalAdminNotification;

class WalletController extends Controller
{
    public function index()
    {
        try {
            $wallet = Wallet::firstOrCreate(['user_id' => Auth::id()], ['balance' => 0]);
            return response()->json(['balance' => $wallet->balance]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Something went wrong', 'error' => $e->getMessage()], 500);
        }
    }

    public function transactions()
    {
        $user = request()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);
        $transactions = $wallet->transactions()->latest()->get();
        return response()->json($transactions);
    }

    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'password' => 'required|string',
            'method' => 'required|in:telebirr,bank',
            'bank_name' => 'required_if:method,bank',
            'account_number' => 'required_if:method,bank'
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid password'], 403);
        }

        $wallet = Wallet::firstOrCreate(['user_id' => $user->id], ['balance' => 0]);

        if ($wallet->balance < $request->amount) {
            return response()->json(['message' => 'Insufficient balance'], 400);
        }

        DB::beginTransaction();
        try {
            // Get withdrawal fee from system pricing (Economy)
            $systemPricing = VehicleType::where('name', 'economy')->first();
            $fixedFee = $systemPricing ? $systemPricing->wallet_transaction_fixed_fee : 0;
            $percentageFee = $systemPricing ? ($systemPricing->wallet_transaction_percentage / 100) * $request->amount : 0;
            $totalFee = $fixedFee + $percentageFee;

            if ($wallet->balance < ($request->amount + $totalFee)) {
                DB::rollBack();
                return response()->json(['message' => 'Insufficient balance to cover withdrawal amount and fees'], 400);
            }

            $wallet->balance -= ($request->amount + $totalFee);
            $wallet->save();

            $note = 'Withdrawal request via ' . ucfirst($request->input('method'));
            if ($request->input('method') === 'bank') {
                $note .= ' (' . $request->input('bank_name') . ' - ' . $request->input('account_number') . ')';
            } else {
                $note .= ' (Phone: ' . $user->phone . ')';
            }

            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'withdraw',
                'amount' => -$request->amount,
                'note' => $note,
                'status' => 'pending',
            ]);

            if ($totalFee > 0) {
                Transaction::create([
                    'wallet_id' => $wallet->id,
                    'type' => 'payment',
                    'amount' => -$totalFee,
                    'note' => 'Withdrawal fee',
                    'status' => 'approved',
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Withdrawal initiated, pending approval']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Something went wrong'], 500);
        }
    }

    public function topup(Request $request)
    {
        try {
            $request->validate([
                'amount' => 'required|numeric|min:1',
                'receipt' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
            ]);

            $wallet = Wallet::firstOrCreate(['user_id' => Auth::id()]);

            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('receipts');
            }

            DB::beginTransaction();

            // Note: We do NOT add to balance yet. Admin must approve.
            // $wallet->balance += $request->amount;
            // $wallet->save();

            Transaction::create([
                'wallet_id' => $wallet->id,
                'type' => 'topup',
                'amount' => $request->amount,
                'note' => 'Top-up request (Pending Verification)',
                'status' => 'pending',
                'receipt_path' => $receiptPath
            ]);

            DB::commit();

            // Broadcast notification to admins
            try {
                $user = Auth::user();
                broadcast(new GlobalAdminNotification("New wallet top-up request of {$request->amount} ETB from {$user->name}", 'wallet_topup', [
                    'user_id' => $user->id,
                    'amount' => $request->amount,
                ]))->toOthers();
            } catch (\Exception $e) {
                \Log::warning('Failed to broadcast wallet top-up notification: ' . $e->getMessage());
            }
            return response()->json(['message' => 'Top-up request submitted for approval']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Topup error: ' . $e->getMessage());
            return response()->json(['message' => 'Something went wrong: ' . $e->getMessage()], 500);
        }
    }

    public function transfer(Request $request)
    {
        $request->validate([
            'receiver_phone' => 'required|exists:users,phone',
            'amount' => 'required|numeric|min:1',
            'password' => 'required|string'
        ]);

        $senderUser = $request->user();
        if (!$senderUser) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if (!\Illuminate\Support\Facades\Hash::check($request->password, $senderUser->password)) {
            return response()->json(['message' => 'Invalid password'], 403);
        }

        $receiverUser = User::where('phone', $request->receiver_phone)->first();

        if ($senderUser->id === $receiverUser->id) {
            return response()->json(['message' => 'Cannot transfer to yourself'], 400);
        }

        if ($receiverUser->role === 'driver' && (!$receiverUser->driver || $receiverUser->driver->approval_state === 'pending')) {
            return response()->json(['message' => 'User is not approved'], 400);
        }

        $senderWallet = Wallet::firstOrCreate(['user_id' => $senderUser->id], ['balance' => 0]);
        $receiverWallet = Wallet::firstOrCreate(['user_id' => $receiverUser->id], ['balance' => 0]);

        // Calculate transfer fee
        $systemPricing = VehicleType::where('name', 'economy')->first();
        $fixedFee = $systemPricing ? $systemPricing->wallet_transaction_fixed_fee : 0;
        $totalToDeduct = $request->amount + $fixedFee;

        if ($senderWallet->balance < $totalToDeduct) {
            return response()->json(['message' => 'Insufficient balance (including transfer fee)'], 400);
        }

        DB::beginTransaction();
        try {
            $senderWallet->balance -= $totalToDeduct;
            $receiverWallet->balance += $request->amount;

            $senderWallet->save();
            $receiverWallet->save();

            // Platform wallet gets the fee
            $platformWallet = Wallet::firstOrCreate(['user_id' => 1]);
            $platformWallet->balance += $fixedFee;
            $platformWallet->save();

            Transaction::create([
                'wallet_id' => $senderWallet->id,
                'type' => 'transfer',
                'amount' => -$request->amount,
                'note' => 'Transfer to ' . $receiverUser->phone,
                'status' => 'approved',
            ]);

            if ($fixedFee > 0) {
                Transaction::create([
                    'wallet_id' => $senderWallet->id,
                    'type' => 'payment',
                    'amount' => -$fixedFee,
                    'note' => 'Transfer fee',
                    'status' => 'approved',
                ]);
            }

            Transaction::create([
                'wallet_id' => $receiverWallet->id,
                'type' => 'transfer',
                'amount' => $request->amount,
                'note' => 'Transfer from ' . $senderUser->phone,
                'status' => 'approved',
            ]);

            DB::commit();
            return response()->json(['message' => 'Transfer successful']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Transfer error: ' . $e->getMessage());
            return response()->json(['message' => 'Transfer failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function getReceiver($phone, Request $request)
    {
        try {

            $auth = $request->user('sanctum');

            if (!$auth) {
                return response()->json([
                    "message" => "Unauthorized"
                ], 403);
            }
            $user = User::where("phone", $phone)->first();

            if (!$user) {
                return response()->json([
                    "message" => "No user data"
                ], 404);
            }
            if ($auth->id === $user->id) {
                return response()->json([
                    "message" => "Cannot transfer to yourself"
                ], 400);
            }
            if ($user->role === 'driver' && (!$user->driver || $user->driver->approval_state === 'pending')) {
                return response()->json([
                    "message" => "User is not approved"
                ], 400);
            }

            return response()->json([
                "name" => $user->name,
                "phone" => $user->phone
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "message" => "Error at getting receiver: " . $e->getMessage()
            ], 500);
        }
    }
}
