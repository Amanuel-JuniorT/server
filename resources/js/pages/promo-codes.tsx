import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Copy, Loader2, Plus, Ticket, Trash2, Power } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface PromotionCampaign {
    id: number;
    name: string;
    description: string | null;
    code: string;
    discount_type: 'percentage' | 'flat';
    discount_value: number;
    max_discount_amount: number | null;
    min_trip_amount: number | null;
    total_budget: number | null;
    current_spend: number;
    usage_limit_per_user: number | null;
    start_date: string | null;
    end_date: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Promo Codes', href: '/promo-codes' },
];

export default function PromoCodesPage() {
    const { campaigns } = usePage<{ campaigns: PromotionCampaign[] }>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, processing, reset, errors, clearErrors } = useForm({
        name: '',
        description: '',
        code: '',
        discount_type: 'percentage' as 'percentage' | 'flat',
        discount_value: '',
        max_discount_amount: '',
        min_trip_amount: '',
        total_budget: '',
        usage_limit_per_user: '',
        start_date: '',
        end_date: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/promo-codes', {
            onSuccess: () => {
                toast.success('Promo Code successfully deployed!');
                setIsCreateOpen(false);
                reset();
                clearErrors();
            },
            onError: (errs) => {
                Object.values(errs).forEach(err => toast.error(err));
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this coupon code permanently?')) return;
        router.delete(`/admin/promo-codes/${id}`, {
            onSuccess: () => toast.success('Coupon deleted successfully'),
            onError: (errs) => {
                if(errs.error) toast.error(errs.error);
            }
        });
    };

    const handleToggle = (id: number) => {
        router.patch(`/admin/promo-codes/${id}/toggle`, {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Status updated')
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied code: ${text}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promo Codes & Discounts" />
            <div className="flex flex-1 flex-col gap-4 p-6 lg:gap-8 lg:p-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financial Discounts & Promo Codes</h1>
                        <p className="text-muted-foreground mt-2">Manage the actual mathematical coupons users type into their wallet to get ride discounts.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) { reset(); clearErrors(); }
                    }}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="shadow-lg bg-emerald-600 hover:bg-emerald-700">
                                <Plus className="mr-2 h-5 w-5" />
                                Create Coupon
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">New Coupon Code</DialogTitle>
                                <DialogDescription>Generate an actual financially binding discount code for your riders.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6 py-4">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="code" className="font-bold text-slate-900">Coupon Code <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                            required
                                            placeholder="e.g. WELCOME26"
                                            className="font-mono font-bold tracking-widest uppercase input-lg border-emerald-500 focus-visible:ring-emerald-500"
                                        />
                                        {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="font-bold">Campaign Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Internal reference name..."
                                        />
                                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (Optional)</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Note what this coupon is for..."
                                    />
                                </div>

                                <Card className="bg-slate-50 border border-slate-200 shadow-inner">
                                    <CardHeader className="py-3 px-4 bg-slate-100/50 border-b">
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Ticket className="h-4 w-4" />
                                            Mathematical Logic
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="discount_type" className="font-bold">Discount Type <span className="text-red-500">*</span></Label>
                                            <Select value={data.discount_type} onValueChange={(val: any) => setData('discount_type', val)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                                                    <SelectItem value="flat">Flat Amount (ETB)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="discount_value" className="font-bold">
                                                Value ({data.discount_type === 'percentage' ? '%' : 'ETB'}) <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="discount_value"
                                                type="number"
                                                step="0.01"
                                                value={data.discount_value}
                                                onChange={(e) => setData('discount_value', e.target.value)}
                                                required
                                            />
                                            {errors.discount_value && <p className="text-xs text-red-500">{errors.discount_value}</p>}
                                        </div>
                                        {data.discount_type === 'percentage' && (
                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="max_discount_amount">Maximum Discount Cap (ETB)</Label>
                                                <Input
                                                    id="max_discount_amount"
                                                    type="number"
                                                    step="0.01"
                                                    value={data.max_discount_amount}
                                                    onChange={(e) => setData('max_discount_amount', e.target.value)}
                                                    placeholder="e.g. 50 (no more than 50 ETB off)"
                                                />
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="min_trip_amount">Minimum Ride Fare (Optional)</Label>
                                            <Input
                                                id="min_trip_amount"
                                                type="number"
                                                step="0.01"
                                                value={data.min_trip_amount}
                                                onChange={(e) => setData('min_trip_amount', e.target.value)}
                                                placeholder="e.g. 150"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="usage_limit_per_user">Limits Per User (Optional)</Label>
                                        <Input
                                            id="usage_limit_per_user"
                                            type="number"
                                            value={data.usage_limit_per_user}
                                            onChange={(e) => setData('usage_limit_per_user', e.target.value)}
                                            placeholder="e.g. 1 (usable once)"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="total_budget">Corporate Budget Max (ETB)</Label>
                                        <Input
                                            id="total_budget"
                                            type="number"
                                            step="0.01"
                                            value={data.total_budget}
                                            onChange={(e) => setData('total_budget', e.target.value)}
                                            placeholder="Stop working when X reaches"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="start_date">Start Date</Label>
                                        <Input id="start_date" type="date" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="end_date">End Date</Label>
                                        <Input id="end_date" type="date" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} />
                                        {errors.end_date && <p className="text-xs text-red-500">{errors.end_date}</p>}
                                    </div>
                                </div>

                                <DialogFooter className="mt-6 pt-4 border-t">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing} className="bg-emerald-600 hover:bg-emerald-700">
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Generate Active Coupon
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="shadow-sm border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <CardTitle>Active Financial Campaigns</CardTitle>
                        <CardDescription>Track distribution and utilization of the coupons available in passenger wallets.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {campaigns && campaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed bg-muted/30">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100/50">
                                    <Ticket className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="mt-4 font-semibold text-lg">No Coupons Issued</h3>
                                <p className="mt-2 text-muted-foreground max-w-sm">You haven't generated any financial discount codes for passengers yet.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Coupon Code</TableHead>
                                        <TableHead>Logic & Limits</TableHead>
                                        <TableHead>Budget Utilization</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns && campaigns.map((campaign) => (
                                        <TableRow key={campaign.id}>
                                            <TableCell className="align-top font-medium">
                                                <div className="flex flex-col items-start gap-1">
                                                    <div 
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded text-lg font-mono tracking-widest cursor-pointer hover:bg-slate-200 transition-colors"
                                                        onClick={() => copyToClipboard(campaign.code)}
                                                        title="Click to copy"
                                                    >
                                                        {campaign.code}
                                                        <Copy className="h-3 w-3 text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-700 mt-1">{campaign.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                                <div className="flex flex-col gap-1 text-sm">
                                                    <span className="font-bold text-emerald-600">
                                                        {campaign.discount_type === 'percentage' 
                                                            ? `${campaign.discount_value}% OFF`
                                                            : `${campaign.discount_value} ETB OFF`}
                                                    </span>
                                                    {campaign.discount_type === 'percentage' && campaign.max_discount_amount && (
                                                        <span className="text-xs text-muted-foreground">Max limit: {campaign.max_discount_amount} ETB</span>
                                                    )}
                                                    {campaign.usage_limit_per_user && (
                                                        <span className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-1.5 py-0.5 rounded w-fit">
                                                            {campaign.usage_limit_per_user} uses / passenger
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                                {campaign.total_budget ? (
                                                    <div className="flex flex-col gap-1 w-[150px]">
                                                        <div className="flex justify-between text-xs font-medium">
                                                            <span className="text-emerald-600">{campaign.current_spend}</span>
                                                            <span className="text-slate-400">/ {campaign.total_budget} ETB</span>
                                                        </div>
                                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full bg-emerald-500 rounded-full" 
                                                                style={{ width: `${Math.min(100, (campaign.current_spend / campaign.total_budget) * 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground italic">Unlimited Budget</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="align-middle">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-2.5 w-2.5 rounded-full ${campaign.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-300'}`} />
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            {campaign.is_active ? 'Active' : 'Suspended'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right align-middle">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={campaign.is_active ? "text-amber-500 hover:text-amber-700 hover:bg-amber-50" : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"}
                                                        onClick={() => handleToggle(campaign.id)}
                                                        title={campaign.is_active ? "Suspend Code" : "Reactivate Code"}
                                                    >
                                                        <Power className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(campaign.id)}
                                                        title="Delete Code"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
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
