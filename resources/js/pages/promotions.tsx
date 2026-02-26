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
import { Head } from '@inertiajs/react';
import { Bell, Loader2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
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
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image_url: '',
        type: 'promotion',
        expiry_date: '',
        is_active: true,
    });

    const fetchPromotions = async () => {
        try {
            const res = await fetch('/admin/promotions/list', {
                headers: {
                    Accept: 'application/json',
                },
            });
            // Note: In Inertia app, standard fetch might rely on cookies.
            // If the API allows Sanctum cookie auth, this should work.
            // Otherwise we might need to use Inertia's usePage props if the data was passed from controller used in web.php
            // But since strict separation isn't enforced in this file, we'll try fetch.

            // Actually, if we are in the same session, fetch to /api might work if middleware allows.
            // Let's assume standard Axios/Fetch works with cookies.

            if (res.ok) {
                const data = await res.json();
                setPromotions(data);
            }
        } catch (error) {
            console.error('Failed to fetch promotions', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);

        try {
            // 1. Create Promotion
            const res = await fetch('/admin/promotions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || 'Failed to create promotion');
            }

            const createdPromotion = await res.json(); // Assuming returns { promotion: ... } or just ...

            toast.success('Promotion created successfully');
            setIsCreateOpen(false);
            setFormData({
                title: '',
                description: '',
                image_url: '',
                type: 'promotion',
                expiry_date: '',
                is_active: true,
            });
            fetchPromotions();

            // Optional: Ask to send push notification
            // For now, we just create it.
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSending(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this promotion?')) return;

        try {
            const res = await fetch(`/admin/promotions/${id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
            });

            if (res.ok) {
                toast.success('Promotion deleted');
                setPromotions((prev) => prev.filter((p) => p.id !== id));
            } else {
                toast.error('Failed to delete promotion');
            }
        } catch (error) {
            toast.error('Error deleting promotion');
        }
    };

    const handlePushNotification = async (promotion: Promotion) => {
        if (!confirm(`Send push notification for "${promotion.title}" to ALL passengers?`)) return;

        try {
            const res = await fetch('/admin/notifications/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                body: JSON.stringify({
                    target: 'all_passengers', // Broadcasting to all
                    title: promotion.title,
                    body: promotion.description,
                    data: {
                        type: 'promotion',
                        promotion_id: String(promotion.id),
                        image: promotion.image_url || '',
                    },
                    high_priority: true,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Notification failed:', errorData);
                throw new Error(errorData.message || 'Failed to send notification');
            }
        } catch (error) {
            toast.error('Error sending notification');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Promotions" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Promotions & Announcements</h1>
                        <p className="text-muted-foreground">Manage ongoing promotions and send alerts to users.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Promotion
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create New Promotion</DialogTitle>
                                <DialogDescription>Add a new promotion or announcement.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        required
                                        placeholder="e.g., 50% Off First Ride"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select value={formData.type} onValueChange={(val) => handleSelectChange('type', val)}>
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
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        required
                                        placeholder="Detailed text..."
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                                    <Input id="expiry_date" name="expiry_date" type="date" value={formData.expiry_date} onChange={handleChange} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="image_url">Image URL (Optional)</Label>
                                    <Input
                                        id="image_url"
                                        name="image_url"
                                        value={formData.image_url}
                                        onChange={handleChange}
                                        placeholder="https://..."
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSending}>
                                        {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create & Save
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Promotions</CardTitle>
                        <CardDescription>List of all active and inactive promotions.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : promotions.length === 0 ? (
                            <div className="text-muted-foreground p-8 text-center">No promotions found. Create one to get started.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promotions.map((promo) => (
                                        <TableRow key={promo.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{promo.title}</span>
                                                    <span className="text-muted-foreground max-w-[200px] truncate text-xs">{promo.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                                                        promo.type === 'alert'
                                                            ? 'bg-red-100 text-red-800'
                                                            : promo.type === 'promotion'
                                                              ? 'bg-green-100 text-green-800'
                                                              : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {promo.type}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {promo.expiry_date ? new Date(promo.expiry_date).toLocaleDateString() : 'No expiry'}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${promo.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                                                >
                                                    {promo.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        onClick={() => handlePushNotification(promo)}
                                                        title="Send Push Notification"
                                                    >
                                                        <Bell className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-red-500 hover:text-red-700"
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
