import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import SetupBanner from '@/components/company/setup-banner';
import { Loader2, Pencil, Plus, Trash2, Users, X, Eye, BarChart3, List } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';
import RideGroupDetailView from '@/components/company/RideGroupDetailView';
import ReportsDashboard from '@/components/company/ReportsDashboard';
import { cn } from '@/lib/utils';

interface RideGroup {
    id: number;
    group_name: string;
    group_type: string;
    origin_type: 'office' | 'home' | 'custom';
    destination_type: 'office' | 'home' | 'custom';
    pickup_address: string;
    pickup_lat: string;
    pickup_lng: string;
    destination_address: string;
    destination_lat: string;
    destination_lng: string;
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
    dest_address?: string;
    dest_latitude?: string;
    dest_longitude?: string;
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
    const { companySetup } = usePage<SharedData & { 
        companySetup: { 
            is_complete: boolean; 
            progress: number; 
            missing_fields: string[] 
        } 
    }>().props;

    const [groups, setGroups] = useState<RideGroup[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
    const [selectedDetailGroupId, setSelectedDetailGroupId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'groups' | 'reports'>('groups');

    const [formData, setFormData] = useState({
        group_name: '',
        origin_type: 'home' as 'office' | 'home' | 'custom',
        destination_type: 'office' as 'office' | 'home' | 'custom',
        scheduled_time: '07:00',
        start_date: '',
        end_date: '',
        max_capacity: 4,
        pickup_address: '',
        pickup_lat: '',
        pickup_lng: '',
        destination_address: '',
        destination_lat: '',
        destination_lng: '',
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
                dest_address: '',
                dest_latitude: '',
                dest_longitude: '',
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
            origin_type: group.origin_type || (group.group_type === 'from_office' ? 'office' : 'home'),
            destination_type: group.destination_type || (group.group_type === 'to_office' ? 'office' : 'home'),
            scheduled_time: group.scheduled_time.substring(0, 5),
            start_date: group.start_date || '',
            end_date: group.end_date || '',
            max_capacity: group.max_capacity,
            pickup_address: group.pickup_address || '',
            pickup_lat: group.pickup_lat?.toString() || '',
            pickup_lng: group.pickup_lng?.toString() || '',
            destination_address: group.destination_address || '',
            destination_lat: group.destination_lat?.toString() || '',
            destination_lng: group.destination_lng?.toString() || '',
        });

        // Map existing members to form format
        if (group.members) {
            setSelectedEmployees(group.members.map((m: any) => ({
                employee_id: m.employee_id,
                name: m.employee.user.name,
                address: m.pickup_address || '',
                latitude: m.pickup_lat?.toString() || '',
                longitude: m.pickup_lng?.toString() || '',
                dest_address: m.destination_address || '',
                dest_latitude: m.destination_lat?.toString() || '',
                dest_longitude: m.destination_lng?.toString() || '',
            })));
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

        // Validate that all employees have addresses if types are 'home'
        if (formData.origin_type === 'home') {
            const missing = selectedEmployees.filter((e) => !e.address || !e.latitude || !e.longitude);
            if (missing.length > 0) {
                toast.error('Please provide pickup address for all employees');
                return;
            }
        }
        if (formData.destination_type === 'home') {
            const missing = selectedEmployees.filter((e) => !e.dest_address || !e.dest_latitude || !e.dest_longitude);
            if (missing.length > 0) {
                toast.error('Please provide destination address for all employees');
                return;
            }
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
                    // The backend now accepts origin_type and destination_type.
                    // We calculate the group-level pickup/destination for instances where they are fixed (Office or Custom)
                    pickup_address: formData.origin_type === 'office' ? (companyInfo?.address || '') : formData.pickup_address,
                    pickup_lat: formData.origin_type === 'office' ? (companyInfo?.latitude?.toString() || '') : formData.pickup_lat,
                    pickup_lng: formData.origin_type === 'office' ? (companyInfo?.longitude?.toString() || '') : formData.pickup_lng,

                    destination_address: formData.destination_type === 'office' ? (companyInfo?.address || '') : formData.destination_address,
                    destination_lat: formData.destination_type === 'office' ? (companyInfo?.latitude?.toString() || '') : formData.destination_lat,
                    destination_lng: formData.destination_type === 'office' ? (companyInfo?.longitude?.toString() || '') : formData.destination_lng,

                    members: selectedEmployees.map(m => ({
                        ...m,
                        // Ensure we send expected field names to the controller
                        dest_address: m.dest_address,
                        dest_latitude: m.dest_latitude,
                        dest_longitude: m.dest_longitude
                    })),
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
            origin_type: 'home',
            destination_type: 'office',
            scheduled_time: '07:00',
            start_date: '',
            end_date: '',
            max_capacity: 4,
            pickup_address: '',
            pickup_lat: '',
            pickup_lng: '',
            destination_address: '',
            destination_lat: '',
            destination_lng: '',
        });
        setSelectedEmployees([]);
        setEditingGroupId(null);
    };

    const availableEmployees = employees.filter((e) => !selectedEmployees.some((se) => se.employee_id === e.id));

    const dynamicBreadcrumbs = [...breadcrumbs];
    if (selectedDetailGroupId) {
        const selectedGroup = groups.find(g => g.id === selectedDetailGroupId);
        dynamicBreadcrumbs.push({ 
            title: selectedGroup?.group_name || 'Group Details', 
            href: '#' 
        });
    }

    return (
        <AppLayout breadcrumbs={dynamicBreadcrumbs}>
            <Head title="My Ride Groups" />
 
             <div className="space-y-6">
                <SetupBanner setupStatus={companySetup} />
                 <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Ride Groups</h1>
                        <p className="text-muted-foreground">Manage recurring ride groups and view performance reports</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Tab Toggle */}
                        <div className="inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={cn(
                                    'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                                    activeTab === 'groups'
                                        ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                        : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                                )}
                            >
                                <List className="mr-2 h-4 w-4" />
                                <span className="text-sm">Manage Groups</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('reports')}
                                className={cn(
                                    'flex items-center rounded-md px-3.5 py-1.5 transition-colors',
                                    activeTab === 'reports'
                                        ? 'bg-white shadow-xs dark:bg-neutral-700 dark:text-neutral-100'
                                        : 'text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-400 dark:hover:bg-neutral-700/60',
                                )}
                            >
                                <BarChart3 className="mr-2 h-4 w-4" />
                                <span className="text-sm">Reports</span>
                            </button>
                        </div>
                        
                        {activeTab === 'groups' && (
                            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <Button onClick={handleCreateClick} disabled={!companySetup.is_complete}>
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>From</Label>
                                            <Select
                                                value={formData.origin_type}
                                                onValueChange={(value: 'office' | 'home' | 'custom') => setFormData({ ...formData, origin_type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="office">Office ({companyInfo?.name})</SelectItem>
                                                    <SelectItem value="home">Employee Home (Multiple)</SelectItem>
                                                    <SelectItem value="custom">Custom Location</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label>To</Label>
                                            <Select
                                                value={formData.destination_type}
                                                onValueChange={(value: 'office' | 'home' | 'custom') => setFormData({ ...formData, destination_type: value })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="office">Office ({companyInfo?.name})</SelectItem>
                                                    <SelectItem value="home">Employee Home (Multiple)</SelectItem>
                                                    <SelectItem value="custom">Custom Location</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {formData.origin_type === 'custom' && (
                                        <div className="grid gap-2">
                                            <Label>Global Pickup Point (Origin)</Label>
                                            <AddressAutocomplete
                                                value={{
                                                    address: formData.pickup_address,
                                                    lat: parseFloat(formData.pickup_lat) || 0,
                                                    lng: parseFloat(formData.pickup_lng) || 0
                                                }}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    pickup_address: val?.address || '',
                                                    pickup_lat: val?.lat.toString() || '',
                                                    pickup_lng: val?.lng.toString() || ''
                                                })}
                                            />
                                        </div>
                                    )}

                                    {formData.destination_type === 'custom' && (
                                        <div className="grid gap-2">
                                            <Label>Global Destination Point</Label>
                                            <AddressAutocomplete
                                                value={{
                                                    address: formData.destination_address,
                                                    lat: parseFloat(formData.destination_lat) || 0,
                                                    lng: parseFloat(formData.destination_lng) || 0
                                                }}
                                                onChange={(val) => setFormData({
                                                    ...formData,
                                                    destination_address: val?.address || '',
                                                    destination_lat: val?.lat.toString() || '',
                                                    destination_lng: val?.lng.toString() || ''
                                                })}
                                            />
                                        </div>
                                    )}

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
                                                    <CardContent className="space-y-4">
                                                        {formData.origin_type === 'home' && (
                                                            <div className="grid gap-2">
                                                                <Label>Pickup Point (Home)</Label>
                                                                <AddressAutocomplete
                                                                    value={{
                                                                        address: member.address,
                                                                        lat: parseFloat(member.latitude) || 0,
                                                                        lng: parseFloat(member.longitude) || 0
                                                                    }}
                                                                    onChange={(val) => {
                                                                        handleEmployeeAddressChange(member.employee_id, 'address', val?.address || '');
                                                                        handleEmployeeAddressChange(member.employee_id, 'latitude', val?.lat.toString() || '');
                                                                        handleEmployeeAddressChange(member.employee_id, 'longitude', val?.lng.toString() || '');
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {formData.destination_type === 'home' && (
                                                            <div className="grid gap-2">
                                                                <Label>Drop-off Point (Home)</Label>
                                                                <AddressAutocomplete
                                                                    value={{
                                                                        address: member.dest_address || '',
                                                                        lat: parseFloat(member.dest_latitude || '') || 0,
                                                                        lng: parseFloat(member.dest_longitude || '') || 0
                                                                    }}
                                                                    onChange={(val) => {
                                                                        handleEmployeeAddressChange(member.employee_id, 'dest_address', val?.address || '');
                                                                        handleEmployeeAddressChange(member.employee_id, 'dest_latitude', val?.lat.toString() || '');
                                                                        handleEmployeeAddressChange(member.employee_id, 'dest_longitude', val?.lng.toString() || '');
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {formData.origin_type !== 'home' && formData.destination_type !== 'home' && (
                                                            <div className="text-sm text-muted-foreground flex items-center justify-center py-2 h-10 border rounded bg-muted/30">
                                                                No individual addresses needed for this route type.
                                                            </div>
                                                        )}
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
                    )}
                    </div>
                </div>

                {selectedDetailGroupId ? (
                    <RideGroupDetailView 
                        groupId={selectedDetailGroupId} 
                        companyId={companyId} 
                        onBack={() => setSelectedDetailGroupId(null)} 
                    />
                ) : activeTab === 'groups' ? (
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
                                                <div className="flex flex-col text-xs space-y-1">
                                                    <span className="font-medium capitalize">{group.origin_type} → {group.destination_type}</span>
                                                    <span className="text-muted-foreground truncate max-w-[150px]">{group.pickup_address}</span>
                                                </div>
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
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => setSelectedDetailGroupId(group.id)} 
                                                    className="mr-1"
                                                    title="View Details"
                                                >
                                                    <Eye className="h-4 w-4 text-primary" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleEdit(group)} 
                                                    className="mr-1"
                                                    disabled={!companySetup.is_complete}
                                                    title="Edit"
                                                >
                                                    <Pencil className="h-4 w-4 text-blue-500" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={() => handleDelete(group.id)}
                                                    disabled={!companySetup.is_complete}
                                                    title="Delete"
                                                >
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
                ) : (
                    <ReportsDashboard companyId={companyId} />
                )}
            </div>
        </AppLayout>
    );
}
