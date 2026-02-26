import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type VehicleType } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Car, Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicle-types',
    },
];

export default function VehicleTypes() {
    const { vehicleTypes } = usePage<{ vehicleTypes: VehicleType[] }>().props;
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<VehicleType | null>(null);

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
        clearErrors,
    } = useForm({
        name: '',
        display_name: '',
        description: '',
        capacity: 4,
        base_fare: 0,
        price_per_km: 0,
        price_per_minute: 0,
        minimum_fare: 0,
        waiting_fee_per_minute: 0,
        commission_percentage: 15,
        wallet_transaction_percentage: 2,
        wallet_transaction_fixed_fee: 0,
        is_active: true,
        image: null as File | null,
    });

    const openCreateDialog = () => {
        setEditingType(null);
        reset();
        clearErrors();
        setIsDialogOpen(true);
    };

    const openEditDialog = (type: VehicleType) => {
        setEditingType(type);
        setData({
            name: type.name,
            display_name: type.display_name,
            description: type.description || '',
            capacity: type.capacity,
            base_fare: Number(type.base_fare),
            price_per_km: Number(type.price_per_km),
            price_per_minute: Number(type.price_per_minute),
            minimum_fare: Number(type.minimum_fare),
            waiting_fee_per_minute: Number(type.waiting_fee_per_minute),
            commission_percentage: Number(type.commission_percentage),
            wallet_transaction_percentage: Number(type.wallet_transaction_percentage),
            wallet_transaction_fixed_fee: Number(type.wallet_transaction_fixed_fee),
            is_active: type.is_active,
            image: null,
        });
        clearErrors();
        setIsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingType) {
            // Laravel doesn't support multipart/form-data with PUT easily, so we use POST with _method
            post(route('vehicle-types.update', editingType.id), {
                data: {
                    ...data,
                    _method: 'PUT',
                },
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                },
            });
        } else {
            post(route('vehicle-types.store'), {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this vehicle type?')) {
            destroy(route('vehicle-types.destroy', id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Type Management" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <HeadingSmall title="Vehicle Types" description="Manage vehicle categories, capacities, and pricing configurations." />
                    <Button onClick={openCreateDialog} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Vehicle Type
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Fleet Configuration</CardTitle>
                        <CardDescription>All prices are in ETB. Changes here affect ride fare calculations for new requests.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Base Fare</TableHead>
                                    <TableHead>Per KM/Min</TableHead>
                                    <TableHead>Min. Fare</TableHead>
                                    <TableHead>Trans. Fee</TableHead>
                                    <TableHead>Commission</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicleTypes.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-8 text-center">
                                            No vehicle types configured. Click "Add Vehicle Type" to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    vehicleTypes.map((type) => (
                                        <TableRow key={type.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    {type.image_path ? (
                                                        <img
                                                            src={`/storage/${type.image_path}`}
                                                            className="h-10 w-10 rounded border object-contain"
                                                            alt={type.name}
                                                        />
                                                    ) : (
                                                        <div className="flex h-10 w-10 items-center justify-center rounded border bg-slate-100">
                                                            <Car className="h-5 w-5 text-slate-400" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p>{type.display_name}</p>
                                                        <p className="text-muted-foreground text-xs uppercase">{type.name}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{type.capacity} Pax</TableCell>
                                            <TableCell>{type.base_fare} ETB</TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <p>{type.price_per_km} /km</p>
                                                    <p className="text-muted-foreground text-xs">{type.price_per_minute} /min</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>{type.minimum_fare} ETB</TableCell>
                                            <TableCell>{type.wallet_transaction_fixed_fee} ETB</TableCell>
                                            <TableCell>{type.commission_percentage}%</TableCell>
                                            <TableCell>
                                                <Badge variant={type.is_active ? 'completed' : 'failed'}>
                                                    {type.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(type)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(type.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingType ? 'Edit Vehicle Type' : 'Create Vehicle Type'}</DialogTitle>
                        <DialogDescription>
                            Configure pricing and details for this vehicle category. All currency values are in ETB.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Internal Name (Slug)</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. economy, premium, xl"
                                        required
                                    />
                                    {errors.name && <p className="text-destructive text-xs">{errors.name}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="display_name">Display Name</Label>
                                    <Input
                                        id="display_name"
                                        value={data.display_name}
                                        onChange={(e) => setData('display_name', e.target.value)}
                                        placeholder="e.g. Standard, Premium Luxury"
                                        required
                                    />
                                    {errors.display_name && <p className="text-destructive text-xs">{errors.display_name}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Quick description of what this type includes"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity (Pax)</Label>
                                    <Input
                                        id="capacity"
                                        type="number"
                                        value={data.capacity}
                                        onChange={(e) => setData('capacity', parseInt(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="base_fare">Base Fare (ETB)</Label>
                                    <Input
                                        id="base_fare"
                                        type="number"
                                        step="0.01"
                                        value={data.base_fare}
                                        onChange={(e) => setData('base_fare', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_fare">Minimum Fare (ETB)</Label>
                                    <Input
                                        id="minimum_fare"
                                        type="number"
                                        step="0.01"
                                        value={data.minimum_fare}
                                        onChange={(e) => setData('minimum_fare', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price_per_km">Price per KM (ETB)</Label>
                                    <Input
                                        id="price_per_km"
                                        type="number"
                                        step="0.01"
                                        value={data.price_per_km}
                                        onChange={(e) => setData('price_per_km', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price_per_minute">Price per Minute (ETB)</Label>
                                    <Input
                                        id="price_per_minute"
                                        type="number"
                                        step="0.01"
                                        value={data.price_per_minute}
                                        onChange={(e) => setData('price_per_minute', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="waiting_fee">Waiting Fee / Min (ETB)</Label>
                                    <Input
                                        id="waiting_fee"
                                        type="number"
                                        step="0.01"
                                        value={data.waiting_fee_per_minute}
                                        onChange={(e) => setData('waiting_fee_per_minute', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="commission">Commission (%)</Label>
                                    <Input
                                        id="commission"
                                        type="number"
                                        step="0.1"
                                        value={data.commission_percentage}
                                        onChange={(e) => setData('commission_percentage', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wallet_perc">Wallet Trans. %</Label>
                                    <Input
                                        id="wallet_perc"
                                        type="number"
                                        step="0.1"
                                        value={data.wallet_transaction_percentage}
                                        onChange={(e) => setData('wallet_transaction_percentage', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wallet_fixed">Transaction Fee (ETB)</Label>
                                    <Input
                                        id="wallet_fixed"
                                        type="number"
                                        step="0.01"
                                        value={data.wallet_transaction_fixed_fee}
                                        onChange={(e) => setData('wallet_transaction_fixed_fee', parseFloat(e.target.value))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 items-center gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="image">Vehicle Icon/Image</Label>
                                    <Input
                                        id="image"
                                        type="file"
                                        onChange={(e) => setData('image', e.target.files ? e.target.files[0] : null)}
                                        accept="image/*"
                                    />
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {editingType ? 'Update Vehicle Type' : 'Create Vehicle Type'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
