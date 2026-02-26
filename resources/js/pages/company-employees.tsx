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
import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Check, CheckCircle, Clock, User, UserMinus, X, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Company Employees',
        href: '/company-employees',
    },
];

export default function CompanyEmployeesPage() {
    const { employees, stats } = usePage<
        SharedData & {
            employees: CompanyEmployee[];
            stats: {
                total_employees: number;
                pending_requests: number;
                approved_employees: number;
                rejected_requests: number;
            };
        }
    >().props;

    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    const handleApproveEmployee = async (employeeId: number) => {
        setIsLoading(true);

        try {
            await router.post(
                `/company-employees/${employeeId}/approve`,
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
                `/company-employees/${selectedEmployee.id}/reject`,
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
                        <UserMinus className="h-3 w-3" />
                        Left
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const filteredEmployees =
        employees?.filter(
            (employee) =>
                employee.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.company.name.toLowerCase().includes(searchTerm.toLowerCase()),
        ) || [];

    const pendingEmployees = filteredEmployees.filter((emp) => emp.status === 'pending');
    const approvedEmployees = filteredEmployees.filter((emp) => emp.status === 'approved');
    const rejectedEmployees = filteredEmployees.filter((emp) => emp.status === 'rejected');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Employees Management" />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Company Employees</h1>
                        <p className="text-muted-foreground">Manage employee-company relationships and approvals</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
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
                            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.pending_requests || 0}</div>
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
                            <CardDescription>Employee requests waiting for approval</CardDescription>
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
                                            <TableCell className="w-[120px]">{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell className="w-[100px]">
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
                                    <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.map((employee) => (
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
                                        <TableCell className="w-[120px]">{getStatusBadge(employee.status)}</TableCell>
                                        <TableCell className="w-[120px]">
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
                                            {employee.status === 'rejected' && employee.rejection_reason && (
                                                <div className="text-muted-foreground max-w-xs text-xs">Reason: {employee.rejection_reason}</div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
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
                                <Label htmlFor="rejection-reason">Rejection Reason (Optional)</Label>
                                <Textarea
                                    id="rejection-reason"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="Enter reason for rejection..."
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
            </div>
        </AppLayout>
    );
}
