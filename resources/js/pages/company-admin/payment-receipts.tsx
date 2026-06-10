import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    FilePlus,
    FileText,
    Loader2,
    Receipt,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PaymentReceipt {
    id: number;
    contract_period_start: string | null;
    contract_period_end: string | null;
    receipt_image_url: string;
    amount: number;
    status: 'pending' | 'verified' | 'rejected';
    submitted_at: string;
    verified_at?: string;
    rejection_reason?: string;
}

interface Props {
    companyId: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/company-admin/dashboard' },
    { title: 'Payment Receipts', href: '/company-admin/payment-receipts' },
];

const StatusBadge = ({ status }: { status: PaymentReceipt['status'] }) => {
    const cfg = {
        pending: {
            icon: <Clock className="h-3.5 w-3.5" />,
            label: 'Pending Review',
            cls: 'bg-amber-50 text-amber-700 border-amber-200',
        },
        verified: {
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            label: 'Verified',
            cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        },
        rejected: {
            icon: <XCircle className="h-3.5 w-3.5" />,
            label: 'Rejected',
            cls: 'bg-rose-50 text-rose-700 border-rose-200',
        },
    }[status];

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cfg.cls}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

export default function CompanyAdminPaymentReceiptsPage() {
    const { companyId } = usePage<Props & any>().props;

    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [form, setForm] = useState({
        amount: '',
        contract_period_start: '',
        contract_period_end: '',
    });

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/company-admin/api/payment-receipts');
            if (res.ok) {
                const data = await res.json();
                if (data.success) setReceipts(data.data);
            }
        } catch {
            toast.error('Failed to load receipts');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            toast.error('Please select a valid image file');
        }
    };

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileChange(file);
    }, []);

    const resetDialog = () => {
        setSelectedFile(null);
        setFilePreview(null);
        setForm({ amount: '', contract_period_start: '', contract_period_end: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Please attach a receipt image');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('receipt_file', selectedFile);
            formData.append('amount', form.amount);
            if (form.contract_period_start) formData.append('contract_period_start', form.contract_period_start);
            if (form.contract_period_end) formData.append('contract_period_end', form.contract_period_end);

            const response = await axios.post('/company-admin/api/payment-receipts', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.success) {
                toast.success('Receipt submitted successfully! Our team will verify it within 30–60 minutes.');
                setIsDialogOpen(false);
                resetDialog();
                fetchReceipts();
            } else {
                toast.error(response.data.message || 'Failed to submit receipt');
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'An error occurred during submission');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { minimumFractionDigits: 0 }).format(amount) + ' ETB';

    // Summary counts
    const pending = receipts.filter((r) => r.status === 'pending').length;
    const verified = receipts.filter((r) => r.status === 'verified').length;
    const rejected = receipts.filter((r) => r.status === 'rejected').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Receipts" />

            <div className="flex flex-1 flex-col gap-8 p-6 lg:p-10">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Track all bank transfer receipts submitted for your account.
                        </p>
                    </div>
                    <Button
                        onClick={() => { resetDialog(); setIsDialogOpen(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-100"
                    >
                        <FilePlus className="mr-2 h-4 w-4" />
                        Submit New Receipt
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card className="border-amber-100 bg-amber-50/50">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
                                <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Pending</p>
                                <p className="text-3xl font-black text-amber-700">{pending}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-emerald-100 bg-emerald-50/50">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Verified</p>
                                <p className="text-3xl font-black text-emerald-700">{verified}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-rose-100 bg-rose-50/50">
                        <CardContent className="flex items-center gap-4 p-5">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100">
                                <XCircle className="h-5 w-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Rejected</p>
                                <p className="text-3xl font-black text-rose-700">{rejected}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Receipts Table */}
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Receipt className="h-5 w-5 text-indigo-500" />
                            All Receipts
                        </CardTitle>
                        <CardDescription>
                            A complete history of bank receipts submitted to your account.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : receipts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <FileText className="mb-3 h-14 w-14 opacity-20" />
                                <p className="text-base font-semibold">No receipts yet</p>
                                <p className="mt-1 text-sm">Submit your first bank transfer receipt to get started.</p>
                                <Button
                                    variant="outline"
                                    className="mt-5"
                                    onClick={() => { resetDialog(); setIsDialogOpen(true); }}
                                >
                                    <FilePlus className="mr-2 h-4 w-4" />
                                    Submit Receipt
                                </Button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-b bg-slate-50/30 text-left">
                                            <th className="px-5 py-3 font-semibold text-slate-600">Date Submitted</th>
                                            <th className="px-5 py-3 font-semibold text-slate-600">Amount</th>
                                            <th className="px-5 py-3 font-semibold text-slate-600">Period / Note</th>
                                            <th className="px-5 py-3 font-semibold text-slate-600">Status</th>
                                            <th className="px-5 py-3 text-right font-semibold text-slate-600">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {receipts.map((receipt) => (
                                            <tr key={receipt.id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="px-5 py-4 font-medium text-slate-700">
                                                    {formatDate(receipt.submitted_at)}
                                                </td>
                                                <td className="px-5 py-4 font-black text-slate-900">
                                                    {formatCurrency(receipt.amount)}
                                                </td>
                                                <td className="px-5 py-4 text-slate-500">
                                                    {receipt.contract_period_start ? (
                                                        <span>
                                                            {formatDate(receipt.contract_period_start)}
                                                            {' → '}
                                                            {formatDate(receipt.contract_period_end ?? '')}
                                                        </span>
                                                    ) : (
                                                        <span className="italic">Ride Package Top-up</span>
                                                    )}
                                                    {receipt.status === 'rejected' && receipt.rejection_reason && (
                                                        <div className="mt-1 flex items-start gap-1 text-rose-600">
                                                            <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                                                            <span className="text-xs leading-tight">{receipt.rejection_reason}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={receipt.status} />
                                                    {receipt.verified_at && (
                                                        <p className="text-muted-foreground mt-1 text-[10px]">
                                                            Verified {formatDate(receipt.verified_at)}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <a
                                                        href={receipt.receipt_image_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                                                    >
                                                        <ExternalLink className="h-3.5 w-3.5" />
                                                        View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Submit Receipt Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); setIsDialogOpen(open); }}>
                <DialogContent className="sm:max-w-[500px] border-none shadow-2xl p-0 overflow-hidden">
                    <div className="bg-slate-900 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black tracking-tight">Submit Payment Receipt</DialogTitle>
                            <DialogDescription className="text-slate-400 mt-1">
                                Attach your bank transfer confirmation. Our team will verify it within 30–60 minutes.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* File Upload */}
                        <div className="grid gap-2">
                            <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Receipt Image <span className="text-rose-500">*</span>
                            </Label>
                            <div
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                                className={`relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-3 overflow-hidden min-h-[180px]
                                    ${isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
                            >
                                {filePreview ? (
                                    <div className="relative w-full p-2 group">
                                        <img src={filePreview} alt="Preview" className="w-full h-40 object-cover rounded-xl shadow-sm" />
                                        <div className="absolute inset-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center backdrop-blur-[2px]">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 rounded-full"
                                                onClick={(e) => { e.stopPropagation(); setSelectedFile(null); setFilePreview(null); }}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Remove
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-4 left-4 right-4 text-center">
                                            <p className="text-[10px] font-bold text-white truncate drop-shadow-md">{selectedFile?.name}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className={`h-14 w-14 rounded-full flex items-center justify-center transition-all ${isDragging ? 'bg-indigo-100 text-indigo-600 scale-110' : 'bg-slate-100 text-slate-400'}`}>
                                            <Upload className="h-7 w-7" />
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-sm font-bold text-slate-900">Drag & drop your receipt here</p>
                                            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-medium">Or click below to browse</p>
                                        </div>
                                        <Button type="button" variant="outline" size="sm" className="relative z-10 font-bold bg-white">
                                            Choose File
                                        </Button>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileChange(f); }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="grid gap-2">
                            <Label htmlFor="receipt-amount" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                Amount Transferred (ETB) <span className="text-rose-500">*</span>
                            </Label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="receipt-amount"
                                    type="number"
                                    min="1"
                                    step="0.01"
                                    className="pl-9 font-semibold border-2"
                                    placeholder="0.00"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Contract Period (optional) */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="period-start" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Period Start <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    id="period-start"
                                    type="date"
                                    className="border-2"
                                    value={form.contract_period_start}
                                    onChange={(e) => setForm({ ...form, contract_period_start: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="period-end" className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                    Period End <span className="text-slate-400 font-normal normal-case">(optional)</span>
                                </Label>
                                <Input
                                    id="period-end"
                                    type="date"
                                    className="border-2"
                                    value={form.contract_period_end}
                                    onChange={(e) => setForm({ ...form, contract_period_end: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                            <p className="text-[11px] text-indigo-700 leading-relaxed font-medium italic">
                                * Ensure the transaction ID and amount are clearly visible. Verification typically takes 30–60 minutes during business hours.
                            </p>
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                className="font-bold text-slate-500"
                                onClick={() => { setIsDialogOpen(false); resetDialog(); }}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FilePlus className="h-4 w-4 mr-2" />}
                                Submit Receipt
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
