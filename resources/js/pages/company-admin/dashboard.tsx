import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Building2, Car, CheckCircle, Clock, Users, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Dashboard',
        href: '/company-admin/dashboard',
    },
];

export default function CompanyAdminDashboard() {
    const { company, stats, billing } = usePage<
        SharedData & {
            company: {
                id: number;
                name: string;
                code: string;
                description?: string;
                address?: string;
                phone?: string;
                email?: string;
            };
            stats: {
                total_employees: number;
                approved_employees: number;
                pending_requests: number;
                rejected_requests: number;
                total_rides: number;
                scheduled_rides: number;
                completed_rides: number;
            };
            billing?: { labels: string[]; data: number[]; currency?: string };
        }
    >().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Dashboard" />

            <div className="space-y-6">
                {/* Company Info Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
                        <p className="text-muted-foreground">Company Code: {company.code}</p>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Company Admin
                    </Badge>
                </div>

                {/* Billing Cost (Last 30 days) */}
                {billing && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Billing (Last 30 Days)</CardTitle>
                            <CardDescription>Total ride costs per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <MiniBarChart labels={billing.labels} data={billing.data} />
                        </CardContent>
                    </Card>
                )}

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_employees || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Approved Employees</CardTitle>
                            <CheckCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.approved_employees || 0}</div>
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
                            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                            <Car className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_rides || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Stats Row */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Scheduled Rides</CardTitle>
                            <Clock className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.scheduled_rides || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed Rides</CardTitle>
                            <CheckCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.completed_rides || 0}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Rejected Requests</CardTitle>
                            <XCircle className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.rejected_requests || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Company Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Information</CardTitle>
                        <CardDescription>Basic information about your company</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Company Name</label>
                                <p className="text-sm">{company.name}</p>
                            </div>
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Company Code</label>
                                <p className="font-mono text-sm">{company.code}</p>
                            </div>
                            {company.email && (
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Email</label>
                                    <p className="text-sm">{company.email}</p>
                                </div>
                            )}
                            {company.phone && (
                                <div>
                                    <label className="text-muted-foreground text-sm font-medium">Phone</label>
                                    <p className="text-sm">{company.phone}</p>
                                </div>
                            )}
                        </div>
                        {company.description && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Description</label>
                                <p className="text-sm">{company.description}</p>
                            </div>
                        )}
                        {company.address && (
                            <div>
                                <label className="text-muted-foreground text-sm font-medium">Address</label>
                                <p className="text-sm">{company.address}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function MiniBarChart({ labels, data }: { labels: string[]; data: number[] }) {
    const max = Math.max(1, ...data);
    const width = 720;
    const height = 180;
    const padding = 24;
    const barGap = 2;
    const n = data.length;
    const barWidth = Math.max(1, Math.floor((width - padding * 2 - barGap * (n - 1)) / n));
    const scaleY = (v: number) => height - padding - (v / max) * (height - padding * 2);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Axis */}
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#ddd" />
            {/* Bars */}
            {data.map((v, i) => {
                const x = padding + i * (barWidth + barGap);
                const y = scaleY(v);
                const h = height - padding - y;
                return <rect key={i} x={x} y={y} width={barWidth} height={Math.max(1, h)} fill="#4f46e5" rx={2} />;
            })}
        </svg>
    );
}
