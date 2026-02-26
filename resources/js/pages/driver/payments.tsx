import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { CreditCard, Download, History, Plus, Wallet } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Payments',
        href: '/driver/payments',
    },
];

// Mock data - replace with actual data from your backend
const mockPayments = [
    {
        id: 1,
        amount: 150,
        method: 'credit_card',
        status: 'completed',
        date: '2024-01-15',
        time: '14:30',
        description: 'Ride from Bole to Kazanchis',
        transactionId: 'TXN-001234',
    },
    {
        id: 2,
        amount: 120,
        method: 'wallet',
        status: 'completed',
        date: '2024-01-10',
        time: '09:15',
        description: 'Ride from Kazanchis to Bole',
        transactionId: 'TXN-001235',
    },
    {
        id: 3,
        amount: 200,
        method: 'cash',
        status: 'pending',
        date: '2024-01-08',
        time: '16:45',
        description: 'Ride from Meskel Square to Piassa',
        transactionId: 'TXN-001236',
    },
];

const mockWallet = {
    balance: 450,
    currency: 'ETB',
    lastRecharge: '2024-01-10',
    totalSpent: 3240,
};

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
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />

            <UserLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Payments & Wallet" description="Manage your payment methods and view transaction history" />

                    {/* Wallet Overview */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <Wallet className="h-5 w-5 text-blue-600" />
                                    <div>
                                        <p className="text-2xl font-bold">{mockWallet.balance} ETB</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <History className="h-5 w-5 text-green-600" />
                                    <div>
                                        <p className="text-2xl font-bold">{mockWallet.totalSpent} ETB</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center space-x-2">
                                    <CreditCard className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <p className="text-muted-foreground text-sm font-medium">Last Recharge</p>
                                        <p className="text-sm font-bold">{mockWallet.lastRecharge}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button className="flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Add Money to Wallet</span>
                            </Button>
                            <Button variant="outline" className="flex items-center space-x-2">
                                <CreditCard className="h-4 w-4" />
                                <span>Add Payment Method</span>
                            </Button>
                            <Button variant="outline" className="flex items-center space-x-2">
                                <Download className="h-4 w-4" />
                                <span>Download Statement</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Payment Methods */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payment Methods</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center space-x-3">
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                        <div>
                                            <p className="font-medium">Visa ending in 1234</p>
                                            <p className="text-muted-foreground text-sm">Expires 12/25</p>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">Default</Badge>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border p-3">
                                    <div className="flex items-center space-x-3">
                                        <Wallet className="h-6 w-6 text-green-600" />
                                        <div>
                                            <p className="font-medium">Wallet Balance</p>
                                            <p className="text-muted-foreground text-sm">{mockWallet.balance} ETB available</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">Active</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transaction History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Transaction History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockPayments.map((payment) => (
                                    <div key={payment.id} className="rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">{getMethodIcon(payment.method)}</div>
                                                <div>
                                                    <p className="font-medium">{payment.description}</p>
                                                    <p className="text-muted-foreground text-sm">
                                                        {payment.date} at {payment.time}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">ID: {payment.transactionId}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold">{Math.abs(payment.amount)} ETB</p>
                                                <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                                                <p className="text-muted-foreground mt-1 text-xs">{getMethodText(payment.method)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </UserLayout>
        </AppLayout>
    );
}
