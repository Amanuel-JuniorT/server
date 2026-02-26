import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ExternalLink, FileText, Loader2, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PaymentReceipt {
    id: number;
    contract_period_start: string;
    contract_period_end: string;
    receipt_image_url: string;
    amount: number;
    status: 'pending' | 'verified' | 'rejected';
    submitted_at: string;
    verified_at?: string;
    rejection_reason?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/company-admin/dashboard' },
    { title: 'Payment Receipts', href: '/company-admin/payment-receipts' },
];

export default function CompanyAdminPaymentReceiptsPage({ companyId }: { companyId: number }) {
    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        contract_period_start: '',
        contract_period_end: '',
        receipt_image_url: '',
        amount: '',
    });

    useEffect(() => {
        fetchReceipts();
    }, [companyId]);

    const fetchReceipts = async () => {
        try {
            const res = await fetch(`/company-admin/api/payment-receipts`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setReceipts(data.data);
            } else {
                toast.error(data.message || 'Failed to load payment receipts');
            }
        } catch (error) {
            console.error('Error fetching payment receipts:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load payment receipts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/company-admin/api/payment-receipts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                if (res.status === 419) {
                    toast.error('Session expired. Please refresh the page.');
                    return;
                }
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                toast.success('Payment receipt submitted successfully');
                setIsSubmitOpen(false);
                fetchReceipts();
                resetForm();
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Failed to submit receipt';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error submitting payment receipt:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred while submitting the receipt');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            contract_period_start: '',
            contract_period_end: '',
            receipt_image_url: '',
            amount: '',
        });
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

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-50 text-yellow-700',
            verified: 'bg-green-50 text-green-700',
            rejected: 'bg-red-50 text-red-700',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-50 text-gray-700';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Payment Receipts" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
                        <p className="text-muted-foreground">Submit and track your company payment receipts</p>
                    </div>
                    <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                        <Button onClick={() => setIsSubmitOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Submit Receipt
                        </Button>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Submit Payment Receipt</DialogTitle>
                                <DialogDescription>Upload your payment receipt for admin verification</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_period_start">Contract Period Start</Label>
                                        <Input
                                            id="contract_period_start"
                                            type="date"
                                            value={formData.contract_period_start}
                                            onChange={(e) => setFormData({ ...formData, contract_period_start: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_period_end">Contract Period End</Label>
                                        <Input
                                            id="contract_period_end"
                                            type="date"
                                            value={formData.contract_period_end}
                                            onChange={(e) => setFormData({ ...formData, contract_period_end: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="receipt_image_url">Receipt Image URL</Label>
                                        <Input
                                            id="receipt_image_url"
                                            type="url"
                                            value={formData.receipt_image_url}
                                            onChange={(e) => setFormData({ ...formData, receipt_image_url: e.target.value })}
                                            placeholder="https://example.com/receipt.jpg"
                                            required
                                        />
                                        <p className="text-muted-foreground text-sm">
                                            Upload your receipt to a file hosting service and paste the URL here
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="amount">Amount (ETB)</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit Receipt
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Receipts</CardTitle>
                        <CardDescription>View all submitted payment receipts and their verification status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center">No payment receipts yet. Submit one to get started.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Period</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Receipt</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {receipts.map((receipt) => (
                                        <TableRow key={receipt.id}>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{formatDate(receipt.contract_period_start)}</div>
                                                    <div className="text-muted-foreground">to {formatDate(receipt.contract_period_end)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(receipt.amount)}</TableCell>
                                            <TableCell>{formatDate(receipt.submitted_at)}</TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${getStatusBadge(
                                                        receipt.status,
                                                    )}`}
                                                >
                                                    {receipt.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <a
                                                    href={receipt.receipt_image_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    View
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </TableCell>
                                            <TableCell>
                                                {receipt.status === 'rejected' && receipt.rejection_reason && (
                                                    <div className="text-sm text-red-600">{receipt.rejection_reason}</div>
                                                )}
                                                {receipt.status === 'verified' && receipt.verified_at && (
                                                    <div className="text-sm text-green-600">Verified on {formatDate(receipt.verified_at)}</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
