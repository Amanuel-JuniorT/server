<?php

namespace App\Services;

use App\Models\Wallet;
use App\Models\Transaction;
use Illuminate\Support\Facades\Log;

class TransactionVerificationService
{
    /**
     * Verify the integrity of a specific transaction.
     */
    public function verifyTransaction(Transaction $transaction): bool
    {
        return $transaction->verifySignature();
    }

    /**
     * Audit a specific wallet to ensure the balance matches the transaction history.
     */
    public function auditWallet(Wallet $wallet): array
    {
        $transactions = $wallet->transactions;
        $calculatedBalance = 0;
        $invalidSignatures = [];

        foreach ($transactions as $transaction) {
            if (!$transaction->verifySignature()) {
                $invalidSignatures[] = $transaction->id;
            }
            
            if ($transaction->status === 'approved') {
                $calculatedBalance += (float) $transaction->amount;
            }
        }

        $isBalanceCorrect = round((float) $wallet->balance, 2) === round($calculatedBalance, 2);
        $isIntegrityIntact = empty($invalidSignatures);

        return [
            'wallet_id' => $wallet->id,
            'actual_balance' => (float) $wallet->balance,
            'calculated_balance' => $calculatedBalance,
            'is_balance_correct' => $isBalanceCorrect,
            'is_integrity_intact' => $isIntegrityIntact,
            'invalid_transaction_ids' => $invalidSignatures,
        ];
    }

    /**
     * Run a system-wide audit of all wallets.
     */
    public function auditAllWallets(): array
    {
        $wallets = Wallet::all();
        $report = [
            'total_audited' => $wallets->count(),
            'failed_wallets' => [],
        ];

        foreach ($wallets as $wallet) {
            $audit = $this->auditWallet($wallet);
            if (!$audit['is_balance_correct'] || !$audit['is_integrity_intact']) {
                $report['failed_wallets'][] = $audit;
                
                Log::critical("Wallet Audit Failed!", $audit);
            }
        }

        return $report;
    }
}
