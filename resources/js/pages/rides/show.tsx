import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import RideLayout from '@/layouts/ride/layout';
import { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, Calendar, Car, Clock, CreditCard, MapPin, Phone, RefreshCw, Star, User, XCircle } from 'lucide-react';

interface Ride {
    id: number;
    passenger_name: string;
    passenger_phone: string;
    passenger_email: string;
    driver_id?: number | null;
    driver_name: string;
    driver_phone: string;
    vehicle?: {
        make: string;
        model: string;
        plate_number: string;
        color: string;
    } | null;
    pickup_address: string;
    destination_address: string;
    price: string | number;
    status: string;
    cash_payment: boolean;
    prepaid: boolean;
    is_pool_ride: boolean;
    requested_at: string;
    started_at?: string | null;
    completed_at?: string | null;
    cancelled_at?: string | null;
    created_at: string;
    payment_status?: string | null;
    payment_method?: string | null;
    rating?: number | null;
    rating_comment?: string | null;
    cancelled_by?: string | null;
    notified_driver_name?: string | null;
    notified_drivers_count?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ride Management', href: '/rides' },
    { title: 'Ride Details', href: '#' },
];

export default function RideShow({ ride }: { ride: Ride }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'accepted':
                return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'requested':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'cancelled':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ride #${ride.id}`} />

            <RideLayout rideId={ride.id} status={ride.status}>
                <div className="space-y-6">
                    {/* Header Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xl font-bold">General Information</CardTitle>
                            <div className="flex items-center gap-3">
                                {ride.dispatched_by_admin_id !== null && (
                                    <Badge variant="outline" className="border-orange-200 bg-orange-50 text-orange-700">
                                        Admin Dispatched
                                    </Badge>
                                )}
                                <Badge variant="outline" className={cn('px-3 py-1 capitalize', getStatusColor(ride.status))}>
                                    {ride.status.replace('_', ' ')}
                                </Badge>

                                {/* Action Buttons */}
                                <div className="ml-4 flex gap-2">
                                    {(ride.status === 'cancelled' || ride.status === 'no_driver_found') &&
                                        (ride.dispatched_by_admin_id !== null || ride.cancelled_by === 'driver') && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    if (confirm('Retry this ride?')) router.post(route('request-ride.retry', { id: ride.id }));
                                                }}
                                                className="h-8 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                                            >
                                                <RefreshCw className="mr-2 h-4 w-4" />
                                                Retry Ride
                                            </Button>
                                        )}

                                    {['requested', 'searching', 'accepted', 'arrived'].includes(ride.status) && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to cancel this ride?')) {
                                                    router.post(route('request-ride.cancel', { id: ride.id }));
                                                }
                                            }}
                                            className="h-8 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                                        >
                                            <XCircle className="mr-2 h-4 w-4" />
                                            Cancel Ride
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        {ride.cancelled_by === 'driver' && ride.status === 'cancelled' && (
                            <div className="mx-6 mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                                <AlertCircle className="h-4 w-4" />
                                <p>
                                    This ride was <strong>cancelled by the driver</strong>. You may retry it if needed.
                                </p>
                            </div>
                        )}
                        {ride.status === 'no_driver_found' && (
                            <div className="mx-6 mb-4 flex items-center gap-2 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
                                <AlertCircle className="h-4 w-4" />
                                <p>
                                    <strong>No Driver Found</strong>. The search exhausted all radii without finding an available driver.
                                </p>
                            </div>
                        )}
                        <CardContent>
                            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
                                <section className="space-y-4">
                                    <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Ride Details</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-primary mt-1 h-4 w-4" />
                                            <div>
                                                <p className="text-muted-foreground text-xs">Pickup Address</p>
                                                <p className="text-sm font-medium">{ride.pickup_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MapPin className="text-destructive mt-1 h-4 w-4" />
                                            <div>
                                                <p className="text-muted-foreground text-xs">Destination Address</p>
                                                <p className="text-sm font-medium">{ride.destination_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="text-muted-foreground h-4 w-4" />
                                            <div>
                                                <p className="text-muted-foreground text-xs">Fare & Payment</p>
                                                <p className="text-sm font-medium">
                                                    {ride.price} ETB • {ride.cash_payment ? 'Cash' : ride.prepaid ? 'Prepaid/Wallet' : 'Not Set'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                                <section className="space-y-4">
                                    <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">Timestamps</h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <Calendar className="text-muted-foreground h-4 w-4" />
                                            <div>
                                                <p className="text-muted-foreground text-xs">Requested At</p>
                                                <p className="text-sm font-medium">{ride.requested_at}</p>
                                            </div>
                                        </div>
                                        {ride.started_at && (
                                            <div className="flex items-center gap-3">
                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                <div>
                                                    <p className="text-muted-foreground text-xs">Started At</p>
                                                    <p className="text-sm font-medium">{ride.started_at}</p>
                                                </div>
                                            </div>
                                        )}
                                        {(ride.completed_at || ride.cancelled_at) && (
                                            <div className="flex items-center gap-3">
                                                <Clock className="text-muted-foreground h-4 w-4" />
                                                <div>
                                                    <p className="text-muted-foreground text-xs">
                                                        {ride.completed_at ? 'Completed At' : 'Cancelled At'}
                                                    </p>
                                                    <p className="text-sm font-medium">{ride.completed_at || ride.cancelled_at}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </section>{' '}
                                section
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Passenger Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5" />
                                    Passenger
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-muted-foreground text-xs">Name</p>
                                    <p className="font-semibold">{ride.passenger_name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Phone</p>
                                    <div className="flex items-center gap-2">
                                        <Phone className="text-muted-foreground h-3 w-3" />
                                        <p className="text-sm">{ride.passenger_phone}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-xs">Email</p>
                                    <p className="text-sm">{ride.passenger_email}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Driver Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Car className="h-5 w-5" />
                                    Driver & Vehicle
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {ride.driver_id ? (
                                    <>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Name</p>
                                            <p className="font-semibold">{ride.driver_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs">Phone</p>
                                            <div className="flex items-center gap-2">
                                                <Phone className="text-muted-foreground h-3 w-3" />
                                                <p className="text-sm">{ride.driver_phone}</p>
                                            </div>
                                        </div>
                                        {ride.vehicle && (
                                            <div className="pt-2">
                                                <p className="text-muted-foreground text-xs">Vehicle</p>
                                                <p className="text-sm font-medium">
                                                    {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                                                </p>
                                                <Badge variant="secondary" className="mt-1 font-mono tracking-tighter">
                                                    {ride.vehicle.plate_number}
                                                </Badge>
                                            </div>
                                        )}
                                    </>
                                ) : ride.status === 'searching' && ride.notified_driver_name ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="rounded-md border border-blue-100 bg-blue-50 p-3">
                                            <p className="text-xs font-semibold tracking-wider text-blue-800 uppercase">Currently Pinging</p>
                                            <p className="animate-pulse text-lg font-bold text-blue-700">{ride.notified_driver_name}</p>
                                            {ride.notified_drivers_count && ride.notified_drivers_count > 1 && (
                                                <p className="mt-1 text-xs text-blue-600">
                                                    + {ride.notified_drivers_count - 1} other drivers in range
                                                </p>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground text-center text-xs italic">Waiting for driver acceptance...</p>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground flex flex-col items-center justify-center py-8 italic">
                                        <p>No driver assigned yet</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Feedback Card */}
                    {ride.rating && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                                    Passenger Feedback
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-2 flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={cn('h-4 w-4', i < ride.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300')}
                                        />
                                    ))}
                                    <span className="ml-2 text-lg font-bold">{ride.rating}/5</span>
                                </div>
                                <p className="text-muted-foreground text-sm italic">&ldquo;{ride.rating_comment || 'No comment provided'}&rdquo;</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </RideLayout>
        </AppLayout>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
