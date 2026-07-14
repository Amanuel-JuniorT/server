import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { Car, CreditCard, DollarSign, Hash, Percent, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Summary {
    total_rides: number;
    total_revenue: number;
    total_income: number;
    avg_commission: number;
}

interface IncomePoint {
    date: string;
    income: number;
    revenue: number;
    rides: number;
}

interface VehicleTypeRow {
    vehicle_type: string;
    commission_percentage: number;
    rides: number;
    revenue: number;
    income: number;
}

interface DetailRow {
    payment_id: number;
    ride_id: number;
    vehicle_type: string;
    commission_percentage: number;
    fare: number;
    system_income: number;
    payment_method: string;
    paid_at: string;
    passenger_name: string;
}

interface Filters {
    period: string;
    start_date: string | null;
    end_date: string | null;
}

interface SystemIncomeProps {
    summary: Summary;
    incomeOverTime: IncomePoint[];
    byVehicleType: VehicleTypeRow[];
    details: DetailRow[];
    filters: Filters;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'System Income', href: '/system-income' },
];

const PERIODS = [
    { value: 'today',  label: 'Today' },
    { value: 'week',   label: 'This Week' },
    { value: 'month',  label: 'This Month' },
    { value: 'year',   label: 'This Year' },
    { value: 'custom', label: 'Custom Range' },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number | string) {
    return Number(n ?? 0).toLocaleString('en-ET', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function methodBadge(method: string) {
    switch (method) {
        case 'cash':
            return <Badge className="border-yellow-200 bg-yellow-50 text-yellow-700">Cash</Badge>;
        case 'wallet':
            return <Badge className="border-blue-200 bg-blue-50 text-blue-700">Wallet</Badge>;
        default:
            return (
                <Badge variant="outline" className="capitalize">
                    {method ?? 'N/A'}
                </Badge>
            );
    }
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function SystemIncomePage() {
    const { summary, incomeOverTime, byVehicleType, details, filters } =
        usePage<SystemIncomeProps>().props;

    const [period, setPeriod]         = useState(filters.period ?? 'month');
    const [startDate, setStartDate]   = useState(filters.start_date ?? '');
    const [endDate, setEndDate]       = useState(filters.end_date ?? '');
    const [showCustom, setShowCustom] = useState(filters.period === 'custom');

    function applyFilter(newPeriod: string, start?: string, end?: string) {
        const params: Record<string, string> = { period: newPeriod };
        if (newPeriod === 'custom') {
            if (start) params.start_date = start;
            if (end)   params.end_date   = end;
        }
        router.get('/system-income', params, { preserveState: false });
    }

    function handlePeriodClick(value: string) {
        setPeriod(value);
        if (value === 'custom') {
            setShowCustom(true);
        } else {
            setShowCustom(false);
            applyFilter(value);
        }
    }

    function handleCustomApply() {
        applyFilter('custom', startDate, endDate);
    }

    const statCards = [
        {
            title:       'System Income',
            value:       `${fmt(summary?.total_income ?? 0)} ETB`,
            description: 'Commission earned by the platform',
            icon:        DollarSign,
            colour:      'text-emerald-600',
        },
        {
            title:       'Total Ride Revenue',
            value:       `${fmt(summary?.total_revenue ?? 0)} ETB`,
            description: 'Total fares collected from passengers',
            icon:        TrendingUp,
            colour:      'text-blue-600',
        },
        {
            title:       'Rides Processed',
            value:       Number(summary?.total_rides ?? 0).toLocaleString(),
            description: 'Paid rides in the selected period',
            icon:        Hash,
            colour:      'text-slate-600',
        },
        {
            title:       'Avg. Commission Rate',
            value:       `${Number(summary?.avg_commission ?? 0).toFixed(2)}%`,
            description: 'Weighted average across vehicle types',
            icon:        Percent,
            colour:      'text-violet-600',
        },
    ];

    const vehicleColumns = [
        { key: 'vehicle_type', header: 'Vehicle Type' },
        { key: 'commission',   header: 'Commission %' },
        { key: 'rides',        header: 'Rides' },
        { key: 'revenue',      header: 'Total Revenue (ETB)' },
        { key: 'income',       header: 'System Income (ETB)' },
    ];

    const detailColumns = [
        { key: 'ride',         header: 'Ride' },
        { key: 'passenger',    header: 'Passenger' },
        { key: 'vehicle_type', header: 'Vehicle Type' },
        { key: 'fare',         header: 'Fare (ETB)' },
        { key: 'commission',   header: 'Commission %' },
        { key: 'income',       header: 'System Income (ETB)' },
        { key: 'method',       header: 'Method' },
        { key: 'date',         header: 'Date' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Income" />

            <div className="flex flex-col gap-6 p-6">

                {/* Page Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold tracking-tight">System Income</h1>
                    <p className="text-muted-foreground text-sm">
                        Commission revenue earned by the platform from completed rides.
                    </p>
                </div>

                {/* Period Filter */}
                <div className="flex flex-wrap items-center gap-2">
                    {PERIODS.map(p => (
                        <Button
                            key={p.value}
                            variant={period === p.value ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handlePeriodClick(p.value)}
                        >
                            {p.label}
                        </Button>
                    ))}

                    {showCustom && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2"
                            />
                            <span className="text-muted-foreground text-sm">to</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2"
                            />
                            <Button
                                size="sm"
                                onClick={handleCustomApply}
                                disabled={!startDate || !endDate}
                            >
                                Apply
                            </Button>
                        </div>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map(card => (
                        <Card key={card.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                                <card.icon className={`h-4 w-4 ${card.colour}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{card.value}</div>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    {card.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Income Over Time Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Income Over Time</CardTitle>
                        <CardDescription>
                            Daily system commission for the selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {incomeOverTime.length === 0 ? (
                            <div className="text-muted-foreground flex h-48 items-center justify-center text-sm">
                                No income data available for this period.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart
                                    data={incomeOverTime}
                                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={v => v.slice(5)}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={v => `${Number(v).toLocaleString()} ETB`}
                                        width={90}
                                    />
                                    <Tooltip
                                        formatter={(value: number, name: string) => [
                                            `${fmt(value)} ETB`,
                                            name === 'income' ? 'System Income' : 'Total Revenue',
                                        ]}
                                        labelFormatter={label => `Date: ${label}`}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            border: '1px solid hsl(var(--border))',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="income"
                                        name="income"
                                        stroke="hsl(142, 76%, 36%)"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        name="revenue"
                                        stroke="hsl(217, 91%, 60%)"
                                        strokeWidth={1.5}
                                        strokeDasharray="4 2"
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-3 flex items-center gap-6 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span
                                    className="inline-block h-2.5 w-5 rounded-sm"
                                    style={{ background: 'hsl(142, 76%, 36%)' }}
                                />
                                System Income
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span
                                    className="inline-block h-2.5 w-5 rounded-sm"
                                    style={{ background: 'hsl(217, 91%, 60%)' }}
                                />
                                Total Ride Revenue
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Breakdown by Vehicle Type */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            Breakdown by Vehicle Type
                        </CardTitle>
                        <CardDescription>
                            Commission earned per vehicle category in the selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {byVehicleType.length === 0 ? (
                            <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                                No data available for this period.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table
                                    columns={vehicleColumns}
                                    data={byVehicleType}
                                    renderRow={(row, index) => (
                                        <tr key={row.vehicle_type} className="hover:bg-muted/50">
                                            <td className={tableDataClass(index, vehicleColumns)}>
                                                <span className="font-medium">{row.vehicle_type}</span>
                                            </td>
                                            <td className={tableDataClass(index, vehicleColumns)}>
                                                <span className="text-muted-foreground font-mono text-sm">
                                                    {Number(row.commission_percentage).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className={tableDataClass(index, vehicleColumns)}>
                                                {Number(row.rides).toLocaleString()}
                                            </td>
                                            <td className={tableDataClass(index, vehicleColumns)}>
                                                <span className="font-mono text-sm">
                                                    {fmt(row.revenue)}
                                                </span>
                                            </td>
                                            <td className={tableDataClass(index, vehicleColumns)}>
                                                <span className="font-mono text-sm font-semibold text-emerald-700">
                                                    {fmt(row.income)}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Detailed Income Records */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Income Records
                        </CardTitle>
                        <CardDescription>
                            Most recent 100 paid rides and the commission each generated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {details.length === 0 ? (
                            <div className="text-muted-foreground flex h-24 items-center justify-center text-sm">
                                No records for the selected period.
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table
                                    columns={detailColumns}
                                    data={details}
                                    renderRow={(row, index) => (
                                        <tr key={row.payment_id} className="hover:bg-muted/50">
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <div className="flex flex-col">
                                                    <span className="font-mono text-xs">
                                                        Ride #{row.ride_id}
                                                    </span>
                                                    <span className="text-muted-foreground font-mono text-xs">
                                                        Pay #{row.payment_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="text-sm">{row.passenger_name}</span>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="text-sm">{row.vehicle_type}</span>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="font-mono text-sm">
                                                    {fmt(row.fare)}
                                                </span>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="text-muted-foreground font-mono text-sm">
                                                    {Number(row.commission_percentage).toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="font-mono text-sm font-semibold text-emerald-700">
                                                    {fmt(row.system_income)}
                                                </span>
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                {methodBadge(row.payment_method)}
                                            </td>
                                            <td className={tableDataClass(index, detailColumns)}>
                                                <span className="text-muted-foreground text-xs">
                                                    {row.paid_at}
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}

