import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { CheckCircle2, CreditCard, History, Loader2, Package, Sparkles } from 'lucide-react';
import { useState } from 'react';
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
    created_at: string;
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

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Ride Packages', href: `/company-admin/packages` },
    ];

    const handlePurchase = () => {
        if (!selectedPackage) return;
        
        setIsProcessing(true);
        router.post(`/company/${company.id}/packages/purchase`, {
            package_id: selectedPackage.id
        }, {
            onSuccess: () => {
                toast.success(`Successfully purchased ${selectedPackage.name}!`);
                setIsConfirmOpen(false);
                setSelectedPackage(null);
            },
            onError: (errs) => {
                toast.error(errs.message || 'Failed to complete purchase');
            },
            onFinish: () => setIsProcessing(false)
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ride Packages & Credits" />
            <div className="flex flex-1 flex-col gap-6 p-6 lg:gap-8 lg:p-10">
                
                {/* Balance Header */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-indigo-100">
                                <Sparkles className="h-5 w-5" />
                                Current Ride Balance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-3">
                                <span className="text-6xl font-black tracking-tighter">
                                    {company.total_remaining_rides || 0}
                                </span>
                                <span className="text-xl font-medium mb-2 opacity-80">rides remaining</span>
                            </div>
                            <p className="mt-4 text-indigo-100/70 text-sm max-w-md">
                                These credits are automatically consumed as your daily scheduled rides are generated. 
                                Make sure to top up before your balance reaches zero to avoid service interruption.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col justify-center items-center p-6 text-center border-dashed border-2">
                        <div className="p-3 bg-indigo-50 rounded-full mb-4">
                            <CreditCard className="h-8 w-8 text-indigo-600" />
                        </div>
                        <h3 className="font-bold text-lg">Top Up Credits</h3>
                        <p className="text-sm text-muted-foreground mb-4">Select a package from the list below to add more rides to your account.</p>
                    </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Package Listing */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center gap-2">
                            <Package className="h-6 w-6 text-indigo-600" />
                            <h2 className="text-2xl font-bold">Select a Package</h2>
                        </div>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                            {packages && packages.map((pkg: RidePackage) => (
                                <Card key={pkg.id} className="relative overflow-hidden group hover:border-indigo-500 transition-all cursor-pointer" 
                                      onClick={() => { setSelectedPackage(pkg); setIsConfirmOpen(true); }}>
                                    <CardHeader className="bg-slate-50 border-b">
                                        <CardTitle className="flex justify-between items-center group-hover:text-indigo-600 transition-colors">
                                            {pkg.name}
                                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                {pkg.ride_count} Rides
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="text-3xl font-black text-slate-900 mb-2">
                                            {pkg.price} <span className="text-sm font-normal text-muted-foreground uppercase">etb</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground min-h-[40px]">
                                            {pkg.description || "Prepaid ride bundle for your company employees."}
                                        </p>
                                        <Button className="w-full mt-6 bg-slate-900 group-hover:bg-indigo-600 transition-colors">
                                            Purchase Now
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Purchase History */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">
                            <History className="h-6 w-6 text-slate-600" />
                            <h2 className="text-2xl font-bold">Purchase History</h2>
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Package</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history && history.map((item: PurchaseHistory) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-bold text-sm text-slate-700">{item.package.name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.rides_purchased} rides</div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-sm">
                                                    {item.amount_paid} <span className="text-[10px] text-muted-foreground uppercase">etb</span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(!history || history.length === 0) && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-xs text-muted-foreground italic">
                                                    No purchases yet.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Confirm Purchase Dialog */}
                <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Confirm Purchase</DialogTitle>
                            <DialogDescription>
                                You are about to purchase the <strong>{selectedPackage?.name}</strong>. 
                                This will add <strong>{selectedPackage?.ride_count} rides</strong> to your company balance.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="bg-slate-50 p-6 rounded-xl border-2 border-indigo-100 my-4 text-center">
                            <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Total to Pay</div>
                            <div className="text-4xl font-black text-indigo-600">
                                {selectedPackage?.price} <span className="text-sm font-normal">ETB</span>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 h-10 px-8" 
                                    onClick={handlePurchase} disabled={isProcessing}>
                                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Confirm & Pay
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
