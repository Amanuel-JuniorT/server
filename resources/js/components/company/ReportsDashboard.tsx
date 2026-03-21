import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTable as Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Car, CheckCircle, Clock, TrendingUp, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ReportsDashboard({ companyId }: { companyId: number }) {
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReports();
    }, [companyId, dateRange]);

    const fetchReports = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/company-admin/api/reports?start_date=${dateRange.start}&end_date=${dateRange.end}`);
            const data = await res.json();
            if (data.success) {
                setReportData(data.data);
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !reportData) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
        );
    }

    if (!reportData) return null;

    const { summary, top_opt_outs, daily_trends } = reportData;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
                    <p className="text-muted-foreground">Overview of ride group performance and attendance</p>
                </div>
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={dateRange.start} 
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input 
                        type="date" 
                        value={dateRange.end} 
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        className="rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                    />
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled Rides</CardTitle>
                        <Car className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_rides}</div>
                        <p className="text-xs text-muted-foreground mt-1">In selected period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.completion_rate}%</div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">{summary.completed_rides} Completed</Badge>
                            <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700">{summary.cancelled_rides} Cancelled</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Opt-outs</CardTitle>
                        <XCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.total_opt_outs}</div>
                        <p className="text-xs text-muted-foreground mt-1">Empty seats during rides</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Attendance</CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.total_rides > 0 ? (100 - (summary.total_opt_outs / (summary.total_rides * 4) * 100)).toFixed(1) : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Seat occupancy rate</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Daily Activity</CardTitle>
                        <CardDescription>Number of rides over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-64 flex items-end gap-1 px-4">
                        {daily_trends && Object.keys(daily_trends).length > 0 ? (
                            Object.entries(daily_trends).slice(-15).map(([date, stats]: [string, any]) => {
                                const height = (stats.total / 10) * 100; // Scaling for visualization
                                return (
                                    <div key={date} className="group relative flex-1 flex flex-col items-center gap-1">
                                        <div 
                                            className="w-full bg-primary/20 hover:bg-primary/40 rounded-t transition-all flex flex-col justify-end"
                                            style={{ height: `${Math.max(height, 5)}%` }}
                                        >
                                            <div 
                                                className="w-full bg-primary rounded-t"
                                                style={{ height: `${(stats.completed / stats.total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[8px] text-muted-foreground rotate-45 mt-2">{date.substring(5)}</span>
                                        {/* Tooltip emulation */}
                                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-black text-white text-[10px] p-1 rounded whitespace-nowrap z-10">
                                            {date}: {stats.completed}/{stats.total}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                No activity in this period
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Opt-outs */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Opt-out Analysis</CardTitle>
                        <CardDescription>Employees with most frequent opt-outs</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead className="text-right">Opt-out Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {top_opt_outs && top_opt_outs.length > 0 ? (
                                    top_opt_outs.map((item: any, idx: number) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-medium">{item.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant="outline" className="text-orange-600 bg-orange-50 font-bold border-orange-200">
                                                    {item.count}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                                            No opt-outs recorded yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
