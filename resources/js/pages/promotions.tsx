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
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Bell, Eye, EyeIcon, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Promotion {
    id: number;
    title: string;
    description: string;
    image_url: string;
    type: 'news' | 'promotion' | 'alert';
    expiry_date: string;
    is_active: boolean;
    created_at: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Promotions',
        href: '/promotions',
    },
];

export default function PromotionsPage() {
    // Receive promotions via standard Inertia Page props instead of a raw API fetch
    const { promotions } = usePage<{ promotions: Promotion[] }>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Using Inertia useForm for seamless server-side validation and form handling
    const { data, setData, post, processing, reset, errors } = useForm({
        title: '',
        description: '',
        image_url: '',
        type: 'promotion',
        expiry_date: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/promotions', {
            onSuccess: () => {
                toast.success('Promotion created successfully');
                setIsCreateOpen(false);
                reset();
            },
            onError: (errors) => {
                Object.values(errors).forEach(err => toast.error(err));
            }
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return;
        router.delete(`/admin/promotions/${id}`, {
            onSuccess: () => toast.success('Promotion deleted'),
            onError: () => toast.error('Failed to delete promotion'),
        });
    };

    const handlePushNotification = async (promotion: Promotion, targetAudience: 'all_passengers' | 'all_drivers') => {
        if (!confirm(`Broadcast "${promotion.title}" to ${targetAudience}? This cannot be undone.`)) return;

        try {
            const res = await window.axios.post('/admin/notifications/send', {
                target: targetAudience, 
                title: promotion.title,
                body: promotion.description,
                data: {
                    type: 'promotion',
                    promotion_id: String(promotion.id),
                    image: promotion.image_url || '',
                },
                high_priority: true,
            });

            if (res.data.success) {
                toast.success('Broadcast transmission complete!');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error executing broadcast logic');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promotions" />
            <div className="flex flex-1 flex-col gap-4 p-6 lg:gap-8 lg:p-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Promotions & Announcements</h1>
                        <p className="text-muted-foreground mt-2">Manage ongoing promotions, send push blasts, and review promotional timelines.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="shadow-lg">
                                <Plus className="mr-2 h-5 w-5" />
                                Create Promotion
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Promotion</DialogTitle>
                                <DialogDescription>Build a new campaign or announcement for your users.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={data.title}
                                        onChange={(e) => setData('title', e.target.value)}
                                        required
                                        placeholder="e.g., 50% Off First Ride"
                                    />
                                    {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={data.type} onValueChange={(val) => setData('type', val)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="promotion">Promotion</SelectItem>
                                            <SelectItem value="news">News</SelectItem>
                                            <SelectItem value="alert">Alert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        required
                                        placeholder="Detailed promotion rules..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                                    <Input id="expiry_date" type="date" value={data.expiry_date} onChange={(e) => setData('expiry_date', e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                                    <Input
                                        id="image_url"
                                        value={data.image_url}
                                        onChange={(e) => setData('image_url', e.target.value)}
                                        placeholder="https://..."
                                    />
                                </div>
                                <DialogFooter className="mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Campaign
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="shadow-sm border-t-4 border-t-primary/20">
                    <CardHeader>
                        <CardTitle>All Active & Historic</CardTitle>
                        <CardDescription>A complete log of every promotional asset deployed to your users.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {promotions && promotions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-dashed bg-muted/30">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                    <Bell className="h-8 w-8 text-primary/70" />
                                </div>
                                <h3 className="mt-4 font-semibold text-lg">No Promotions Active</h3>
                                <p className="mt-2 text-muted-foreground max-w-sm">You haven't created any announcements or promotions yet. Click the button above to get started.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[300px]">Campaign</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promotions && promotions.map((promo) => (
                                        <TableRow key={promo.id}>
                                            <TableCell className="font-medium align-top">
                                                <div className="flex items-start gap-3 pt-1">
                                                    {promo.image_url && (
                                                        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-muted bg-muted/50">
                                                            <img src={promo.image_url} alt="" className="h-full w-full object-cover" />
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col">
                                                        <span className="font-semibold text-base">{promo.title}</span>
                                                        <span className="text-muted-foreground line-clamp-1 max-w-[280px] text-sm mt-0.5">{promo.description}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize tracking-wide ${
                                                        promo.type === 'alert'
                                                            ? 'bg-red-100 text-red-800'
                                                            : promo.type === 'promotion'
                                                              ? 'bg-emerald-100 text-emerald-800'
                                                              : 'bg-indigo-100 text-indigo-800'
                                                    }`}
                                                >
                                                    {promo.type}
                                                </span>
                                            </TableCell>
                                            <TableCell className="align-middle text-sm">
                                                <div className="flex flex-col text-muted-foreground">
                                                    <span>{new Date(promo.created_at).toLocaleDateString()}</span>
                                                    <span>to {promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString() : 'Forever'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-middle">
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2.5 w-2.5 rounded-full ${promo.is_active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-zinc-300'}`} />
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {promo.is_active ? 'Active' : 'Archived'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right align-middle">
                                                <div className="flex justify-end gap-1.5">
                                                    <Select onValueChange={(val: 'all_passengers' | 'all_drivers') => handlePushNotification(promo, val)}>
                                                        <SelectTrigger className="w-9 h-9 border-none bg-blue-50 text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-0 flex items-center justify-center [&>svg]:hidden ring-0 focus:ring-0">
                                                            <Bell className="h-4 w-4" />
                                                        </SelectTrigger>
                                                        <SelectContent align="end">
                                                            <SelectItem value="all_passengers">Blast Passengers</SelectItem>
                                                            <SelectItem value="all_drivers">Blast Drivers</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <Link href={`/promotions/${promo.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-slate-600 hover:text-slate-900"
                                                            title="View Expert Details"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDelete(promo.id)}
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
