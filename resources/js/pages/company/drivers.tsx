import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import CompanyLayout from '@/layouts/company/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Car, CheckCircle, Mail, Phone, User, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Driver {
    id: number;
    name: string;
    email: string;
    phone: string;
    license_number: string;
    status: 'available' | 'on_ride' | 'unknown';
    approval_state: string;
    vehicle: {
        make: string;
        model: string;
        plate_number: string;
        color: string;
    } | null;
    contract: {
        id: number;
        contract_start_date: string;
        contract_end_date: string | null;
    };
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
        title: 'Company Drivers',
        href: '#',
    },
];

function CompanyDriversContent({
    company,
    drivers,
    stats,
}: {
    company: Company;
    drivers: Driver[];
    stats: {
        total_drivers: number;
        available_drivers: number;
        on_ride_drivers: number;
    };
}) {
    const [searchTerm, setSearchTerm] = useState('');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'available':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Available
                    </Badge>
                );
            case 'on_ride':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        On Ride
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Unknown
                    </Badge>
                );
        }
    };

    const filteredDrivers = drivers.filter(
        (driver) =>
            driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.phone.includes(searchTerm) ||
            driver.license_number.toLowerCase().includes(searchTerm.toLowerCase()),
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_drivers}</div>
                        <p className="text-muted-foreground text-xs">Assigned drivers</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <CheckCircle className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.available_drivers}</div>
                        <p className="text-muted-foreground text-xs">Ready for rides</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">On Ride</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.on_ride_drivers}</div>
                        <p className="text-muted-foreground text-xs">Currently on ride</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex items-center space-x-2">
                <div className="relative max-w-sm flex-1">
                    <Input placeholder="Search drivers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            {/* Drivers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Assigned Drivers</CardTitle>
                    <CardDescription>Drivers actively contracted with {company.name}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <SimpleTable className="min-w-[1200px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Driver</TableHead>
                                    <TableHead className="w-[200px]">Contact</TableHead>
                                    <TableHead className="w-[150px]">License</TableHead>
                                    <TableHead className="w-[200px]">Vehicle</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[200px]">Contract Period</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredDrivers.length > 0 ? (
                                    filteredDrivers.map((driver) => (
                                        <TableRow key={driver.id}>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center space-x-2">
                                                    <User className="text-muted-foreground h-4 w-4" />
                                                    <div>
                                                        <div className="text-sm font-medium">{driver.name}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="space-y-1">
                                                    <div className="flex items-center text-sm">
                                                        <Mail className="text-muted-foreground mr-2 h-3 w-3" />
                                                        <span>{driver.email}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm">
                                                        <Phone className="text-muted-foreground mr-2 h-3 w-3" />
                                                        <span>{driver.phone}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <span className="font-mono text-sm">{driver.license_number}</span>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                {driver.vehicle ? (
                                                    <div className="text-sm">
                                                        <div className="font-medium">
                                                            {driver.vehicle.make} {driver.vehicle.model}
                                                        </div>
                                                        <div className="text-muted-foreground">
                                                            {driver.vehicle.plate_number} • {driver.vehicle.color}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No vehicle</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="w-[120px]">{getStatusBadge(driver.status)}</TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="text-sm">
                                                    <div>Start: {new Date(driver.contract.contract_start_date).toLocaleDateString()}</div>
                                                    {driver.contract.contract_end_date && (
                                                        <div className="text-muted-foreground">
                                                            End: {new Date(driver.contract.contract_end_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-muted-foreground py-8 text-center">
                                            No drivers found
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

export default function CompanyDriversPage() {
    const { company, drivers, stats } = usePage<
        SharedData & {
            company: Company;
            drivers: Driver[];
            stats: {
                total_drivers: number;
                available_drivers: number;
                on_ride_drivers: number;
            };
        }
    >().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Drivers`} />

            <CompanyLayout companyId={company.id}>
                <CompanyDriversContent company={company} drivers={drivers} stats={stats} />
            </CompanyLayout>
        </AppLayout>
    );
}


