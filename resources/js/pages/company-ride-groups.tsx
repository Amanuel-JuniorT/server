import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Loader2, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RideGroup {
    id: number;
    group_name: string;
    group_type: 'to_office' | 'from_office';
    pickup_address: string;
    destination_address: string;
    scheduled_time: string;
    max_capacity: number;
    status: 'active' | 'inactive';
    members?: Member[];
    assignments?: Assignment[];
}

interface Member {
    id: number;
    employee_id: number;
    employee?: { id: number; name: string; email: string };
}

interface Assignment {
    id: number;
    driver_id: number;
    start_date: string;
    end_date: string;
    status: string;
    driver?: { id: number; name: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Companies', href: '/companies' },
    { title: 'Ride Groups', href: '#' },
];

export default function CompanyRideGroupsPage({ companyId }: { companyId: number }) {
    const [groups, setGroups] = useState<RideGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        group_name: '',
        group_type: 'to_office' as 'to_office' | 'from_office',
        pickup_address: '',
        pickup_lat: '',
        pickup_lng: '',
        destination_address: '',
        destination_lat: '',
        destination_lng: '',
        scheduled_time: '07:00',
        max_capacity: 4,
    });

    useEffect(() => {
        fetchGroups();
    }, [companyId]);

    const fetchGroups = async () => {
        try {
            const res = await fetch(`/admin/company/${companyId}/ride-groups/list`);
            const data = await res.json();
            if (data.success) {
                setGroups(data.data);
            }
        } catch (error) {
            toast.error('Failed to load ride groups');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch(`/admin/company/${companyId}/ride-groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Ride group created successfully');
                setIsCreateOpen(false);
                fetchGroups();
                resetForm();
            } else {
                toast.error(data.message || 'Failed to create ride group');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (groupId: number) => {
        if (!confirm('Are you sure you want to delete this ride group?')) return;

        try {
            const res = await fetch(`/admin/company/${companyId}/ride-groups/${groupId}`, {
                method: 'DELETE',
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Ride group deleted');
                fetchGroups();
            } else {
                toast.error('Failed to delete ride group');
            }
        } catch (error) {
            toast.error('An error occurred');
        }
    };

    const resetForm = () => {
        setFormData({
            group_name: '',
            group_type: 'to_office',
            pickup_address: '',
            pickup_lat: '',
            pickup_lng: '',
            destination_address: '',
            destination_lat: '',
            destination_lng: '',
            scheduled_time: '07:00',
            max_capacity: 4,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Ride Groups" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ride Groups</h1>
                        <p className="text-muted-foreground">Manage recurring ride groups for company employees</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Ride Group
                        </Button>
                        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Create New Ride Group</DialogTitle>
                                <DialogDescription>Set up a recurring ride group for employees (max 4 people per group)</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="group_name">Group Name</Label>
                                        <Input
                                            id="group_name"
                                            value={formData.group_name}
                                            onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                                            placeholder="e.g., Morning Group A"
                                            required
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="group_type">Type</Label>
                                        <Select
                                            value={formData.group_type}
                                            onValueChange={(value: 'to_office' | 'from_office') => setFormData({ ...formData, group_type: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="to_office">To Office</SelectItem>
                                                <SelectItem value="from_office">From Office</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="pickup_address">Pickup Address</Label>
                                        <Input
                                            id="pickup_address"
                                            value={formData.pickup_address}
                                            onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                                            placeholder="Common pickup location"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="pickup_lat">Pickup Latitude</Label>
                                            <Input
                                                id="pickup_lat"
                                                type="number"
                                                step="0.0000001"
                                                value={formData.pickup_lat}
                                                onChange={(e) => setFormData({ ...formData, pickup_lat: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="pickup_lng">Pickup Longitude</Label>
                                            <Input
                                                id="pickup_lng"
                                                type="number"
                                                step="0.0000001"
                                                value={formData.pickup_lng}
                                                onChange={(e) => setFormData({ ...formData, pickup_lng: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="destination_address">Destination Address</Label>
                                        <Input
                                            id="destination_address"
                                            value={formData.destination_address}
                                            onChange={(e) => setFormData({ ...formData, destination_address: e.target.value })}
                                            placeholder="Office location"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="destination_lat">Destination Latitude</Label>
                                            <Input
                                                id="destination_lat"
                                                type="number"
                                                step="0.0000001"
                                                value={formData.destination_lat}
                                                onChange={(e) => setFormData({ ...formData, destination_lat: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="destination_lng">Destination Longitude</Label>
                                            <Input
                                                id="destination_lng"
                                                type="number"
                                                step="0.0000001"
                                                value={formData.destination_lng}
                                                onChange={(e) => setFormData({ ...formData, destination_lng: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="scheduled_time">Scheduled Time</Label>
                                            <Input
                                                id="scheduled_time"
                                                type="time"
                                                value={formData.scheduled_time}
                                                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="max_capacity">Max Capacity</Label>
                                            <Input
                                                id="max_capacity"
                                                type="number"
                                                min="1"
                                                max="4"
                                                value={formData.max_capacity}
                                                onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) })}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Create Group
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ride Groups</CardTitle>
                        <CardDescription>View and manage all ride groups for this company</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-muted-foreground py-8 text-center">No ride groups yet. Create one to get started.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Group Name</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Members</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groups.map((group) => (
                                        <TableRow key={group.id}>
                                            <TableCell className="font-medium">{group.group_name}</TableCell>
                                            <TableCell>
                                                <span className="capitalize">{group.group_type.replace('_', ' ')}</span>
                                            </TableCell>
                                            <TableCell>{group.scheduled_time}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    {group.members?.length || 0}/{group.max_capacity}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                                        group.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'
                                                    }`}
                                                >
                                                    {group.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => handleDelete(group.id)}>
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
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
