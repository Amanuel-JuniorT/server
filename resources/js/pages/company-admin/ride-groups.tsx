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
import { Loader2, Pencil, Plus, Trash2, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RideGroup {
    id: number;
    group_name: string;
    group_type: 'to_office' | 'from_office';
    scheduled_time: string;
    start_date?: string;
    end_date?: string;
    max_capacity: number;
    status: 'active' | 'inactive';
    members?: any[];
}

interface Employee {
    id: number;
    user_id: number;
    name: string;
    email: string;
    home_address?: string;
    home_lat?: string;
    home_lng?: string;
}

interface EmployeeMember {
    employee_id: number;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
}

interface CompanyInfo {
    id: number;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/company-admin/dashboard' },
    { title: 'Ride Groups', href: '/company-admin/ride-groups' },
];

export default function CompanyAdminRideGroupsPage({ companyId }: { companyId: number }) {
    const [groups, setGroups] = useState<RideGroup[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);

    const [formData, setFormData] = useState({
        group_name: '',
        group_type: 'to_office' as 'to_office' | 'from_office',
        scheduled_time: '07:00',
        start_date: '',
        end_date: '',
        max_capacity: 4,
    });

    const [selectedEmployees, setSelectedEmployees] = useState<EmployeeMember[]>([]);

    useEffect(() => {
        fetchGroups();
        fetchEmployees();
        fetchCompanyInfo();
    }, [companyId]);

    const fetchGroups = async () => {
        try {
            const res = await fetch(`/company-admin/api/ride-groups`);

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setGroups(data.data);
            } else {
                toast.error(data.message || 'Failed to load ride groups');
            }
        } catch (error) {
            console.error('Error fetching ride groups:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to load ride groups');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch(`/company-admin/api/employees`);
            const data = await res.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchCompanyInfo = async () => {
        try {
            const res = await fetch(`/company-admin/api/company-info`);
            const data = await res.json();
            if (data.success) {
                setCompanyInfo(data.data);
            }
        } catch (error) {
            console.error('Error fetching company info:', error);
        }
    };

    const handleAddEmployee = (employeeId: number) => {
        const employee = employees.find((e) => e.id === employeeId);
        if (!employee) return;

        if (selectedEmployees.length >= formData.max_capacity) {
            toast.error(`Maximum capacity of ${formData.max_capacity} employees reached`);
            return;
        }

        if (selectedEmployees.some((e) => e.employee_id === employeeId)) {
            toast.error('Employee already added');
            return;
        }

        setSelectedEmployees([
            ...selectedEmployees,
            {
                employee_id: employeeId,
                name: employee.name,
                address: employee.home_address || '',
                latitude: employee.home_lat?.toString() || '',
                longitude: employee.home_lng?.toString() || '',
            },
        ]);
    };

    const handleRemoveEmployee = (employeeId: number) => {
        setSelectedEmployees(selectedEmployees.filter((e) => e.employee_id !== employeeId));
    };

    const handleEmployeeAddressChange = (employeeId: number, field: string, value: string) => {
        setSelectedEmployees(selectedEmployees.map((e) => (e.employee_id === employeeId ? { ...e, [field]: value } : e)));
    };

    const handleEdit = (group: RideGroup) => {
        setEditingGroupId(group.id);
        setFormData({
            group_name: group.group_name,
            group_type: group.group_type,
            scheduled_time: group.scheduled_time.substring(0, 5), // Ensure HH:MM format
            start_date: group.start_date || '', // Handle potentially missing dates for old records
            end_date: group.end_date || '',
            max_capacity: group.max_capacity,
        });

        // Map existing members to form format
        if (group.members) {
            const mappedMembers = group.members.map((m: any) => ({
                employee_id: m.employee_id,
                name: m.employee.user.name,
                address: m.custom_pickup_address,
                latitude: m.custom_pickup_lat.toString(),
                longitude: m.custom_pickup_lng.toString(),
            }));
            setSelectedEmployees(mappedMembers);
        } else {
            setSelectedEmployees([]);
        }

        setIsCreateOpen(true);
    };

    const handleCreateClick = () => {
        resetForm();
        setEditingGroupId(null);
        setIsCreateOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedEmployees.length === 0) {
            toast.error('Please add at least one employee to the group');
            return;
        }

        // Validate that all employees have addresses
        const missingAddresses = selectedEmployees.filter((e) => !e.address || !e.latitude || !e.longitude);
        if (missingAddresses.length > 0) {
            toast.error('Please provide address and coordinates for all employees');
            return;
        }

        setIsSubmitting(true);

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const url = editingGroupId ? `/company-admin/api/ride-groups/${editingGroupId}` : `/company-admin/api/ride-groups`;

            const method = editingGroupId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                },
                body: JSON.stringify({
                    ...formData,
                    // If To Office, group pickup is the first employee's address
                    pickup_address: formData.group_type === 'to_office' ? selectedEmployees[0].address : formData.pickup_address,
                    pickup_lat: formData.group_type === 'to_office' ? selectedEmployees[0].latitude : formData.pickup_lat,
                    pickup_lng: formData.group_type === 'to_office' ? selectedEmployees[0].longitude : formData.pickup_lng,

                    // If From Office, group destination is the last (or first) employee's home
                    destination_address: formData.group_type === 'from_office' ? selectedEmployees[0].address : formData.destination_address,
                    destination_lat: formData.group_type === 'from_office' ? selectedEmployees[0].latitude : formData.destination_lat,
                    destination_lng: formData.group_type === 'from_office' ? selectedEmployees[0].longitude : formData.destination_lng,

                    members: selectedEmployees,
                }),
            });

            if (!res.ok) {
                if (res.status === 419) {
                    toast.error('Session expired. Please refresh the page.');
                    return;
                }

                // Try to parse the error JSON to show validation errors
                try {
                    const errorData = await res.json();
                    if (errorData.errors) {
                        const errorMsg = Object.values(errorData.errors).flat().join(', ');
                        toast.error(errorMsg);
                        setIsSubmitting(false);
                        return;
                    }
                    if (errorData.message) {
                        toast.error(errorData.message);
                        setIsSubmitting(false);
                        return;
                    }
                } catch (e) {
                    // If JSON parsing fails, fall back to generic error
                }

                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                toast.success(editingGroupId ? 'Ride group updated successfully' : 'Ride group created successfully');
                setIsCreateOpen(false);
                fetchGroups();
                resetForm();
                setEditingGroupId(null);
            } else {
                const errorMsg = data.errors ? Object.values(data.errors).flat().join(', ') : data.message || 'Failed to save ride group';
                toast.error(errorMsg);
            }
        } catch (error) {
            console.error('Error saving ride group:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred while saving the ride group');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (groupId: number) => {
        if (!confirm('Are you sure you want to delete this ride group?')) return;

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch(`/company-admin/api/ride-groups/${groupId}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': csrfToken || '',
                },
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
                toast.success('Ride group deleted');
                fetchGroups();
            } else {
                toast.error(data.message || 'Failed to delete ride group');
            }
        } catch (error) {
            console.error('Error deleting ride group:', error);
            toast.error(error instanceof Error ? error.message : 'An error occurred while deleting the ride group');
        }
    };

    const resetForm = () => {
        setFormData({
            group_name: '',
            group_type: 'to_office',
            scheduled_time: '07:00',
            start_date: '',
            end_date: '',
            max_capacity: 4,
        });
        setSelectedEmployees([]);
        setEditingGroupId(null);
    };

    const availableEmployees = employees.filter((e) => !selectedEmployees.some((se) => se.employee_id === e.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Ride Groups" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Ride Groups</h1>
                        <p className="text-muted-foreground">Manage recurring ride groups for your employees</p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Button onClick={handleCreateClick}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Ride Group
                        </Button>
                        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingGroupId ? 'Edit Ride Group' : 'Create New Ride Group'}</DialogTitle>
                                <DialogDescription>
                                    {editingGroupId
                                        ? 'Update ride group details and members'
                                        : 'Set up a recurring ride group (max 4 employees per group)'}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-6">
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
                                                <SelectItem value="to_office">To Office (Morning)</SelectItem>
                                                <SelectItem value="from_office">From Office (Evening)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-muted-foreground text-sm">
                                            {formData.group_type === 'to_office'
                                                ? 'Office address will be used as destination'
                                                : 'Office address will be used as pickup point'}
                                        </p>
                                    </div>

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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="start_date">Start Date</Label>
                                            <Input
                                                id="start_date"
                                                type="date"
                                                value={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="end_date">End Date</Label>
                                            <Input
                                                id="end_date"
                                                type="date"
                                                value={formData.end_date}
                                                min={formData.start_date}
                                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <h3 className="mb-4 text-lg font-semibold">
                                            Add Employees ({selectedEmployees.length}/{formData.max_capacity})
                                        </h3>

                                        {selectedEmployees.length < formData.max_capacity && (
                                            <div className="mb-4">
                                                <Label>Select Employee</Label>
                                                <Select onValueChange={(value) => handleAddEmployee(parseInt(value))}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Choose an employee..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableEmployees.map((employee) => (
                                                            <SelectItem key={employee.id} value={employee.id.toString()}>
                                                                {employee.name} ({employee.email})
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {selectedEmployees.map((member) => (
                                                <Card key={member.employee_id}>
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-base">{member.name}</CardTitle>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveEmployee(member.employee_id)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="space-y-3">
                                                        <div>
                                                            <Label>
                                                                {formData.group_type === 'to_office'
                                                                    ? 'Home Address (Pickup)'
                                                                    : 'Home Address (Destination)'}
                                                            </Label>
                                                            <Input
                                                                value={member.address}
                                                                onChange={(e) =>
                                                                    handleEmployeeAddressChange(member.employee_id, 'address', e.target.value)
                                                                }
                                                                placeholder="Enter employee's home address"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <Label>Latitude</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.0000001"
                                                                    value={member.latitude}
                                                                    onChange={(e) =>
                                                                        handleEmployeeAddressChange(member.employee_id, 'latitude', e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Longitude</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.0000001"
                                                                    value={member.longitude}
                                                                    onChange={(e) =>
                                                                        handleEmployeeAddressChange(member.employee_id, 'longitude', e.target.value)
                                                                    }
                                                                    required
                                                                />
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>

                                        {selectedEmployees.length === 0 && (
                                            <div className="text-muted-foreground rounded-lg border-2 border-dashed py-8 text-center">
                                                No employees added yet. Select employees from the dropdown above.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting || selectedEmployees.length === 0}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {editingGroupId ? 'Update Group' : 'Create Group'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>My Ride Groups</CardTitle>
                        <CardDescription>View and manage all ride groups for your company</CardDescription>
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
                                        <TableHead>Date Range</TableHead>
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
                                            <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                                {group.start_date && group.end_date ? (
                                                    <>
                                                        {new Date(group.start_date).toLocaleDateString()} -{' '}
                                                        {new Date(group.end_date).toLocaleDateString()}
                                                    </>
                                                ) : (
                                                    'N/A'
                                                )}
                                            </TableCell>
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
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(group)} className="mr-2">
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
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
