import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { listenToAdminEvents } from '@/lib/reverb';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Activity, Banknote, Bell, Building2, Car, Clock, MapPin, Navigation, Send, Ticket, TrendingUp, UserPlus, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface AdminProps extends SharedData {
    stats: {
        passengers: number;
        total_drivers: number;
        active_drivers: number;
        pending_drivers: number;
        rejected_drivers: number;
        vehicles: number;
        rides: number;
        companies: number;
        active_companies: number;
        company_employees: number;
        pending_company_requests: number;
        total_revenue: number;
        pending_payment_receipts: number;
        pending_wallet_topups: number;
    };
    ridesOverTime: Array<{ date: string; count: number }>;
    recentRides: Array<any>;
    recentRegistrations: Array<any>;
    activeDrivers: Array<{ id: number; name: string; lat: number; lng: number; status: string }>;
}

export default function AdminDashboard() {
    const { stats, ridesOverTime = [], recentRides = [], recentRegistrations = [], activeDrivers = [] } = usePage<AdminProps>().props;

    const [passengerCount, setPassengerCount] = useState<number | undefined>(stats?.passengers);
    const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string }>>([]);

    const playNotificationSound = useCallback(() => {
        try {
            const AudioCtx =
                (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
                (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            const now = ctx.currentTime;
            g.gain.setValueAtTime(0, now);
            g.gain.linearRampToValueAtTime(0.12, now + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
            o.start(now);
            o.stop(now + 0.4);
        } catch (e) {
            console.error('Error at making sound: ', e);
        }
    }, []);

    const pushNotification = useCallback(
        (title: string, message: string) => {
            const id = Date.now() + Math.floor(Math.random() * 1000);
            setNotifications((prev) => [...prev, { id, title, message }]);
            playNotificationSound();
            window.setTimeout(() => {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
            }, 4500);
        },
        [playNotificationSound],
    );

    useEffect(() => {
        setPassengerCount(stats?.passengers);
        listenToAdminEvents('.user.registered', (e: { role?: string; name?: string; phone?: string }) => {
            if (e.role === 'passenger') setPassengerCount((prev) => (typeof prev === 'number' ? prev + 1 : prev));
            const who = e.name ?? e.phone ?? 'New user';
            pushNotification('New registration', `${who} registered${e.role ? ' as ' + e.role : ''}`);
        });
    }, [stats?.passengers, pushNotification]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Notification stack */}
                <div className="pointer-events-none fixed top-4 right-4 z-[1000] flex w-80 flex-col gap-3">
                    {notifications.map((n) => (
                        <div
                            key={n.id}
                            className="animate-in slide-in-from-right pointer-events-auto rounded-lg border border-neutral-200 bg-white p-4 shadow-lg transition-all dark:border-neutral-800 dark:bg-neutral-900"
                        >
                            <div className="mb-1 flex items-center gap-2">
                                <Bell className="h-4 w-4 text-blue-500" />
                                <div className="text-sm font-semibold">{n.title}</div>
                            </div>
                            <div className="text-sm text-neutral-600 dark:text-neutral-300">{n.message}</div>
                        </div>
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {(stats?.pending_payment_receipts > 0 || stats?.pending_wallet_topups > 0) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Ticket className="h-4 w-4" /> Pending Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Receipts</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold">{stats?.pending_payment_receipts ?? '0'}</span>
                                            {stats?.pending_payment_receipts > 0 && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    Action Required
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground text-sm">Wallet Topups</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-bold">{stats?.pending_wallet_topups ?? '0'}</span>
                                            {stats?.pending_wallet_topups > 0 && (
                                                <Badge variant="destructive" className="animate-pulse">
                                                    Action Required
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <a href="/payment-receipts">View Payments</a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                    {stats?.pending_drivers > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Pending Drivers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4 flex items-center justify-between">
                                    <div className="text-3xl font-bold">{stats?.pending_drivers ?? '0'}</div>
                                    <Badge variant="secondary">Awaiting Approval</Badge>
                                </div>
                                <Button variant="outline" className="w-full" asChild>
                                    <a href="/drivers">Review Drivers</a>
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <Banknote className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{Number(stats?.total_revenue ?? 0).toLocaleString()} ETB</div>
                            <p className="text-muted-foreground text-xs">
                                <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                    <TrendingUp className="h-3 w-3" /> +12.5%
                                </span>{' '}
                                from last month
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                            <Navigation className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.rides ?? '0'}</div>
                            <p className="text-muted-foreground text-xs">
                                <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                    <TrendingUp className="h-3 w-3" /> +8.2%
                                </span>{' '}
                                from last week
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                            <Car className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.active_drivers ?? '0'}</div>
                            <p className="text-muted-foreground text-xs">
                                <span className="inline-flex items-center gap-0.5 text-blue-500">
                                    <Activity className="h-3 w-3" /> {activeDrivers.length}
                                </span>{' '}
                                currently online
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Passengers</CardTitle>
                            <Users className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{passengerCount ?? '0'}</div>
                            <p className="text-muted-foreground text-xs">
                                <span className="inline-flex items-center gap-0.5 text-emerald-500">
                                    <UserPlus className="h-3 w-3" /> +48
                                </span>{' '}
                                new this week
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-7">
                    {/* Rides Chart */}
                    <Card className="lg:col-span-4">
                        <CardHeader>
                            <CardTitle>Rides Overview</CardTitle>
                            <CardDescription>Daily ride volume for the last 30 days</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={ridesOverTime.length > 0 ? ridesOverTime : [{ date: new Date().toISOString(), count: 0 }]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#888' }}
                                        tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* FCM Send Card */}
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-4 w-4" /> Send Notification
                            </CardTitle>
                            <CardDescription>Broadcast messages to passengers or specific users</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form
                                className="grid gap-4"
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const payload = {
                                        target: formData.get('target'),
                                        user_id: formData.get('userId'),
                                        title: formData.get('title'),
                                        body: formData.get('body'),
                                        data: formData.get('data') ? JSON.parse(formData.get('data') as string) : {},
                                        high_priority: formData.get('high') === 'on',
                                    };

                                    try {
                                        const res = await fetch('/admin/notifications/send', {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                                            },
                                            body: JSON.stringify(payload),
                                        });
                                        if (!res.ok) throw new Error(await res.text());
                                        pushNotification('FCM queued', 'Your notification request has been queued.');
                                        (e.target as HTMLFormElement).reset();
                                    } catch (err) {
                                        console.error(err);
                                        pushNotification('Error', 'Failed to queue FCM notification');
                                    }
                                }}
                            >
                                <div className="grid gap-2">
                                    <Label htmlFor="target">Target Audience</Label>
                                    <Select name="target" defaultValue="all_passengers">
                                        <SelectTrigger id="target">
                                            <SelectValue placeholder="Select target" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_passengers">All Passengers</SelectItem>
                                            <SelectItem value="user_id">Specific User ID</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="userId">User ID (Optional)</Label>
                                    <Input id="userId" name="userId" placeholder="e.g. 123" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input id="title" name="title" placeholder="Notification Title" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="body">Message Body</Label>
                                    <Textarea id="body" name="body" placeholder="Type your message here..." required />
                                </div>
                                <Button type="submit" className="w-full">
                                    Send Notification
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Live Map */}
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b">
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-red-500" /> Live Driver Map
                            </CardTitle>
                            <CardDescription>{activeDrivers.length} drivers currently active on the road</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] p-0">
                            <MapContainer center={[9.03, 38.74]} zoom={12} style={{ height: '100%', width: '100%' }}>
                                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                {activeDrivers.map((driver) => (
                                    <Marker key={driver.id} position={[driver.lat, driver.lng]}>
                                        <Popup>
                                            <div className="text-sm">
                                                <div className="font-bold">{driver.name}</div>
                                                <div className="text-muted-foreground text-xs capitalize">{driver.status.replace('_', ' ')}</div>
                                            </div>
                                        </Popup>
                                    </Marker>
                                ))}
                            </MapContainer>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Rides</CardTitle>
                            <CardDescription>Latest ride requests across the platform</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Passenger</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Fare</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recentRides.map((ride) => (
                                        <TableRow key={ride.id}>
                                            <TableCell className="font-medium">{ride.passenger?.name ?? 'Unknown'}</TableCell>
                                            <TableCell>{ride.driver?.user?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        ride.status === 'completed'
                                                            ? 'default'
                                                            : ride.status === 'cancelled'
                                                              ? 'destructive'
                                                              : 'secondary'
                                                    }
                                                    className="capitalize"
                                                >
                                                    {ride.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{ride.price ?? 0} ETB</TableCell>
                                        </TableRow>
                                    ))}
                                    {recentRides.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">
                                                No recent rides found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Company Management Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Companies
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-3xl font-bold">{stats?.companies ?? '0'}</div>
                                <Badge variant="outline">{stats?.active_companies ?? '0'} Active</Badge>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/companies">Manage Companies</a>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-4 w-4" /> Company Employees
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-3xl font-bold">{stats?.company_employees ?? '0'}</div>
                                {stats?.pending_company_requests > 0 && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        {stats?.pending_company_requests} Pending
                                    </Badge>
                                )}
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/company-employees">Review Requests</a>
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-4 w-4" /> Pending Drivers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="text-3xl font-bold">{stats?.pending_drivers ?? '0'}</div>
                                <Badge variant="secondary">Awaiting Approval</Badge>
                            </div>
                            <Button variant="outline" className="w-full" asChild>
                                <a href="/drivers">Review Drivers</a>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
