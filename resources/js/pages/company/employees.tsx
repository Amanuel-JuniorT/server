import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import CompanyLayout from '@/layouts/company/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { CheckCircle, Clock, Users, XCircle } from 'lucide-react';
import { useState } from 'react';

interface CompanyEmployee {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
    status: 'pending' | 'approved' | 'rejected' | 'left';
    requested_at: string;
    approved_at?: string;
    rejected_at?: string;
}

interface Company {
    id: number;
    name: string;
    code: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Companies',
        href: '/companies',
    },
    {
        title: 'Company Employees',
        href: '#',
    },
];

function CompanyEmployeesContent({
    company,
    employees,
    stats,
}: {
    company: Company;
    employees: CompanyEmployee[];
    stats: {
        total_employees: number;
        approved_employees: number;
        pending_employees: number;
        rejected_employees: number;
    };
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'pending':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case 'rejected':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Rejected
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                    <p className="text-muted-foreground">Company Code: {company.code}</p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_employees}</div>
                        <p className="text-muted-foreground text-xs">All employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Approved</CardTitle>
                        <CheckCircle className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.approved_employees}</div>
                        <p className="text-muted-foreground text-xs">Active employees</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pending_employees}</div>
                        <p className="text-muted-foreground text-xs">Awaiting approval</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                        <XCircle className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.rejected_employees}</div>
                        <p className="text-muted-foreground text-xs">Rejected requests</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
                <div className="relative max-w-sm flex-1">
                    <Input placeholder="Search employees..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Employees Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Employees</CardTitle>
                    <CardDescription>All employees associated with {company.name}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <SimpleTable className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Name</TableHead>
                                    <TableHead className="w-[200px]">Email</TableHead>
                                    <TableHead className="w-[150px]">Phone</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[150px]">Requested At</TableHead>
                                    <TableHead className="w-[150px]">Approved At</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map((employee) => (
                                        <TableRow key={employee.id}>
                                            <TableCell className="w-[200px]">
                                                <div className="text-sm font-medium">{employee.user.name}</div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="text-sm">{employee.user.email}</div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <div className="text-sm">{employee.user.phone}</div>
                                            </TableCell>
                                            <TableCell className="w-[120px]">{getStatusBadge(employee.status)}</TableCell>
                                            <TableCell className="w-[150px]">
                                                <div className="text-muted-foreground text-sm">
                                                    {new Date(employee.requested_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <div className="text-muted-foreground text-sm">
                                                    {employee.approved_at ? new Date(employee.approved_at).toLocaleDateString() : '-'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                                            No employees found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </SimpleTable>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CompanyEmployeesPage() {
    const { company, employees, stats } = usePage<
        SharedData & {
            company: Company;
            employees: CompanyEmployee[];
            stats: {
                total_employees: number;
                approved_employees: number;
                pending_employees: number;
                rejected_employees: number;
            };
        }
    >().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Employees`} />

            <CompanyLayout companyId={company.id}>
                <CompanyEmployeesContent company={company} employees={employees} stats={stats} />
            </CompanyLayout>
        </AppLayout>
    );
}


