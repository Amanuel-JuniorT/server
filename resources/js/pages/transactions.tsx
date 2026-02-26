import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { ArrowDownCircle, ArrowUpCircle, CreditCard, RefreshCcw, User } from 'lucide-react';

interface Transaction {
    id: number;
    amount: string | number;
    type: string;
    status: string;
    note?: string | null;
    user_name: string;
    user_phone: string;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Transactions', href: '/transactions' }];

export default function TransactionsPage() {
    const { transactions } = usePage<{ transactions: Transaction[] }>().props;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <Badge className="border-green-200 bg-green-100 text-green-700">Approved</Badge>;
            case 'pending':
                return <Badge className="border-yellow-200 bg-yellow-100 text-yellow-700">Pending</Badge>;
            case 'rejected':
                return <Badge variant="destructive">Rejected</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'topup':
                return <ArrowUpCircle className="h-4 w-4 text-green-500" />;
            case 'payment':
                return <ArrowDownCircle className="h-4 w-4 text-blue-500" />;
            case 'withdraw':
                return <ArrowDownCircle className="h-4 w-4 text-red-500" />;
            case 'transfer':
                return <RefreshCcw className="h-4 w-4 text-indigo-500" />;
            default:
                return <CreditCard className="h-4 w-4 text-gray-500" />;
        }
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'user', header: 'User' },
        { key: 'type', header: 'Type' },
        { key: 'amount', header: 'Amount' },
        { key: 'status', header: 'Status' },
        { key: 'date', header: 'Date' },
        { key: 'note', header: 'Note' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Transactions" />

            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">System Transactions</h1>
                    <p className="text-muted-foreground">Historical audit of all financial movements (top-ups, payments, transfers)</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            All Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table
                                columns={columns}
                                data={transactions}
                                renderRow={(t, index) => (
                                    <tr key={t.id} className="hover:bg-muted/50">
                                        <td className={tableDataClass(index, columns)}>
                                            <span className="font-mono text-xs">#{t.id}</span>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex items-center gap-2">
                                                <User className="text-muted-foreground h-3 w-3" />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{t.user_name}</span>
                                                    <span className="text-muted-foreground text-xs">{t.user_phone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex items-center gap-2 text-sm capitalize">
                                                {getTypeIcon(t.type)}
                                                {t.type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <span className={`font-bold ${t.type === 'topup' ? 'text-green-600' : 'text-slate-900'}`}>
                                                {Number(t.amount) < 0 ? '' : t.type === 'topup' ? '+' : '-'}
                                                {Math.abs(Number(t.amount))} ETB
                                            </span>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>{getStatusBadge(t.status)}</td>
                                        <td className={tableDataClass(index, columns)}>
                                            <span className="text-muted-foreground text-xs">{t.created_at}</span>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <span className="text-muted-foreground block max-w-[200px] truncate text-xs italic">
                                                {t.note || 'No note'}
                                            </span>
                                        </td>
                                    </tr>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
