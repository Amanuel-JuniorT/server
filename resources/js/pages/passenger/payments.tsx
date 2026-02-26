import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CreditCard, History, Wallet } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

const getMethodIcon = (method: string) => {
    switch (method) {
        case 'credit_card':
            return <CreditCard className="h-5 w-5" />;
        case 'wallet':
            return <Wallet className="h-5 w-5" />;
        case 'cash':
            return <Wallet className="h-5 w-5" />;
        default:
            return <CreditCard className="h-5 w-5" />;
    }
};

const getMethodText = (method: string) => {
    return method.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
};

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
};

export default function UserPayments() {
    const { data, user_id } = usePage<{
        data: {
            balance: number;
            totalSpent: number;
            lastRecharge: string;
            transactions: Array<{
                id: number;
                amount: number;
                method: string;
                status: string;
                date: string;
                time: string;
                description: string;
                transactionId: string;
            }>;
        };
        user_id: number;
    }>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Payments',
            href: `/passenger/payments/${user_id}`,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />

            <UserLayout role="passenger" userId={user_id}>
                <div className="space-y-6">
                    <HeadingSmall title="Payments & Wallet" description="Manage your payment methods and view transaction history" />

                    {/* Wallet Overview */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="bg-primary/10 shrink-0 rounded-full p-3">
                                        <Wallet className="text-primary h-6 w-6" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-muted-foreground text-sm font-medium">Wallet Balance</p>
                                        <p className="text-xl font-bold break-words">{formatCurrency(data.balance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="shrink-0 rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                        <History className="h-6 w-6 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-muted-foreground text-sm font-medium">Total Spent</p>
                                        <p className="text-xl font-bold break-words">{formatCurrency(data.totalSpent)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-4">
                                    <div className="shrink-0 rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                                        <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-muted-foreground text-sm font-medium">Last Recharge</p>
                                        <p className="text-lg font-bold break-words">{data.lastRecharge}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {data.transactions.length > 0 ? (
                                    <div className="divide-border divide-y rounded-md border">
                                        {data.transactions.map((payment) => (
                                            <div
                                                key={payment.id}
                                                className="hover:bg-muted/50 flex items-center justify-between p-4 transition-colors"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="bg-muted rounded-full p-2">{getMethodIcon(payment.method)}</div>
                                                    <div>
                                                        <p className="font-medium">{payment.description}</p>
                                                        <div className="text-muted-foreground flex items-center space-x-2 text-xs">
                                                            <span>
                                                                {payment.date} at {payment.time}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{payment.transactionId}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${payment.amount > 0 ? 'text-green-600' : ''}`}>
                                                        {payment.amount > 0 ? '+' : ''}
                                                        {formatCurrency(payment.amount)}
                                                    </p>
                                                    <div className="mt-1 flex items-center justify-end gap-2">
                                                        <Badge variant="outline" className="text-xs font-normal">
                                                            {getMethodText(payment.method)}
                                                        </Badge>
                                                        <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="bg-muted mb-4 rounded-full p-4">
                                            <History className="text-muted-foreground h-8 w-8" />
                                        </div>
                                        <h3 className="text-lg font-semibold">No transactions yet</h3>
                                        <p className="text-muted-foreground mt-1 max-w-sm">
                                            Your transaction history will appear here once you make payments or top up your wallet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </UserLayout>
        </AppLayout>
    );
}
