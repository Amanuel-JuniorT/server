import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Loader2, Plus, Package, Trash2, Power, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface RidePackage {
    id: number;
    name: string;
    ride_count: number;
    price: number;
    description: string | null;
    is_active: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Ride Packages', href: '/admin/ride-packages' },
];

export default function RidePackagesPage() {
    const { packages } = usePage<{ packages: RidePackage[] }>().props;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<RidePackage | null>(null);

    const { data, setData, post, put, processing, reset, errors, clearErrors } = useForm({
        name: '',
        ride_count: '',
        price: '',
        description: '',
        is_active: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingPackage) {
            put(`/admin/ride-packages/${editingPackage.id}`, {
                onSuccess: () => {
                    toast.success('Package updated successfully');
                    setIsCreateOpen(false);
                    setEditingPackage(null);
                    reset();
                },
            });
        } else {
            post('/admin/ride-packages', {
                onSuccess: () => {
                    toast.success('Ride Package created!');
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (pkg: RidePackage) => {
        setEditingPackage(pkg);
        setData({
            name: pkg.name,
            ride_count: pkg.ride_count.toString(),
            price: pkg.price.toString(),
            description: pkg.description || '',
            is_active: pkg.is_active,
        });
        setIsCreateOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        router.delete(`/admin/ride-packages/${id}`, {
            onSuccess: () => toast.success('Package deleted'),
            onError: (errs: any) => toast.error(errs.message || 'Failed to delete')
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Ride Packages" />
            <div className="flex flex-1 flex-col gap-4 p-6 lg:gap-8 lg:p-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Company Ride Packages</h1>
                        <p className="text-muted-foreground mt-2">Define prepaid ride bundles that companies can purchase.</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={(open) => {
                        setIsCreateOpen(open);
                        if (!open) { reset(); clearErrors(); setEditingPackage(null); }
                    }}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="shadow-lg bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="mr-2 h-5 w-5" />
                                Create New Package
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>{editingPackage ? 'Edit Package' : 'New Ride Package'}</DialogTitle>
                                    <DialogDescription>Set the price and number of rides for this prepaid bundle.</DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Package Name</Label>
                                        <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} required placeholder="e.g. Bronze Bundle" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="ride_count">Number of Rides</Label>
                                            <Input id="ride_count" type="number" value={data.ride_count} onChange={e => setData('ride_count', e.target.value)} required placeholder="50" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="price">Price (ETB)</Label>
                                            <Input id="price" type="number" step="0.01" value={data.price} onChange={e => setData('price', e.target.value)} required placeholder="5000" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea id="description" value={data.description} onChange={e => setData('description', e.target.value)} placeholder="What's included..." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={processing} className="w-full bg-indigo-600">
                                        {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingPackage ? 'Update Package' : 'Create Package'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card className="shadow-sm border-t-4 border-t-indigo-500">
                    <CardHeader>
                        <CardTitle>Available Packages</CardTitle>
                        <CardDescription>All active and inactive ride packages available for corporate clients.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Package Details</TableHead>
                                    <TableHead>Ride Count</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {packages && packages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-lg">
                                                    <Package className="h-5 w-5 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="font-bold">{pkg.name}</div>
                                                    <div className="text-xs text-muted-foreground">{pkg.description || 'No description'}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-lg">{pkg.ride_count}</span>
                                            <span className="ml-1 text-sm text-muted-foreground">rides</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-bold text-emerald-600">{pkg.price} ETB</span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${pkg.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-sm">{pkg.is_active ? 'Active' : 'Deactivated'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                                                    <Edit2 className="h-4 w-4 text-slate-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(pkg.id)}>
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!packages || packages.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                            No packages defined yet. Click "Create New Package" to get started.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
