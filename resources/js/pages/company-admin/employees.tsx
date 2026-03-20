import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Building2, Check, CheckCircle, Clock, Eye, RefreshCw, Trash2, Upload, User, UserPlus, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import SetupBanner from '@/components/company/setup-banner';
import { AddressAutocomplete } from '@/components/AddressAutocomplete';

interface CompanyEmployee {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    company: {
        id: number;
        name: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'left';
    requested_at: string;
    approved_at?: string;
    rejected_at?: string;
    left_at?: string;
    rejection_reason?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Dashboard',
        href: '/company-admin/dashboard',
    },
    {
        title: 'My Employees',
        href: '/company-admin/employees',
    },
];

export default function CompanyAdminEmployeesPage() {
    const { employees, company, stats, companySetup } = usePage<
        SharedData & {
            employees: CompanyEmployee[];
            company: {
                id: number;
                name: string;
                code: string;
            };
            stats: {
                total_employees: number;
                approved_employees: number;
                pending_requests: number;
                rejected_requests: number;
            };
            companySetup: {
                is_complete: boolean;
                progress: number;
                missing_fields: string[];
            };
        }
    >().props;

    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [isBulkUploadDialogOpen, setIsBulkUploadDialogOpen] = useState(false);
    const [isDeleteEmployeeDialogOpen, setIsDeleteEmployeeDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [isAddEmployeeDialogOpen, setIsAddEmployeeDialogOpen] = useState(false);
    const [addEmployeeStep, setAddEmployeeStep] = useState(1);
    const [newEmployee, setNewEmployee] = useState({
        phone: '',
        name: '',
        email: '',
        password: '',
        home_address: '',
        home_lat: null as number | null,
        home_lng: null as number | null,
    });
    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const [userExists, setUserExists] = useState<boolean | null>(null);
    const [foundUser, setFoundUser] = useState<{
        name: string;
        email: string;
        isEmployee: boolean;
        employeeStatus?: string;
        home_address?: string;
        home_lat?: number;
        home_lng?: number;
    } | null>(null);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const handleApproveEmployee = async (employeeId: number) => {
        setIsLoading(true);

        try {
            await router.post(
                `/company-admin/employees/${employeeId}/approve`,
                {},
                {
                    onSuccess: () => {
                        toast.success('Employee request approved');
                        router.reload();
                    },
                    onError: () => {
                        toast.error('Failed to approve employee request');
                    },
                },
            );
        } catch (error) {
            toast.error('Failed to approve employee request');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRejectEmployee = async () => {
        if (!selectedEmployee) return;

        setIsLoading(true);

        try {
            await router.post(
                `/company-admin/employees/${selectedEmployee.id}/reject`,
                {
                    rejection_reason: rejectionReason,
                },
                {
                    onSuccess: () => {
                        toast.success('Employee request rejected');
                        setIsRejectDialogOpen(false);
                        setSelectedEmployee(null);
                        setRejectionReason('');
                        router.reload();
                    },
                    onError: () => {
                        toast.error('Failed to reject employee request');
                    },
                },
            );
        } catch (error) {
            toast.error('Failed to reject employee request');
        } finally {
            setIsLoading(false);
        }
    };

    const openRejectDialog = (employee: CompanyEmployee) => {
        setSelectedEmployee(employee);
        setRejectionReason('');
        setIsRejectDialogOpen(true);
    };

    const checkUserExists = async (phone: string) => {
        if (!phone) {
            setUserExists(null);
            setFoundUser(null);
            return;
        }

        setIsCheckingUser(true);
        try {
            const url = `/api/users/check-phone?phone=${encodeURIComponent(phone)}&company_id=${company.id}`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setUserExists(data.exists);
                if (data.exists) {
                    setFoundUser({
                        name: data.name,
                        email: data.email,
                        isEmployee: data.isEmployee,
                        employeeStatus: data.employeeStatus,
                        home_address: data.home_address,
                        home_lat: data.home_lat,
                        home_lng: data.home_lng,
                    });

                    // Smart Sync: Pre-fill address if found
                    if (data.home_address) {
                        setNewEmployee(prev => ({
                            ...prev,
                            home_address: data.home_address,
                            home_lat: data.home_lat,
                            home_lng: data.home_lng
                        }));
                    }
                } else {
                    setFoundUser(null);
                }
            } else {
                setUserExists(false);
                setFoundUser(null);
            }
        } catch (error) {
            setUserExists(false);
            setFoundUser(null);
        } finally {
            setIsCheckingUser(false);
        }
    };

    const handleAddEmployee = async () => {
        setIsLoading(true);

        try {
            await router.post('/company-admin/employees', newEmployee, {
                onSuccess: () => {
                    toast.success('Employee added successfully');
                    setIsAddEmployeeDialogOpen(false);
                    setNewEmployee({ 
                        phone: '', 
                        name: '', 
                        email: '', 
                        password: '',
                        home_address: '',
                        home_lat: null,
                        home_lng: null
                    });
                    setAddEmployeeStep(1);
                    setUserExists(null);
                    setFoundUser(null);
                    router.reload();
                },
                onError: (errors) => {
                    toast.error('Failed to add employee');
                    console.error('Add employee errors:', errors);
                },
            });
        } catch (error) {
            toast.error('Failed to add employee');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkUpload = async () => {
        if (!csvFile) {
            toast.error('Please select a CSV file');
            return;
        }

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append('csv_file', csvFile);

            await router.post('/company-admin/employees/bulk', formData, {
                forceFormData: true,
                onSuccess: () => {
                    toast.success('Bulk upload completed');
                    setIsBulkUploadDialogOpen(false);
                    setCsvFile(null);
                    router.reload();
                },
                onError: (errors) => {
                    toast.error('Failed to upload CSV file');
                    console.error('Bulk upload errors:', errors);
                },
            });
        } catch (error) {
            toast.error('Failed to upload CSV file');
        } finally {
            setIsLoading(false);
        }
    };

    const openDeleteDialog = (employee: CompanyEmployee) => {
        setSelectedEmployee(employee);
        setIsDeleteEmployeeDialogOpen(true);
    };

    const handleDeleteEmployee = async () => {
        if (!selectedEmployee) return;

        setIsLoading(true);

        try {
            await router.delete(`/company-admin/employees/${selectedEmployee.id}`, {
                onSuccess: () => {
                    toast.success('Employee removed from company successfully');
                    setIsDeleteEmployeeDialogOpen(false);
                    setSelectedEmployee(null);
                    router.reload();
                },
                onError: () => {
                    toast.error('Failed to remove employee');
                },
            });
        } catch (error) {
            toast.error('Failed to remove employee');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
                    </Badge>
                );
            case 'left':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Left
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredEmployees = employees.filter(
        (employee) =>
            employee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.user.phone.includes(searchTerm),
    );

    const pendingEmployees = filteredEmployees.filter((emp) => emp.status === 'pending');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Employees" />

            <div className="space-y-6">
                <SetupBanner setupStatus={companySetup} />

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Employees</h1>
                        <p className="text-muted-foreground">Manage employees for {company.name}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                                setIsLoading(true);
                                router.reload({
                                    only: ['employees', 'stats'],
                                    onFinish: () => setIsLoading(false),
                                });
                            }}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                        <Button 
                            onClick={() => setIsAddEmployeeDialogOpen(true)} 
                            className="flex items-center gap-2"
                            disabled={!companySetup.is_complete}
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Employee
                        </Button>
                        <Button 
                            onClick={() => setIsBulkUploadDialogOpen(true)} 
                            variant="outline" 
                            className="flex items-center gap-2"
                            disabled={!companySetup.is_complete}
                        >
                            <Upload className="h-4 w-4" />
                            Bulk Upload
                        </Button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <User className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved</CardTitle>
                            <CheckCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.approved_employees || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pending_requests || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                            <XCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.rejected_requests || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search */}
                <div className="flex items-center space-x-2">
                    <div className="relative max-w-sm flex-1">
                        <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {/* Pending Requests */}
                {pendingEmployees.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Pending Approval Requests
                            </CardTitle>
                            <CardDescription>Employee requests waiting for your approval</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <SimpleTable>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[250px]">Employee</TableHead>
                                        <TableHead className="w-[200px]">Company</TableHead>
                                        <TableHead className="w-[150px]">Requested</TableHead>
                                        <TableHead className="w-[120px]">Status</TableHead>
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="w-[250px]">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{employee.user.name}</div>
                                                    <div className="text-muted-foreground text-xs">{employee.user.email}</div>
                                                    <div className="text-muted-foreground text-xs">{employee.user.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="text-muted-foreground h-4 w-4" />
                                                    <span className="text-sm">{employee.company.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <span className="text-muted-foreground text-sm">
                                                    {new Date(employee.requested_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="w-[150px]">{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell className="w-[100px]">
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                        className="h-8"
                                                    >
                                                        <Link href={`/company-admin/employees/${employee.id}`}>
                                                            <Eye className="h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApproveEmployee(employee.id)}
                                                        disabled={isLoading}
                                                        className="h-8"
                                                    >
                                                        <Check className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => openRejectDialog(employee)}
                                                        disabled={isLoading}
                                                        className="h-8"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </SimpleTable>
                        </CardContent>
                    </Card>
                )}

                {/* All Employees */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Employee Requests</CardTitle>
                        <CardDescription>Complete list of all employee-company relationships</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SimpleTable>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Employee</TableHead>
                                    <TableHead className="w-[200px]">Company</TableHead>
                                    <TableHead className="w-[200px]">Requested</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[150px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                                            No employees found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="w-[250px]">
                                                <div className="space-y-1">
                                                    <div className="text-sm font-medium">{employee.user.name}</div>
                                                    <div className="text-muted-foreground text-xs">{employee.user.email}</div>
                                                    <div className="text-muted-foreground text-xs">{employee.user.phone}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="text-muted-foreground h-4 w-4" />
                                                    <span className="text-sm">{employee.company.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="space-y-1">
                                                    <div className="text-muted-foreground text-sm">
                                                        {new Date(employee.requested_at).toLocaleDateString()}
                                                    </div>
                                                    {employee.approved_at && (
                                                        <div className="text-xs text-green-600">
                                                            Approved: {new Date(employee.approved_at).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {employee.rejected_at && (
                                                        <div className="text-xs text-red-600">
                                                            Rejected: {new Date(employee.rejected_at).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell className="w-[150px]">
                                                {employee.status === 'pending' && (
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApproveEmployee(employee.id)}
                                                            disabled={isLoading}
                                                            className="h-8"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => openRejectDialog(employee)}
                                                            disabled={isLoading}
                                                            className="h-8"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )}
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        asChild
                                                        className="h-8"
                                                    >
                                                        <Link href={`/company-admin/employees/${employee.id}`}>
                                                            <Eye className="h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                    {employee.status === 'approved' && (
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => openDeleteDialog(employee)}
                                                            disabled={isLoading}
                                                            className="h-8"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                </div>
                                                {employee.status === 'rejected' && employee.rejection_reason && (
                                                    <div className="text-muted-foreground max-w-xs text-xs">Reason: {employee.rejection_reason}</div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </SimpleTable>
                    </CardContent>
                </Card>

                {/* Reject Dialog */}
                <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Reject Employee Request</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to reject this employee request? You can provide a reason for rejection.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="rejection_reason">Rejection Reason (Optional)</Label>
                                <Textarea
                                    id="rejection_reason"
                                    placeholder="Enter reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRejectEmployee} disabled={isLoading}>
                                {isLoading ? 'Rejecting...' : 'Reject Request'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Add Employee Dialog (Multi-step) */}
                <Dialog 
                    open={isAddEmployeeDialogOpen} 
                    onOpenChange={(open) => {
                        setIsAddEmployeeDialogOpen(open);
                        if (!open) {
                            setAddEmployeeStep(1);
                            setNewEmployee({ phone: '', name: '', email: '', password: '', home_address: '', home_lat: null, home_lng: null });
                            setUserExists(null);
                            setFoundUser(null);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Add New Employee</DialogTitle>
                            <DialogDescription>
                                {addEmployeeStep === 1 
                                    ? "Identify the employee and enter their details." 
                                    : "Set the employee's home address for ride group pickups."}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Progress Stepper */}
                        <div className="mb-4 flex items-center justify-center gap-2">
                            <div className={`h-2 w-16 rounded-full ${addEmployeeStep === 1 ? 'bg-primary' : 'bg-muted'}`} />
                            <div className={`h-2 w-16 rounded-full ${addEmployeeStep === 2 ? 'bg-primary' : 'bg-muted'}`} />
                        </div>

                        {addEmployeeStep === 1 ? (
                            <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        placeholder="Enter employee phone number"
                                        value={newEmployee.phone}
                                        onChange={(e) => {
                                            const phone = e.target.value;
                                            setNewEmployee({ ...newEmployee, phone });
                                            // Check if user exists after a short delay
                                            const timer = setTimeout(() => checkUserExists(phone), 500);
                                            return () => clearTimeout(timer);
                                        }}
                                        required
                                    />
                                    {isCheckingUser && <p className="text-muted-foreground text-xs animate-pulse">Checking if user exists...</p>}
                                    
                                    {userExists === true && foundUser && (
                                        <div className={`rounded-md p-3 ${foundUser.isEmployee ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                            <p className={`text-sm font-semibold ${foundUser.isEmployee ? 'text-red-800' : 'text-green-800'}`}>
                                                {foundUser.isEmployee ? '⚠ Already an Employee' : '✓ User Found: ' + foundUser.name}
                                            </p>
                                            <p className={`mt-1 text-xs ${foundUser.isEmployee ? 'text-red-600' : 'text-green-600'}`}>
                                                {foundUser.isEmployee 
                                                    ? `${foundUser.name} is already an employee of this company (Status: ${foundUser.employeeStatus})`
                                                    : `${foundUser.email || 'This user'} will be linked to your company.`}
                                            </p>
                                            {foundUser.home_address && (
                                                <p className="mt-2 text-[10px] text-green-700 font-medium">
                                                    ✨ Smart Sync: Home address found and pre-filled.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {userExists === false && (
                                        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                                            <p className="text-sm font-semibold text-amber-800">New User Account</p>
                                            <p className="mt-1 text-xs text-amber-600">Please provide account details below.</p>
                                        </div>
                                    )}
                                </div>

                                {userExists === false && (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Full Name *</Label>
                                            <Input
                                                id="name"
                                                placeholder="Enter employee name"
                                                value={newEmployee.name}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email (Optional)</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="Enter employee email"
                                                value={newEmployee.email}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Password *</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                placeholder="Temporary password"
                                                value={newEmployee.password}
                                                onChange={(e) => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4 py-2">
                                <div className="grid gap-2">
                                    <Label>Home Address *</Label>
                                    <AddressAutocomplete
                                        placeholder="Search for employee's home address..."
                                        value={
                                            newEmployee.home_address
                                                ? {
                                                      address: newEmployee.home_address,
                                                      lat: newEmployee.home_lat || 0,
                                                      lng: newEmployee.home_lng || 0,
                                                  }
                                                : null
                                        }
                                        onChange={(val) => {
                                            if (!val) {
                                                setNewEmployee({
                                                    ...newEmployee,
                                                    home_address: '',
                                                    home_lat: null,
                                                    home_lng: null,
                                                });
                                                return;
                                            }
                                            setNewEmployee({
                                                ...newEmployee,
                                                home_address: val.address,
                                                home_lat: val.lat,
                                                home_lng: val.lng,
                                            });
                                        }}
                                    />
                                    <p className="text-muted-foreground text-[10px]">
                                        Drivers will use this address as the default pickup/drop-off point.
                                    </p>
                                </div>
                                {newEmployee.home_lat && (
                                    <div className="flex items-center gap-2 rounded-md bg-green-50 p-2 text-[10px] text-green-700 border border-green-100">
                                        <CheckCircle className="h-3 w-3" />
                                        Location pinpointed: {newEmployee.home_lat.toFixed(4)}, {newEmployee.home_lng?.toFixed(4)}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="mt-4 gap-2 sm:gap-0">
                            {addEmployeeStep === 1 ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsAddEmployeeDialogOpen(false)}>Cancel</Button>
                                    <Button 
                                        onClick={() => setAddEmployeeStep(2)}
                                        disabled={
                                            !newEmployee.phone || 
                                            isCheckingUser || 
                                            foundUser?.isEmployee === true ||
                                            (userExists === false && (!newEmployee.name || !newEmployee.password))
                                        }
                                    >
                                        Next: Home Address
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => setAddEmployeeStep(1)}>Back</Button>
                                    <Button 
                                        onClick={handleAddEmployee}
                                        disabled={isLoading || !newEmployee.home_address || !newEmployee.home_lat}
                                    >
                                        {isLoading ? 'Creating...' : 'Finish & Add Employee'}
                                    </Button>
                                </>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Bulk Upload Dialog */}
                <Dialog open={isBulkUploadDialogOpen} onOpenChange={setIsBulkUploadDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Bulk Upload Employees</DialogTitle>
                            <DialogDescription>
                                Upload a CSV file to add multiple employees at once. The CSV should have headers: phone, name, email, password.
                                Existing users will be added directly, new users will be created.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="csv_file">CSV File</Label>
                                <Input id="csv_file" type="file" accept=".csv,.txt" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
                                <div className="flex items-center gap-2">
                                    <p className="text-muted-foreground text-sm">CSV format: phone, name, email, password</p>
                                    <a href="/sample-employees.csv" download className="text-sm text-blue-600 hover:underline">
                                        Download sample CSV
                                    </a>
                                </div>
                            </div>
                            <div className="bg-muted rounded-md p-4">
                                <h4 className="mb-2 font-medium">CSV Format Example:</h4>
                                <pre className="text-muted-foreground text-sm">
                                    {`phone,name,email,password
+1234567890,John Doe,john@example.com,temp123
+1234567891,Jane Smith,jane@example.com,temp456`}
                                </pre>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsBulkUploadDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleBulkUpload} disabled={isLoading || !csvFile}>
                                {isLoading ? 'Uploading...' : 'Upload CSV'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Employee Dialog */}
                <Dialog open={isDeleteEmployeeDialogOpen} onOpenChange={setIsDeleteEmployeeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Remove Employee from Company</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to remove this employee from your company? This action will mark them as 'left' and they will no
                                longer be associated with your company.
                                {selectedEmployee && (
                                    <div className="bg-muted mt-2 rounded-md p-3">
                                        <p className="text-sm font-semibold">{selectedEmployee.user.name}</p>
                                        <p className="text-muted-foreground text-xs">{selectedEmployee.user.email}</p>
                                    </div>
                                )}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteEmployeeDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteEmployee} disabled={isLoading}>
                                {isLoading ? 'Removing...' : 'Remove Employee'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
