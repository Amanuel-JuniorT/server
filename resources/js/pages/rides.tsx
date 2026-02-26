import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, tableDataClass } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import echo from '@/lib/reverb';
import { Ride, RideStats, type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Activity, CheckCircle2, Clock, Eye, Filter, Map, MapPin, RefreshCw, Search, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Rides', href: '/rides' }];

export default function RidesPage() {
    const { rides: initialRides = [], stats = {} as RideStats } = usePage<{ rides: Ride[]; stats: RideStats }>().props;
    const [rides, setRides] = useState<Ride[]>(initialRides);
    const [filteredRides, setFilteredRides] = useState<Ride[]>(initialRides);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const channel = echo.channel('ride');

        channel.listen('.ride.requested', (e: any) => {
            console.log('New ride requested via WebSocket:', e);
            // Prepend the new ride to the list if it doesn't already exist
            setRides((prev) => {
                if (prev.some((r) => r.id === e.ride_id)) return prev;
                const newRide: any = {
                    id: e.ride_id,
                    passenger_name: 'New Passenger', // We'd ideally have the name in the event
                    passenger_phone: 'N/A',
                    driver_name: 'Pending',
                    pickup_address: e.pickup_address,
                    destination_address: e.destination_address,
                    status: 'requested',
                    created_at: 'Just now',
                    price: 0,
                };
                return [newRide, ...prev];
            });
        });

        // Listen for status changes
        channel.listen('.ride.status_changed', (e: any) => {
            console.log('Ride status changed via WebSocket:', e);
            setRides((prev) =>
                prev.map((ride) =>
                    ride.id === e.ride_id
                        ? {
                              ...ride,
                              status: e.status,
                              driver_id: e.driver_id,
                              notified_driver_name: e.notified_driver_name,
                              notified_drivers_count: e.notified_drivers_count,
                          }
                        : ride,
                ),
            );
        });

        channel.listen('.ride.accepted', (e: any) => {
            console.log('Ride accepted via WebSocket:', e);
            // In a real app we'd need the ride_id which isn't in the current event payload
            // Ideally RideAccepted should include the ride_id
        });

        channel.listen('.ride.started', (e: any) => {
            console.log('Ride started via WebSocket:', e);
            setRides((prev) => prev.map((ride) => (ride.id === e.ride.id ? { ...ride, status: 'in_progress' } : ride)));
        });

        channel.listen('.ride.ended', (e: any) => {
            console.log('Ride ended via WebSocket:', e);
            setRides((prev) => prev.map((ride) => (ride.id === e.ride.id ? { ...ride, status: 'completed' } : ride)));
        });

        channel.listen('.ride.cancelled', (e: any) => {
            console.log('Ride cancelled via WebSocket:', e);
            setRides((prev) => prev.map((ride) => (ride.id === e.ride.id ? { ...ride, status: 'cancelled' } : ride)));
        });

        return () => {
            echo.leaveChannel('ride');
        };
    }, []);

    useEffect(() => {
        let result = rides;

        if (statusFilter !== 'all') {
            if (statusFilter === 'live') {
                result = result.filter((ride) => ['accepted', 'in_progress'].includes(ride.status));
            } else if (statusFilter === 'pool') {
                result = result.filter((ride) => ride.is_pool_ride);
            } else if (statusFilter === 'dispatched') {
                result = result.filter((ride) => ride.dispatched_by_admin_id !== null);
            } else {
                result = result.filter((ride) => ride.status === statusFilter);
            }
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(
                (ride) =>
                    ride.passenger_name.toLowerCase().includes(term) ||
                    ride.driver_name.toLowerCase().includes(term) ||
                    ride.pickup_address.toLowerCase().includes(term) ||
                    ride.destination_address.toLowerCase().includes(term) ||
                    ride.id.toString().includes(term),
            );
        }

        setFilteredRides(result);
    }, [searchTerm, statusFilter, rides]);

    const handleViewRide = (ride: Ride) => {
        setSelectedRide(ride);
        setIsDialogOpen(true);
    };

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'passenger', header: 'Passenger' },
        { key: 'driver', header: 'Driver' },
        { key: 'route', header: 'Route' },
        { key: 'price', header: 'Price' },
        { key: 'status', header: 'Status' },
        { key: 'created_at', header: 'Requested At' },
        { key: 'actions', header: 'Actions' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'requested':
                return <Badge variant="secondary">Requested</Badge>;
            case 'searching':
                return (
                    <Badge variant="secondary" className="animate-pulse border-blue-200 bg-blue-100 text-blue-800">
                        Searching...
                    </Badge>
                );
            case 'accepted':
                return (
                    <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                        Accepted
                    </Badge>
                );
            case 'in_progress':
                return (
                    <Badge variant="secondary" className="border-purple-200 bg-purple-100 text-purple-800">
                        In Progress
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="secondary" className="border-green-200 bg-green-100 text-green-800">
                        Completed
                    </Badge>
                );
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            case 'no_driver_found':
                return (
                    <Badge variant="secondary" className="border-orange-200 bg-orange-100 text-orange-800">
                        No Driver Found
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status.replace('_', ' ')}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ride Management" />
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ride Management</h1>
                        <p className="text-muted-foreground">Monitor and manage all ride operations</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            setIsRefreshing(true);
                            import('@inertiajs/react').then(({ router }) => {
                                router.reload({
                                    only: ['rides', 'stats'],
                                    onFinish: () => setIsRefreshing(false),
                                });
                            });
                        }}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                            <Map className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.total_rides || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Live Rides</CardTitle>
                            <Activity className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.live_rides || 0}</div>
                            <p className="text-muted-foreground mt-1 text-xs">Accepted & In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.completed_rides || 0}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.cancelled_rides || 0}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters & Search */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative max-w-sm flex-1">
                                <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
                                <Input
                                    placeholder="Search passenger, driver, or address..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Filter className="text-muted-foreground h-4 w-4" />
                                <select
                                    className="border-input focus-visible:ring-ring flex h-9 w-[180px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="live">Live Rides</option>
                                    <option value="pool">Pooled Rides</option>
                                    <option value="dispatched">Dispatched (Admin)</option>
                                    <option value="requested">Requested</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table
                                columns={columns}
                                data={filteredRides}
                                renderRow={(ride, index) => (
                                    <tr key={ride.id} className="hover:bg-muted/50">
                                        <td className={tableDataClass(index, columns)}>
                                            <span className="font-medium">#{ride.id}</span>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex flex-col">
                                                <span>{ride.passenger_name}</span>
                                                <span className="text-muted-foreground text-xs">{ride.passenger_phone}</span>
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex flex-col">
                                                {ride.status === 'searching' && ride.notified_driver_name ? (
                                                    <>
                                                        <span className="animate-pulse font-semibold text-blue-600">
                                                            Pinging {ride.notified_driver_name}
                                                        </span>
                                                        {ride.notified_drivers_count > 1 && (
                                                            <span className="text-muted-foreground text-xs">
                                                                + {ride.notified_drivers_count - 1} other drivers
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <span>{ride.driver_name || 'Not Assigned'}</span>
                                                        {ride.driver_id && (
                                                            <span className="text-muted-foreground text-xs">ID: {ride.driver_id}</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex max-w-[250px] flex-col">
                                                <span className="truncate text-xs">
                                                    <span className="font-semibold">From:</span> {ride.pickup_address}
                                                </span>
                                                <span className="truncate text-xs">
                                                    <span className="font-semibold">To:</span> {ride.destination_address}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>{ride.price ? `${ride.price} ETB` : '-'}</td>
                                        <td className={tableDataClass(index, columns)}>{getStatusBadge(ride.status)}</td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="text-muted-foreground flex items-center gap-1 text-xs">
                                                <Clock className="h-3 w-3" />
                                                {ride.created_at}
                                            </div>
                                        </td>
                                        <td className={tableDataClass(index, columns)}>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedRide(ride);
                                                        setIsDialogOpen(true);
                                                    }}
                                                >
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            />
                            {filteredRides.length === 0 && (
                                <div className="text-muted-foreground py-12 text-center">No rides found matching your criteria.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <DialogTitle className="text-xl">Ride Details - #{selectedRide?.id}</DialogTitle>
                                <DialogDescription>Detailed information about ride request and current status.</DialogDescription>
                            </div>
                            {selectedRide && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/rides/${selectedRide.id}`}>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Full Details
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedRide && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm font-semibold">Passenger</p>
                                    <p className="font-medium">{selectedRide.passenger_name}</p>
                                    <p className="text-muted-foreground text-xs">{selectedRide.passenger_phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm font-semibold">Driver</p>
                                    {selectedRide.status === 'searching' && selectedRide.notified_driver_name ? (
                                        <div className="flex flex-col">
                                            <p className="animate-pulse font-medium text-blue-600">Pinging: {selectedRide.notified_driver_name}</p>
                                            {selectedRide.notified_drivers_count > 1 && (
                                                <p className="text-muted-foreground text-xs">
                                                    Waiting response from {selectedRide.notified_drivers_count} drivers
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-medium">{selectedRide.driver_name || 'Not Assigned'}</p>
                                            {selectedRide.driver_id && <p className="text-muted-foreground text-xs">ID: {selectedRide.driver_id}</p>}
                                        </>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-1 h-4 w-4 text-red-500" />
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase">Pickup Location</p>
                                        <p className="text-sm">{selectedRide.pickup_address}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <MapPin className="mt-1 h-4 w-4 text-blue-500" />
                                    <div className="space-y-0.5">
                                        <p className="text-muted-foreground text-xs font-semibold uppercase">Destination Location</p>
                                        <p className="text-sm">{selectedRide.destination_address}</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm font-semibold">Status</p>
                                    {getStatusBadge(selectedRide.status)}
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm font-semibold">Price</p>
                                    <p className="text-lg font-bold">{selectedRide.price ? `${selectedRide.price} ETB` : 'Not Set'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground text-sm font-semibold">Type</p>
                                    <Badge variant="outline" className="capitalize">
                                        {selectedRide.is_pool_ride ? 'Pool' : 'Standard'}
                                    </Badge>
                                </div>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Requested At</p>
                                    <p>{selectedRide.requested_at || selectedRide.created_at}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-muted-foreground">Payment Method</p>
                                    <p>{selectedRide.cash_payment ? 'Cash' : 'Wallet'}</p>
                                </div>
                            </div>

                            {selectedRide.status === 'no_driver_found' && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-orange-800">No Driver Found</p>
                                            <p className="text-xs text-orange-600">The system couldn't find an available driver for this request.</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setIsDialogOpen(false);
                                                if (confirm('Retry this ride?')) router.post(route('request-ride.retry', { id: selectedRide.id }));
                                            }}
                                        >
                                            <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                            Retry
                                        </Button>
                                    </div>
                                </>
                            )}

                            {selectedRide.dispatched_by_admin_id !== null && selectedRide.status !== 'no_driver_found' && (
                                <>
                                    <Separator />
                                    <div className="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-semibold text-orange-800">Admin Dispatched Ride</p>
                                            {selectedRide.cancelled_by === 'driver' ? (
                                                <p className="text-xs font-medium text-red-600">This manual ride was cancelled by the driver.</p>
                                            ) : (
                                                <p className="text-xs text-orange-600">This ride was manually dispatched by an admin.</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {(selectedRide.status === 'cancelled' || selectedRide.status === 'no_driver_found') && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setIsDialogOpen(false);
                                                        if (confirm('Retry this ride?'))
                                                            router.post(route('request-ride.retry', { id: selectedRide.id }));
                                                    }}
                                                >
                                                    <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                                    Retry
                                                </Button>
                                            )}
                                            {selectedRide.status !== 'in_progress' &&
                                                selectedRide.status !== 'completed' &&
                                                selectedRide.status !== 'cancelled' && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setIsDialogOpen(false);
                                                            if (confirm('Cancel this ride?'))
                                                                router.post(route('request-ride.cancel', { id: selectedRide.id }));
                                                        }}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {selectedRide.dispatched_by_admin_id === null &&
                                selectedRide.cancelled_by === 'driver' &&
                                selectedRide.status !== 'no_driver_found' && (
                                    <>
                                        <Separator />
                                        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-semibold text-red-800">Driver Cancelled</p>
                                                <p className="text-xs text-red-600">
                                                    This ride was cancelled by the driver. You can retry it from here.
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsDialogOpen(false);
                                                    if (confirm('Retry this ride?'))
                                                        router.post(route('request-ride.retry', { id: selectedRide.id }));
                                                }}
                                            >
                                                <RefreshCw className="mr-1 h-3.5 w-3.5" />
                                                Retry
                                            </Button>
                                        </div>
                                    </>
                                )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
