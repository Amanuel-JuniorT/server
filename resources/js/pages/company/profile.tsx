import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import CompanyLayout from '@/layouts/company/layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Car, CheckCircle, Clock, Mail, MapPin, Phone, Users, XCircle } from 'lucide-react';

interface Company {
    id: number;
    name: string;
    code: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
    default_pickup_address?: string;
    employees_count?: number;
    rides_count?: number;
    driver_contracts_count?: number;
    created_at: string;
    updated_at: string;
}

interface CompanyRide {
    id: number;
    employee?: {
        id: number;
        name: string;
    };
    driver?: {
        user?: {
            name: string;
        };
    };
    pickup_address: string;
    destination_address: string;
    status: string;
    price?: number;
    created_at: string;
}

interface Driver {
    id: number;
    name: string;
    status: string;
    license_number: string;
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
        title: 'Company Profile',
        href: '#',
    },
];

function CompanyProfileContent({
    company,
    stats,
    recentRides,
    activeDrivers,
}: {
    company: Company;
    stats: {
        total_employees: number;
        approved_employees: number;
        pending_employees: number;
        total_rides: number;
        completed_rides: number;
        in_progress_rides: number;
        requested_rides: number;
        total_drivers: number;
    };
    recentRides: CompanyRide[];
    activeDrivers: Driver[];
}) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed':
                return (
                    <Badge variant="default" className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Completed
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        In Progress
                    </Badge>
                );
            case 'requested':
                return (
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Requested
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getDriverStatusBadge = (status: string) => {
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
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                    <p className="text-muted-foreground">Company Code: {company.code}</p>
                </div>
                <Badge variant={company.is_active ? 'default' : 'secondary'} className="text-sm">
                    {company.is_active ? 'Active' : 'Inactive'}
                </Badge>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                        <Users className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
                        <p className="text-muted-foreground text-xs">
                            {stats?.approved_employees || 0} approved, {stats?.pending_employees || 0} pending
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_rides || 0}</div>
                        <p className="text-muted-foreground text-xs">
                            {stats?.completed_rides || 0} completed, {stats?.in_progress_rides || 0} in progress
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Drivers</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_drivers || 0}</div>
                        <p className="text-muted-foreground text-xs">Active contracts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Rides</CardTitle>
                        <Clock className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.requested_rides || 0}</div>
                        <p className="text-muted-foreground text-xs">Awaiting assignment</p>
                    </CardContent>
                </Card>
            </div>

            {/* Company Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                    <CardDescription>Basic company details and contact information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Company Name</label>
                            <p className="mt-1 text-sm font-medium">{company.name}</p>
                        </div>
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Company Code</label>
                            <p className="mt-1">
                                <Badge variant="outline">{company.code}</Badge>
                            </p>
                        </div>
                        {company.description && (
                            <div className="md:col-span-2">
                                <label className="text-muted-foreground text-sm font-medium">Description</label>
                                <p className="mt-1 text-sm">{company.description}</p>
                            </div>
                        )}
                        {company.email && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Email</label>
                                <div className="mt-1 flex items-center text-sm">
                                    <Mail className="text-muted-foreground mr-2 h-4 w-4" />
                                    <span>{company.email}</span>
                                </div>
                            </div>
                        )}
                        {company.phone && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Phone</label>
                                <div className="mt-1 flex items-center text-sm">
                                    <Phone className="text-muted-foreground mr-2 h-4 w-4" />
                                    <span>{company.phone}</span>
                                </div>
                            </div>
                        )}
                        {company.address && (
                            <div className="md:col-span-2">
                                <label className="text-muted-foreground text-sm font-medium">Address</label>
                                <div className="mt-1 flex items-start text-sm">
                                    <MapPin className="text-muted-foreground mt-0.5 mr-2 h-4 w-4 flex-shrink-0" />
                                    <span>{company.address}</span>
                                </div>
                            </div>
                        )}
                        {company.default_pickup_address && (
                            <div className="md:col-span-2">
                                <label className="text-muted-foreground text-sm font-medium">Default Pickup Address</label>
                                <div className="mt-1 flex items-start text-sm">
                                    <MapPin className="text-muted-foreground mt-0.5 mr-2 h-4 w-4 flex-shrink-0" />
                                    <span>{company.default_pickup_address}</span>
                                </div>
                            </div>
                        )}
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Created At</label>
                            <p className="mt-1 text-sm">{new Date(company.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="text-muted-foreground text-sm font-medium">Last Updated</label>
                            <p className="mt-1 text-sm">{new Date(company.updated_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Drivers */}
            <Card>
                <CardHeader>
                    <CardTitle>Assigned Drivers</CardTitle>
                    <CardDescription>Drivers currently assigned to this company</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <SimpleTable className="min-w-[600px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">Driver Name</TableHead>
                                    <TableHead className="w-[150px]">License Number</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {activeDrivers && activeDrivers.length > 0 ? (
                                    activeDrivers.map((driver) => (
                                        <TableRow key={driver.id}>
                                            <TableCell className="w-[200px]">
                                                <div className="text-sm font-medium">{driver.name}</div>
                                            </TableCell>
                                            <TableCell className="w-[150px]">
                                                <span className="font-mono text-sm">{driver.license_number}</span>
                                            </TableCell>
                                            <TableCell className="w-[120px]">{getDriverStatusBadge(driver.status)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-muted-foreground py-8 text-center">
                                            No drivers assigned to this company
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </SimpleTable>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Rides */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Rides</CardTitle>
                    <CardDescription>Last 10 rides for this company</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <SimpleTable className="min-w-[800px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[150px]">Employee</TableHead>
                                    <TableHead className="w-[200px]">Pickup</TableHead>
                                    <TableHead className="w-[200px]">Destination</TableHead>
                                    <TableHead className="w-[120px]">Driver</TableHead>
                                    <TableHead className="w-[100px]">Price</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[120px]">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentRides && recentRides.length > 0 ? (
                                    recentRides.map((ride) => (
                                        <TableRow key={ride.id}>
                                            <TableCell className="w-[150px]">
                                                <div className="text-sm">{ride.employee?.name || 'N/A'}</div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center text-sm">
                                                    <MapPin className="text-muted-foreground mr-1 h-3 w-3" />
                                                    <span className="truncate">{ride.pickup_address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[200px]">
                                                <div className="flex items-center text-sm">
                                                    <MapPin className="text-muted-foreground mr-1 h-3 w-3" />
                                                    <span className="truncate">{ride.destination_address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="w-[120px]">
                                                <div className="text-sm">{ride.driver?.user?.name || 'Not assigned'}</div>
                                            </TableCell>
                                            <TableCell className="w-[100px]">
                                                {ride.price ? (
                                                    <span className="text-sm font-medium">${ride.price}</span>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="w-[120px]">{getStatusBadge(ride.status)}</TableCell>
                                            <TableCell className="w-[120px]">
                                                <span className="text-muted-foreground text-sm">
                                                    {new Date(ride.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-muted-foreground py-8 text-center">
                                            No rides found for this company
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

export default function CompanyProfilePage() {
    const { company, stats, recentRides, activeDrivers } = usePage<
        SharedData & {
            company: Company;
            stats: {
                total_employees: number;
                approved_employees: number;
                pending_employees: number;
                total_rides: number;
                completed_rides: number;
                in_progress_rides: number;
                requested_rides: number;
                total_drivers: number;
            };
            recentRides: CompanyRide[];
            activeDrivers: Driver[];
        }
    >().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${company.name} - Company Profile`} />

            <CompanyLayout companyId={company.id}>
                <CompanyProfileContent company={company} stats={stats} recentRides={recentRides} activeDrivers={activeDrivers} />
            </CompanyLayout>
        </AppLayout>
    );
}
