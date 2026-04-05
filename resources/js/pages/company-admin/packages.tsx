import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, CreditCard, ExternalLink, FilePlus, FileText, History, LayoutDashboard, Loader2, Package, Receipt, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RidePackage {
    id: number;
    name: string;
    ride_count: number;
    price: number;
    description: string | null;
}

interface PurchaseHistory {
    id: number;
    package: RidePackage;
    rides_purchased: number;
    rides_remaining: number;
    amount_paid: number;
    status: string;
    company_payment_receipt_id: number | null;
    created_at: string;
}

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
    packages: RidePackage[];
    history: PurchaseHistory[];
    company: {
        id: number;
        name: string;
        total_remaining_rides: number;
    };
}

export default function CompanyPackagesPage() {
    const { packages, history, company } = usePage<Props & any>().props;
    const [selectedPackage, setSelectedPackage] = useState<RidePackage | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    // Receipt related state
    const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
    const [receiptForm, setReceiptForm] = useState({
        amount: '',
        receipt_image_url: '',
        package_purchase_id: null as number | null,
        contract_period_start: '',
        contract_period_end: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Ride Packages', href: `/company-admin/packages` },
    ];

    useEffect(() => {
        fetchReceipts();
    }, []);

    const fetchReceipts = async () => {
        try {
            const res = await fetch(`/company-admin/api/payment-receipts`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) setReceipts(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch receipts:', error);
        }
    };

    const handlePurchase = () => {
        if (!selectedPackage) return;
        
        setIsProcessing(true);
        router.post(`/company-admin/packages/purchase`, {
            package_id: selectedPackage.id
        }, {
            onSuccess: () => {
                toast.success(`Package purchase initiated! Please upload a bank receipt to activate your rides.`);
                setIsConfirmOpen(false);
                setSelectedPackage(null);
                setActiveTab('history');
            },
            onError: (errs: any) => {
                toast.error(errs.message || 'Failed to complete purchase');
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    const handleOpenReceiptDialog = (purchase?: PurchaseHistory) => {
        if (purchase) {
            setReceiptForm({
                amount: purchase.amount_paid.toString(),
                receipt_image_url: '',
                package_purchase_id: purchase.id,
                contract_period_start: '',
                contract_period_end: '',
            });
        } else {
            setReceiptForm({
                amount: '',
                receipt_image_url: '',
                package_purchase_id: null,
                contract_period_start: '',
                contract_period_end: '',
            });
        }
        setIsReceiptDialogOpen(true);
    };

    const handleSubmitReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingReceipt(true);
        
        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/company-admin/api/payment-receipts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify(receiptForm),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                toast.success('Payment receipt submitted successfully!');
                setIsReceiptDialogOpen(false);
                fetchReceipts();
                // Refresh the whole page state since history depends on receipt
                router.reload({ only: ['history'] });
            } else {
                toast.error(data.message || 'Failed to submit receipt');
            }
        } catch (error) {
            toast.error('An error occurred during submission');
        } finally {
            setIsSubmittingReceipt(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ride Packages & Credits" />
            <div className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-10">
                
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ride Credits</h1>
                        <p className="text-muted-foreground">Manage your company's ride balance and service packages</p>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-4 bg-muted/50 p-1">
                        <TabsTrigger value="overview" className="gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="purchase" className="gap-2">
                            <Package className="h-4 w-4" />
                            Purchase Packages
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <History className="h-4 w-4" />
                            Billing History
                        </TabsTrigger>
                        <TabsTrigger value="receipts" className="gap-2">
                            <FileText className="h-4 w-4" />
                            Receipts Log
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl">
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center gap-2 text-indigo-100 font-bold">
                                        <Sparkles className="h-5 w-5" />
                                        Current Ride Balance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-end gap-3 mt-4">
                                        <span className="text-7xl font-black tracking-tighter leading-none">
                                            {company.total_remaining_rides || 0}
                                        </span>
                                        <span className="text-2xl font-medium mb-1 opacity-80 lowercase">rides remaining</span>
                                    </div>
                                    <p className="mt-6 text-indigo-100/70 text-sm max-w-sm leading-relaxed">
                                        Your credits are automatically consumed as daily scheduled rides are completed. 
                                        Maintain a healthy balance to ensure uninterrupted service for your employees.
                                    </p>
                                    <Button 
                                        variant="secondary" 
                                        className="mt-8 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
                                        onClick={() => setActiveTab('purchase')}
                                    >
                                        Buy More Rides
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="flex flex-col justify-between p-6 border-dashed border-2 bg-slate-50/50">
                                <div>
                                    <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                                        <CreditCard className="h-6 w-6 text-indigo-600" />
                                    </div>
                                    <h3 className="font-bold text-xl mb-2 text-slate-900">How to Top Up</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">
                                        1. Select a package from the store.<br />
                                        2. Confirm your purchase details.<br />
                                        3. Upload your bank payment receipt.<br />
                                        4. Rides activated upon verification!
                                    </p>
                                </div>
                                <Button variant="outline" className="w-full mt-6" onClick={() => handleOpenReceiptDialog()}>
                                    Submit A Receipt
                                </Button>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Purchase Tab */}
                    <TabsContent value="purchase" className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex flex-col space-y-1">
                            <h2 className="text-2xl font-bold tracking-tight">Available Packages</h2>
                            <p className="text-muted-foreground text-sm">Choose a ride bundle that best fits your company's weekly needs.</p>
                        </div>
                        
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {packages && packages.map((pkg: RidePackage) => (
                                <Card key={pkg.id} className="relative flex flex-col h-full overflow-hidden border-2 hover:border-indigo-500 transition-all duration-300 group shadow-sm hover:shadow-md" 
                                      onClick={() => { setSelectedPackage(pkg); setIsConfirmOpen(true); }}>
                                    <div className="p-1 bg-indigo-50/50 border-b group-hover:bg-indigo-600/5 transition-colors">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 px-3 py-1">
                                            {pkg.name}
                                        </div>
                                    </div>
                                    <CardContent className="pt-8 flex-1">
                                        <div className="flex items-baseline gap-1 mb-2">
                                            <span className="text-4xl font-black text-slate-900">{pkg.price}</span>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-wider">ETB</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="px-2 py-0.5 bg-slate-900 text-white text-[10px] font-bold rounded">
                                                {pkg.ride_count} RIDES
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-500">
                                                ~{Math.round(pkg.price / pkg.ride_count)} ETB / ride
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed">
                                            {pkg.description || "Comprehensive ride bundle optimized for small to medium corporate teams."}
                                        </p>
                                    </CardContent>
                                    <div className="p-4 bg-slate-50 border-t mt-auto">
                                        <Button className="w-full bg-slate-900 group-hover:bg-indigo-600 transition-all font-bold">
                                            Select Package
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardHeader className="bg-slate-50/50 border-b">
                                <CardTitle className="text-lg">Billing & Transaction History</CardTitle>
                                <CardDescription>Track all your package purchases and their activation status.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/30">
                                        <TableRow>
                                            <TableHead className="font-bold">Package Name</TableHead>
                                            <TableHead className="font-bold">Purchase Date</TableHead>
                                            <TableHead className="font-bold">Quantity</TableHead>
                                            <TableHead className="text-right font-bold">Amount</TableHead>
                                            <TableHead className="text-right font-bold">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history && history.map((item: PurchaseHistory) => (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="font-medium text-slate-900">
                                                    {item.package.name}
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {new Date(item.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]">
                                                        {item.rides_purchased} RIDES
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right font-black text-slate-900">
                                                    {item.amount_paid} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end gap-1.5">
                                                        <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                                                            item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                                            item.status === 'pending_payment' ? 'bg-amber-100 text-amber-700' : 
                                                            'bg-slate-200 text-slate-600'
                                                        }`}>
                                                            {item.status.replace('_', ' ')}
                                                        </span>
                                                        {item.status === 'pending_payment' && !item.company_payment_receipt_id && (
                                                            <Button 
                                                                variant="outline" 
                                                                size="sm" 
                                                                className="h-7 text-[10px] px-3 font-bold border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => handleOpenReceiptDialog(item)}
                                                            >
                                                                <CreditCard className="mr-1 h-3 w-3" />
                                                                Pay Now
                                                            </Button>
                                                        )}
                                                        {item.company_payment_receipt_id && (
                                                            <span className="text-[9px] text-slate-400 italic">Receipt attached</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!history || history.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                                        <History className="h-12 w-12 mb-2 opacity-20" />
                                                        <p className="text-sm italic">You haven't made any purchases yet.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Receipts Log Tab */}
                    <TabsContent value="receipts" className="space-y-6 animate-in slide-in-from-right-2 duration-500">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight">Receipts Log</h2>
                                <p className="text-muted-foreground text-sm">Overview of all submitted bank receipts and their status.</p>
                            </div>
                            <Button onClick={() => handleOpenReceiptDialog()} className="bg-indigo-600 hover:bg-indigo-700">
                                <FilePlus className="mr-2 h-4 w-4" />
                                Submit Receipt
                            </Button>
                        </div>

                        <Card className="border-none shadow-sm overflow-hidden">
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-50/30">
                                        <TableRow>
                                            <TableHead className="font-bold">Submission Date</TableHead>
                                            <TableHead className="font-bold">Amount</TableHead>
                                            <TableHead className="font-bold">Period / Note</TableHead>
                                            <TableHead className="text-right font-bold">Status</TableHead>
                                            <TableHead className="text-right font-bold">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {receipts && receipts.map((receipt) => (
                                            <TableRow key={receipt.id} className="hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="text-sm font-medium">
                                                    {new Date(receipt.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="font-black text-slate-900">
                                                    {receipt.amount} <span className="text-[10px] font-normal text-slate-400">ETB</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-500">
                                                    {receipt.contract_period_start ? (
                                                        <>Period: {new Date(receipt.contract_period_start).toLocaleDateString()} - {new Date(receipt.contract_period_end || '').toLocaleDateString()}</>
                                                    ) : (
                                                        <span className="italic">Ride Package Topup</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className={`text-[10px] uppercase font-black px-2.5 py-1 rounded-full ${
                                                        receipt.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 
                                                        receipt.status === 'pending' ? 'bg-amber-100 text-amber-700' : 
                                                        'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {receipt.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <a href={receipt.receipt_image_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-xs font-bold">
                                                        <ExternalLink className="mr-1 h-3 w-3" />
                                                        View
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!receipts || receipts.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center text-slate-400">
                                                        <FileText className="h-12 w-12 mb-2 opacity-20" />
                                                        <p className="text-sm italic">No receipts submitted yet.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Confirm Purchase Dialog remains global */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden">
                        <div className="bg-indigo-600 p-8 text-white relative overflow-hidden">
                            <Sparkles className="absolute -right-4 -top-4 h-24 w-24 opacity-10 rotate-12" />
                            <DialogHeader>
                                <DialogTitle className="text-3xl font-black tracking-tight text-white">Purchase Summary</DialogTitle>
                                <DialogDescription className="text-indigo-100 opacity-80">
                                    Finalizing your order for additional ride credits.
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Package</div>
                                    <div className="text-xl font-black text-slate-900">{selectedPackage?.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Quantity</div>
                                    <div className="text-xl font-black text-indigo-600">{selectedPackage?.ride_count} rides</div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 text-center">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Amount to Pay</div>
                                <div className="text-5xl font-black text-slate-900">
                                    {selectedPackage?.price} <span className="text-xl font-bold text-slate-400">ETB</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <Button className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95" 
                                        onClick={handlePurchase} disabled={isProcessing}>
                                    {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <>Confirm & Pay</>}
                                </Button>
                                <Button variant="ghost" className="w-full h-12 font-bold text-slate-500" onClick={() => setIsConfirmOpen(false)}>
                                    Go Back
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Submit Receipt Dialog */}
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                    <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Submit Payment Receipt</DialogTitle>
                            <DialogDescription>
                                Upload your bank transfer or deposit receipt for verification.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <form onSubmit={handleSubmitReceipt} className="space-y-4 py-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="amount">Amount (ETB)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={receiptForm.amount}
                                        onChange={(e) => setReceiptForm({ ...receiptForm, amount: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        disabled={!!receiptForm.package_purchase_id}
                                    />
                                    {receiptForm.package_purchase_id && (
                                        <p className="text-[10px] text-slate-500 italic">Amount fixed for selected package.</p>
                                    )}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="receipt_image_url">Receipt File URL</Label>
                                    <Input
                                        id="receipt_image_url"
                                        type="url"
                                        value={receiptForm.receipt_image_url}
                                        onChange={(e) => setReceiptForm({ ...receiptForm, receipt_image_url: e.target.value })}
                                        placeholder="https://link-to-your-receipt-image.jpg"
                                        required
                                    />
                                    <p className="text-[10px] text-slate-400">
                                        Please provide a public link to your deposit slip (e.g., from Google Drive, Dropbox, or a screenshot host).
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_period_start" className="text-xs">Period Start (Optional)</Label>
                                        <Input
                                            id="contract_period_start"
                                            type="date"
                                            value={receiptForm.contract_period_start}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, contract_period_start: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="contract_period_end" className="text-xs">Period End (Optional)</Label>
                                        <Input
                                            id="contract_period_end"
                                            type="date"
                                            value={receiptForm.contract_period_end}
                                            onChange={(e) => setReceiptForm({ ...receiptForm, contract_period_end: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12" disabled={isSubmittingReceipt}>
                                    {isSubmittingReceipt ? <Loader2 className="h-5 w-5 animate-spin" /> : "Submit for Verification"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
