import { Ride, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Calendar, Car, DollarSign, Star } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ride History',
        href: '/driver/trips',
    },
];

function RidesContent({ rides }: { rides: Ride[] }) {
    // const { userData, isLoading, error } = useUserContext();

    // if (isLoading) {
    //     return (
    //         <div className="flex items-center justify-center p-8">
    //             <div className="text-center">
    //                 <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
    //                 <p className="text-gray-600">Loading ride history...</p>
    //             </div>
    //         </div>
    //     );
    // }

    // if (error || !userData) {
    //     return (
    //         <div className="flex items-center justify-center p-8">
    //             <div className="text-center">
    //                 <p className="mb-4 text-red-600">Error loading user data</p>
    //                 <button onClick={() => window.location.reload()} className="text-blue-600 hover:underline">
    //                     Retry
    //                 </button>
    //             </div>
    //         </div>
    //     );
    // }
    console.log(rides);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <HeadingSmall title="Ride History" description={`View your ride history and statistics`} />
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rides.length}</div>
                        <p className="text-muted-foreground text-xs">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(rides.length > 0 ? rides.reduce((sum, ride) => sum + (Number(ride.rating) || 0), 0) / rides.length : 0).toFixed(1)}
                        </div>
                        <p className="text-muted-foreground text-xs">Out of 5</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{rides.reduce((sum, ride) => sum + (Number(ride.price) || 0), 0).toFixed(2)} ETB</div>
                        <p className="text-muted-foreground text-xs">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Ride History */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Rides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rides.map((ride) => (
                            <div key={ride.id} className="flex items-center justify-between rounded-lg border p-4">
                                <div className="flex items-center space-x-4">
                                    <div className="rounded-full bg-blue-100 p-2">
                                        <Car className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <p className="font-medium">
                                                {ride.pickup_address} → {ride.destination_address}
                                            </p>
                                            <Badge variant="outline" className="text-xs">
                                                {ride.status}
                                            </Badge>
                                        </div>
                                        <div className="text-muted-foreground mt-1 flex items-center space-x-4 text-sm">
                                            <span className="flex items-center space-x-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(ride.created_at).toLocaleDateString()}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">{ride.price} ETB</p>
                                    <div className="flex items-center space-x-1">
                                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                                        <span className="text-sm">{ride.rating}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function UserRides() {
    const { rides } = usePage<{ rides: Ride[] }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ride History`} />

            <UserProvider>
                <UserLayout role="driver">
                    <RidesContent rides={rides} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
