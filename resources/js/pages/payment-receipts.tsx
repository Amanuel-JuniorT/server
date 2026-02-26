import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Check, ExternalLink, FileText, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PaymentReceipt {
    id: number;
    company_id: number;
    contract_period_start: string;
    contract_period_end: string;
    receipt_image_url: string;
    amount: number;
    status: 'pending' | 'verified' | 'rejected';
    submitted_at: string;
    verified_at?: string;
    rejection_reason?: string;
    company?: { id: number; name: string };
    verified_by_user?: { id: number; name: string };
}

interface PendingTopup {
    id: number;
    amount: number;
    status: 'pending' | 'approved' | 'rejected';
    note?: string;
    created_at: string;
    receipt_path: string | null;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Payment Receipts', href: '/payment-receipts' },
];

export default function PaymentReceiptsPage() {
    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [topups, setTopups] = useState<PendingTopup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'company' | 'wallet'>('company');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
    const [selectedTopup, setSelectedTopup] = useState<PendingTopup | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { pendingActions } = usePage<SharedData>().props;

    // Get csrf token
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    useEffect(() => {
        if (activeTab === 'company') {
            fetchPendingReceipts();
        } else {
            fetchPendingTopups();
        }
    }, [activeTab, statusFilter]);

    const fetchPendingReceipts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/admin/payment-receipts/pending');
            const data = await res.json();
            if (data.success) {
                setReceipts(data.data);
            }
        } catch (error) {
            toast.error('Failed to load payment receipts');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingTopups = async () => {
        setIsLoading(true);
        try {
            let url = '/admin/wallet/topups';
            if (statusFilter !== 'all') {
                url += `?status=${statusFilter}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setTopups(data.data);
            }
        } catch (error) {
            toast.error('Failed to load topups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async (receiptId: number) => {
        if (!confirm('Are you sure you want to verify this payment receipt?')) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/admin/payment-receipts/${receiptId}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Receipt verified successfully');
                fetchPendingReceipts();
                router.reload({ only: ['pendingActions'] });
            } else {
                toast.error(data.message || 'Failed to verify receipt');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (activeTab === 'company') {
            if (!selectedReceipt || !rejectionReason.trim()) {
                toast.error('Please provide a rejection reason');
                return;
            }

            setIsProcessing(true);
            try {
                const res = await fetch(`/admin/payment-receipts/${selectedReceipt.id}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ rejection_reason: rejectionReason }),
                });

                const data = await res.json();

                if (data.success) {
                    toast.success('Receipt rejected');
                    setIsRejectDialogOpen(false);
                    setSelectedReceipt(null);
                    setRejectionReason('');
                    fetchPendingReceipts();
                    router.reload({ only: ['pendingActions'] });
                } else {
                    toast.error(data.message || 'Failed to reject receipt');
                }
            } catch (error) {
                toast.error('An error occurred');
            } finally {
                setIsProcessing(false);
            }
        } else {
            // Reject Topup
            if (!selectedTopup || !rejectionReason.trim()) {
                toast.error('Please provide a rejection reason');
                return;
            }

            setIsProcessing(true);
            try {
                const res = await fetch(`/admin/wallet/topups/${selectedTopup.id}/reject`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({ reason: rejectionReason }),
                });

                const data = await res.json();

                if (data.success) {
                    toast.success('Top-up rejected');
                    setIsRejectDialogOpen(false);
                    setSelectedTopup(null);
                    setRejectionReason('');
                    fetchPendingTopups();
                    router.reload({ only: ['pendingActions'] });
                } else {
                    toast.error(data.message || 'Failed to reject top-up');
                }
            } catch (error) {
                toast.error('An error occurred');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    // New handler for Topup Verification
    const handleVerifyTopup = async (id: number) => {
        if (!confirm('Are you sure you want to verify this top-up? Wallet balance will be updated instantly.')) return;

        setIsProcessing(true);
        try {
            const res = await fetch(`/admin/wallet/topups/${id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Top-up verified successfully');
                fetchPendingTopups();
                router.reload({ only: ['pendingActions'] });
            } else {
                toast.error(data.message || 'Failed to verify top-up');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB',
        }).format(amount);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Receipts" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
                    <p className="text-muted-foreground">Review and verify company payment receipts</p>
                </div>

                <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex gap-4 border-b">
                        <button
                            className={`relative px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'company' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-primary'}`}
                            onClick={() => setActiveTab('company')}
                        >
                            Company Payment Receipts
                            {(pendingActions?.company_payments ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                </span>
                            )}
                        </button>
                        <button
                            className={`relative px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'wallet' ? 'border-primary text-primary border-b-2' : 'text-muted-foreground hover:text-primary'}`}
                            onClick={() => setActiveTab('wallet')}
                        >
                            User Wallet Top-ups
                            {(pendingActions?.wallet_topups ?? 0) > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                                </span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'wallet' && (
                        <div className="flex items-center gap-2">
                            <Label htmlFor="status-filter" className="text-sm">
                                Status:
                            </Label>
                            <select
                                id="status-filter"
                                className="border-input bg-background focus-visible:ring-ring h-9 w-[150px] rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{activeTab === 'company' ? 'Pending Company Payments' : 'Wallet Top-ups'}</CardTitle>
                        <CardDescription>
                            {activeTab === 'company' ? 'Payment receipts awaiting admin verification' : 'User wallet top-up history and requests'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : activeTab === 'company' ? (
                            // Existing Company Receipts Table
                            receipts.length === 0 ? (
                                <div className="text-muted-foreground py-8 text-center">No pending payment receipts</div>
                            ) : (
                                <div className="relative max-h-[65vh] overflow-y-auto rounded-md border">
                                    <table className="w-full caption-bottom border-collapse text-sm">
                                        <TableHeader className="bg-card sticky top-0 z-10">
                                            <TableRow>
                                                <TableHead>Company</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Submitted</TableHead>
                                                <TableHead>Receipt</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {receipts.map((receipt) => (
                                                <TableRow key={receipt.id}>
                                                    <TableCell className="font-medium">{receipt.company?.name || 'Unknown'}</TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            <div>{formatDate(receipt.contract_period_start)}</div>
                                                            <div className="text-muted-foreground">to {formatDate(receipt.contract_period_end)}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-semibold">{formatCurrency(receipt.amount)}</TableCell>
                                                    <TableCell>{formatDate(receipt.submitted_at)}</TableCell>
                                                    <TableCell>
                                                        <a
                                                            href={receipt.receipt_image_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            View Receipt
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handleVerify(receipt.id)}
                                                                disabled={isProcessing}
                                                            >
                                                                <Check className="mr-1 h-4 w-4" />
                                                                Verify
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setSelectedReceipt(receipt);
                                                                    setIsRejectDialogOpen(true);
                                                                }}
                                                                disabled={isProcessing}
                                                            >
                                                                <X className="mr-1 h-4 w-4" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </table>
                                </div>
                            )
                        ) : // New User Top-ups Table
                        topups.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center">No wallet top-ups found</div>
                        ) : (
                            <div className="relative max-h-[65vh] overflow-y-auto rounded-md border">
                                <table className="w-full caption-bottom border-collapse text-sm">
                                    <TableHeader className="bg-card sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Submitted</TableHead>
                                            <TableHead>Receipt</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topups.map((topup) => (
                                            <TableRow key={topup.id}>
                                                <TableCell>
                                                    <div className="font-medium">{topup.user.name}</div>
                                                    <div className="text-muted-foreground text-xs">{topup.user.phone}</div>
                                                </TableCell>
                                                <TableCell className="font-semibold">{formatCurrency(topup.amount)}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                            topup.status === 'approved'
                                                                ? 'bg-green-100 text-green-800'
                                                                : topup.status === 'rejected'
                                                                  ? 'bg-red-100 text-red-800'
                                                                  : 'bg-yellow-100 text-yellow-800'
                                                        }`}
                                                    >
                                                        {topup.status.charAt(0).toUpperCase() + topup.status.slice(1)}
                                                    </span>
                                                    {topup.status === 'rejected' && topup.note && (
                                                        <div className="mt-1 max-w-[200px] truncate text-xs text-red-600" title={topup.note}>
                                                            {topup.note}
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell>{formatDate(topup.created_at)}</TableCell>
                                                <TableCell>
                                                    {topup.receipt_path ? (
                                                        <a
                                                            href={topup.receipt_path}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                            View
                                                            <ExternalLink className="h-3 w-3" />
                                                        </a>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">No Receipt</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {topup.status === 'pending' && (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => handleVerifyTopup(topup.id)}
                                                                disabled={isProcessing}
                                                            >
                                                                <Check className="mr-1 h-4 w-4" />
                                                                Verify
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    setSelectedTopup(topup);
                                                                    setIsRejectDialogOpen(true);
                                                                }}
                                                                disabled={isProcessing}
                                                            >
                                                                <X className="mr-1 h-4 w-4" />
                                                                Reject
                                                            </Button>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Payment Receipt</DialogTitle>
                        <DialogDescription>Please provide a reason for rejecting this payment receipt.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="rejection_reason">Rejection Reason</Label>
                            <Textarea
                                id="rejection_reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Explain why this receipt is being rejected..."
                                rows={4}
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setIsRejectDialogOpen(false);
                                setSelectedReceipt(null);
                                setSelectedTopup(null);
                                setRejectionReason('');
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleReject} disabled={isProcessing || !rejectionReason.trim()}>
                            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Receipt
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
