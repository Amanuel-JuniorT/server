import { type BreadcrumbItem, type Ride } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Calendar, Car, DollarSign, MapPin, Star } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Ride History',
        href: '/passenger/rides',
    },
];

function RidesContent({ data }: { data: { noOfRides: number; rides: Ride[]; totalSpent: number; averageRating: number } }) {
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

    // Mock ride data - in a real app, this would come from an API
    // const mockRides = [
    //     {
    //         id: 1,
    //         date: '2024-01-15',
    //         pickup: '123 Main St, City',
    //         destination: '456 Oak Ave, City',
    //         driver: 'John Driver',
    //         fare: 25.5,
    //         rating: 5,
    //         status: 'completed',
    //     },
    //     {
    //         id: 2,
    //         date: '2024-01-10',
    //         pickup: '789 Pine St, City',
    //         destination: '321 Elm St, City',
    //         driver: 'Jane Driver',
    //         fare: 18.75,
    //         rating: 4,
    //         status: 'completed',
    //     },
    // ];

    console.log(JSON.stringify(data.rides[0], null, 2));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <HeadingSmall title="Ride History" description={`View 's ride history and statistics`} />
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
                        <Car className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.noOfRides}</div>
                        <p className="text-muted-foreground text-xs">All time</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                        <Star className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.averageRating}</div>
                        <p className="text-muted-foreground text-xs">Out of 5</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                        <DollarSign className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalSpent} ETB</div>
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
                    {data.rides.length > 0 ? (
                        <div className="space-y-4">
                            {data.rides.map((ride) => (
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
                                            <div className="text-muted-foreground mt-4 flex items-end justify-between space-x-4 text-sm">
                                                <div className="flex flex-col items-start space-x-1">
                                                    <span className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            Ordered at: <strong className="block">{ride.created_at}</strong>
                                                        </span>
                                                    </span>
                                                    <span className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>
                                                            {ride.status === 'completed' ? 'Completed at' : 'Cancelled at'}:{' '}
                                                            <strong className="block">{ride.created_at}</strong>
                                                        </span>
                                                    </span>
                                                </div>
                                                <span className="flex items-center space-x-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {ride.driver_id ? (
                                                        <Link href={`/driver/profile/${ride.driver_id}`} className="hover:underline">
                                                            <span>
                                                                Driver: <strong>{ride.driver_name}</strong>
                                                            </span>
                                                        </Link>
                                                    ) : (
                                                        <span>{ride.driver_name}</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {ride.status === 'completed' && (
                                        <div className="text-right">
                                            <p className="text-lg font-bold">{ride.price} ETB</p>
                                            <div className="flex items-center space-x-1">
                                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                                <span className="text-sm">{ride.rating}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <p className="text-gray-600">No rides found</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function PassengerRides() {
    const { data, user_id } = usePage<{ data: { noOfRides: number; rides: Ride[]; totalSpent: number; averageRating: number }; user_id: number }>()
        .props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Ride History - User ${user_id}`} />

            <UserLayout role="passenger" userId={user_id}>
                <RidesContent data={data} />
            </UserLayout>
        </AppLayout>
    );
}
