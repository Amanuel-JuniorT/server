import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Driver, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Car, Info } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle',
        href: '/driver/vehicle',
    },
];

function VehicleContent({ driver, vehicle }: { driver: Driver; vehicle: any }) {
    if (!vehicle) {
        return (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
                <Car className="text-muted-foreground h-12 w-12" />
                <div className="text-center">
                    <h3 className="text-lg font-medium">No Vehicle Assigned</h3>
                    <p className="text-muted-foreground">This driver does not have a vehicle assigned yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <HeadingSmall title="Vehicle Details" description="Information about the assigned vehicle" />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car className="h-5 w-5 text-blue-600" />
                            General Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Make & Model</p>
                                <p className="text-base font-semibold">
                                    {vehicle.make} {vehicle.model}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Year</p>
                                <p className="text-base font-semibold">{vehicle.year}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Plate Number</p>
                                <p className="text-base font-semibold">{vehicle.plate_number}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Color</p>
                                <p className="text-base font-semibold">{vehicle.color}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Vehicle Type</p>
                                <Badge variant="secondary" className="mt-1">
                                    {vehicle.type?.name || 'Standard'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Capacity</p>
                                <p className="text-base font-semibold">{vehicle.capacity} Passengers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-blue-600" />
                            Vehicle Photos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {driver.car_picture_path ? (
                            <div className="space-y-2">
                                <p className="text-muted-foreground text-center text-sm font-medium">Current vehicle photo</p>
                                <img src={driver.car_picture_path} alt="Vehicle" className="h-48 w-full rounded-lg border object-cover" />
                            </div>
                        ) : (
                            <div className="text-muted-foreground flex flex-col items-center justify-center py-8">
                                <Car className="mb-2 h-12 w-12 opacity-20" />
                                <p>No photo available</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function DriverVehicle() {
    const { driver, vehicle, user_id } = usePage<{
        driver: Driver;
        vehicle: any;
        user_id: number;
    }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Details" />

            <UserProvider userId={user_id}>
                <UserLayout role="driver">
                    <VehicleContent driver={driver} vehicle={vehicle} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
