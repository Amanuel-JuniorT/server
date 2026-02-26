import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import echo from '@/lib/reverb';
import { Head, Link, router } from '@inertiajs/react';
import { Activity, AlertCircle, CheckCircle2, MapPin, Phone, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SosAlert {
    id: number;
    user: { name: string; phone: string };
    ride_id: number | null;
    status: 'open' | 'resolved' | 'false_alarm';
    latitude: number;
    longitude: number;
    message: string | null;
    created_at: string;
    resolved_at: string | null;
    resolution_note: string | null;
}

interface Props {
    alerts: {
        data: SosAlert[];
    };
    stats: {
        total: number;
        open: number;
        resolved: number;
    };
}

export default function SosPage({ alerts, stats }: Props) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [localAlerts, setLocalAlerts] = useState(alerts.data);

    useEffect(() => {
        const channel = echo.channel('admin-alerts');

        channel.listen('.sos.received', (e: any) => {
            console.log('SOS Alert received via WebSocket:', e);
            setLocalAlerts((prev) => [e.alert, ...prev]);
            // Re-fetch stats in background
            router.reload({ only: ['stats'] });
        });

        return () => {
            echo.leaveChannel('admin-alerts');
        };
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['alerts', 'stats'],
            onFinish: () => {
                setIsRefreshing(false);
                setLocalAlerts(alerts.data);
            },
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return (
                    <Badge variant="destructive" className="animate-pulse">
                        Active Emergency
                    </Badge>
                );
            case 'resolved':
                return (
                    <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                        Resolved
                    </Badge>
                );
            case 'false_alarm':
                return <Badge variant="outline">False Alarm</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={[{ title: 'SOS Alerts', href: '/sos' }]}>
            <Head title="SOS Emergency Alerts" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-destructive flex items-center gap-2 text-3xl font-bold tracking-tight">
                            <AlertCircle className="h-8 w-8" />
                            Emergency SOS Management
                        </h1>
                        <p className="text-muted-foreground">Monitor and respond to emergency signals from passengers and drivers</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-destructive/20 bg-destructive/5">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-destructive text-sm font-medium">Active Emergencies</CardTitle>
                            <AlertCircle className="text-destructive h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-destructive text-2xl font-bold">{stats.open}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Resolved Alerts</CardTitle>
                            <CheckCircle2 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.resolved}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                            <Activity className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <SimpleTable>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date/Time</TableHead>
                                <TableHead>User / Phone</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>Ride ID</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {localAlerts.length > 0 ? (
                                localAlerts.map((alert) => (
                                    <TableRow key={alert.id} className={alert.status === 'open' ? 'bg-destructive/5' : ''}>
                                        <TableCell className="font-medium">{new Date(alert.created_at).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{alert.user?.name || 'Unknown'}</span>
                                                <span className="text-muted-foreground flex items-center gap-1 text-xs">
                                                    <Phone className="h-3 w-3" /> {alert.user?.phone || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <a
                                                href={`https://www.google.com/maps?q=${alert.latitude},${alert.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-blue-600 hover:underline"
                                            >
                                                <MapPin className="h-4 w-4" />
                                                View on Map
                                            </a>
                                        </TableCell>
                                        <TableCell>
                                            {alert.ride_id ? (
                                                <Link href={`/rides?search=${alert.ride_id}`} className="text-blue-600 hover:underline">
                                                    #{alert.ride_id}
                                                </Link>
                                            ) : (
                                                'N/A'
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                                        <TableCell className="text-right">
                                            {alert.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => {
                                                        if (confirm('Resolve this emergency alert?')) {
                                                            router.post(
                                                                `/sos/${alert.id}/resolve`,
                                                                {
                                                                    status: 'resolved',
                                                                    note: 'Resolved by Administrator',
                                                                },
                                                                {
                                                                    onSuccess: () => {
                                                                        router.reload({ only: ['pendingActions'] });
                                                                    },
                                                                },
                                                            );
                                                        }
                                                    }}
                                                >
                                                    Resolve
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        No SOS alerts found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </SimpleTable>
                </Card>
            </div>
        </AppLayout>
    );
}
