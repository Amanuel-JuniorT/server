import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CreditCard, History, Wallet, Eye } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/admin/drivers',
    },
    {
        title: 'Wallet',
        href: '#',
    },
];

interface Transaction {
    id: number;
    amount: number;
    type: string;
    status: string;
    date: string;
    time: string;
    description: string;
    transactionId: string;
    receipt_path: string | null;
}

interface WalletData {
    balance: number;
    totalEarned: number;
    lastWithdrawal: string;
    transactions: Transaction[];
}

interface DriverPaymentsProps {
    user_id: number;
    data: WalletData;
}

const getTransactionColor = (amount: number, type: string) => {
    if (type === 'withdraw') return 'text-red-600 dark:text-red-400';
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    return 'text-foreground';
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'approved':
        case 'completed':
            return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Approved</Badge>;
        case 'pending':
            return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
        case 'rejected':
            return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Rejected</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

export default function DriverPayments({ user_id, data }: DriverPaymentsProps) {
    const { balance, totalEarned, lastWithdrawal, transactions } = data;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Wallet" />

            <UserLayout role="driver" userId={user_id}>
                <div className="space-y-6">
                    <HeadingSmall title="Driver Wallet" description="View real-time balance, earnings, and withdrawal history" />

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{balance.toLocaleString()} ETB</div>
                                <p className="text-xs text-muted-foreground">Current spendable/withdrawable amount</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Ride Earnings</CardTitle>
                                <History className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalEarned.toLocaleString()} ETB</div>
                                <p className="text-xs text-muted-foreground">Cumulative ride values completed</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Last Withdrawal</CardTitle>
                                <CreditCard className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-sm leading-8">{lastWithdrawal}</div>
                                <p className="text-xs text-muted-foreground">Date of last approved withdrawal payout</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground text-sm">No transaction records found for this driver.</div>
                            ) : (
                                <div className="space-y-4">
                                    {transactions.map((t) => (
                                        <div key={t.id} className="rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="rounded-lg bg-muted p-2">
                                                        <Wallet className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{t.description}</p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {t.date} at {t.time}
                                                        </p>
                                                        <p className="text-muted-foreground text-xs">ID: {t.transactionId}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end space-y-1">
                                                    <p className={`text-lg font-bold ${getTransactionColor(t.amount, t.type)}`}>
                                                        {t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()} ETB
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {t.receipt_path && (
                                                            <a 
                                                                href={t.receipt_path} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                                Receipt
                                                            </a>
                                                        )}
                                                        {getStatusBadge(t.status)}
                                                    </div>
                                                    <p className="text-muted-foreground text-xs capitalize">{t.type}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </UserLayout>
        </AppLayout>
    );
}
