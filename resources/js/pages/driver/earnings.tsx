import HeadingSmall from '@/components/heading-small';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Driver, Ride, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Banknote, Calendar, TrendingUp } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Earnings',
        href: '/driver/earnings',
    },
];

function EarningsContent({ rides, totalEarnings }: { rides: Ride[]; totalEarnings: number }) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <HeadingSmall title="Driver Earnings" description="View earnings summary and history" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <Banknote className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{Number(totalEarnings).toFixed(2)} ETB</div>
                        <p className="text-muted-foreground text-xs">Total from completed rides</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Average per Trip</CardTitle>
                        <TrendingUp className="text-muted-foreground h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{(rides.length > 0 ? totalEarnings / rides.length : 0).toFixed(2)} ETB</div>
                        <p className="text-muted-foreground text-xs">Based on {rides.length} trips</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {rides.length === 0 ? (
                            <p className="text-muted-foreground py-4 text-center">No earnings data available</p>
                        ) : (
                            rides.map((ride) => (
                                <div key={ride.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center space-x-4">
                                        <div className="rounded-full bg-green-100 p-2">
                                            <Banknote className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium">
                                                {ride.pickup_address} → {ride.destination_address}
                                            </p>
                                            <div className="text-muted-foreground mt-1 flex items-center space-x-2 text-xs">
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(ride.completed_at || ride.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">{ride.price} ETB</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DriverEarnings() {
    const { driver, rides, totalEarnings, user_id } = usePage<{
        driver: Driver;
        rides: Ride[];
        totalEarnings: number;
        user_id: number;
    }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Earnings" />

            <UserProvider userId={user_id}>
                <UserLayout role="driver">
                    <EarningsContent rides={rides} totalEarnings={totalEarnings} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
