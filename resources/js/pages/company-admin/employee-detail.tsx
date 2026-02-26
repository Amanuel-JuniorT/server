import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { Building2, Calendar, CheckCircle, Clock, Mail, Map, MapPin, Phone, User, XCircle, ArrowLeft } from 'lucide-react';
import LocationPickerMap from '@/components/LocationPickerMap';

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
    home_address?: string;
    home_lat?: number;
    home_lng?: number;
}

export default function EmployeeDetailPage() {
    const { employee, company, stats } = usePage<
        SharedData & {
            employee: CompanyEmployee;
            company: {
                id: number;
                name: string;
            };
            stats: {
                total_rides: number;
                completed_rides: number;
                cancelled_rides: number;
            };
        }
    >().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Company Dashboard',
            href: '/company-admin/dashboard',
        },
        {
            title: 'My Employees',
            href: '/company-admin/employees',
        },
        {
            title: 'Employee Detail',
            href: `/company-admin/employees/${employee.id}`,
        },
    ];

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
                    <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-100">
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Employee - ${employee.user.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/company-admin/employees">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{employee.user.name}</h1>
                            <p className="text-muted-foreground">Employee record for {company.name}</p>
                        </div>
                    </div>
                    {getStatusBadge(employee.status)}
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Employee Personal Info */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Contact Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 rounded-full p-2">
                                    <User className="text-primary h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Full Name</p>
                                    <p className="text-sm font-medium">{employee.user.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 rounded-full p-2">
                                    <Mail className="text-primary h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Email Address</p>
                                    <p className="text-sm font-medium">{employee.user.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="bg-primary/10 rounded-full p-2">
                                    <Phone className="text-primary h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Phone Number</p>
                                    <p className="text-sm font-medium">{employee.user.phone}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ride Statistics */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Ride Statistics</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold">{stats.total_rides}</p>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Total Rides</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-green-600">{stats.completed_rides}</p>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Completed</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-red-600">{stats.cancelled_rides}</p>
                                    <p className="text-muted-foreground text-xs uppercase tracking-wider">Cancelled</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Important Dates */}
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle className="text-lg">Record History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Requested At</p>
                                    <p className="text-sm font-medium">
                                        {new Date(employee.requested_at).toLocaleDateString()} {new Date(employee.requested_at).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                            {employee.approved_at && (
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Approved At</p>
                                        <p className="text-sm font-medium">
                                            {new Date(employee.approved_at).toLocaleDateString()} {new Date(employee.approved_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {employee.left_at && (
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-4 w-4 text-red-600" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Record Ended</p>
                                        <p className="text-sm font-medium">
                                            {new Date(employee.left_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Home Location */}
                    <Card className="md:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Home Location
                            </CardTitle>
                            <CardDescription>
                                {employee.home_address 
                                    ? `This employee's home address is set to: ${employee.home_address}`
                                    : "This employee hasn't set their home address yet."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {employee.home_address && employee.home_lat && employee.home_lng ? (
                                <div className="h-[400px] w-full overflow-hidden rounded-md border">
                                    <LocationPickerMap
                                        lat={employee.home_lat}
                                        lng={employee.home_lng}
                                        readOnly={true}
                                    />
                                </div>
                            ) : (
                                <div className="bg-muted flex h-[200px] items-center justify-center rounded-md border border-dashed text-center p-8">
                                    <div className="space-y-2">
                                        <Map className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground text-sm">No home location data available for this employee.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
