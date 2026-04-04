import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Building2, Car, CheckCircle, Clock, Users, XCircle } from 'lucide-react';
import SetupChecklist from '@/components/company/setup-checklist';
import SetupBanner from '@/components/company/setup-banner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Company Dashboard',
        href: '/company-admin/dashboard',
    },
];

export default function CompanyAdminDashboard() {
    const { company, stats, billing, companySetup } = usePage<
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
                ride_credits: {
                    remaining: number;
                    total_purchased: number;
                    pending_packages: number;
                };
            };
            companySetup: {
                is_complete: boolean;
                progress: number;
                steps: Array<{
                    id: string;
                    title: string;
                    description: string;
                    completed: boolean;
                }>;
                missing_fields: string[];
            };
            billing?: { labels: string[]; data: number[]; currency?: string };
        }
    >().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Company Dashboard" />

            <div className="space-y-6">
                <SetupBanner setupStatus={companySetup} />

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

                {/* Setup Checklist if incomplete */}
                {!companySetup.is_complete && (
                    <div className="max-w-2xl">
                        <SetupChecklist setupStatus={companySetup} />
                    </div>
                )}

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

                {/* Ride Credit Analysis */}
                <Card className="border-indigo-100 dark:border-indigo-900/30">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Ride Credit Analysis</CardTitle>
                                <CardDescription>Monitor your company's service credits and usage</CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                <Car className="mr-1 h-3 w-3" />
                                {stats?.ride_credits?.remaining || 0} Rides Left
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Overall Usage Efficiency</span>
                                    <span className="font-medium">
                                        {Math.round(((stats?.ride_credits?.total_purchased - stats?.ride_credits?.remaining) / (stats?.ride_credits?.total_purchased || 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    <div 
                                        className="h-full bg-indigo-500 transition-all" 
                                        style={{ width: `${Math.min(100, Math.max(0, ((stats?.ride_credits?.total_purchased - stats?.ride_credits?.remaining) / (stats?.ride_credits?.total_purchased || 1)) * 100))}%` }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Used {stats?.ride_credits?.total_purchased - stats?.ride_credits?.remaining} of {stats?.ride_credits?.total_purchased} total purchased rides
                                </p>
                            </div>

                            <div className="flex flex-col justify-center border-l pl-6 dark:border-neutral-800">
                                <span className="text-sm text-muted-foreground">Pending Purchases</span>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">{stats?.ride_credits?.pending_packages || 0}</span>
                                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded dark:bg-orange-950/30">
                                        Action required
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Packages awaiting payment verification</p>
                            </div>

                            <div className="flex flex-col justify-center border-l pl-6 dark:border-neutral-800">
                                <span className="text-sm text-muted-foreground">Estimated Run-time</span>
                                <div className="mt-1 flex items-baseline gap-2">
                                    <span className="text-2xl font-bold">
                                        {stats?.completed_rides > 0 
                                            ? Math.floor(stats?.ride_credits?.remaining / (stats.completed_rides / 30 || 1))
                                            : 'N/A'
                                        }
                                    </span>
                                    <span className="text-muted-foreground text-sm">Days</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 text-balance">Based on average daily consumption over 30 days</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
