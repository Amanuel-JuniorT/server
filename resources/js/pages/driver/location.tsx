import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Car, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

type DriverLocation = {
    latitude: number;
    longitude: number;
    updated_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Location',
        href: '/driver/location',
    },
];

function LocationContent({ location, status }: { location?: DriverLocation; status: string }) {
    const [mapKey, setMapKey] = useState(0);

    const formatDate = (date: string) => {
        const dateObj = new Date(date);
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const formattedHours = hours % 12 || 12;
        const formattedDate = dateObj.getDate() + ' ' + dateObj.toLocaleString('en-US', { month: 'long' }) + ' ' + dateObj.getFullYear();
        return formattedDate + '  |  ' + formattedHours + ':' + minutes + ' ' + ampm;
    };

    const handleRecenter = () => {
        setMapKey((prev) => prev + 1);
    };

    const statusMap: Record<string, string> = { available: 'Available', on_ride: 'On Ride', offline: 'Offline' };

    return (
        <div className="space-y-6">
            {/* User Type Badge */}
            <div className="flex items-center justify-between">
                <HeadingSmall title="Driver Location" description={`View driver location`} />
            </div>

            {/* Map Section */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        Live Map
                        <Badge variant={status === 'available' ? 'completed' : status === 'on_ride' ? 'pending' : 'failed'} className="text-sm">
                            <div className="flex items-center space-x-1">
                                <Car className="h-3 w-3" />
                                <span>{statusMap[status]}</span>
                            </div>
                        </Badge>
                    </CardTitle>
                    <CardDescription>Driver's latest reported position</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {location && typeof location.latitude !== 'undefined' && typeof location.longitude !== 'undefined' ? (
                        <div className="space-y-2">
                            {location.updated_at && <p className="text-bold text-sm">Updated at: {formatDate(location.updated_at)}</p>}
                            <div className="rounded-md border">
                                {(() => {
                                    const lat = Number(location.latitude);
                                    const lon = Number(location.longitude);
                                    const delta = 0.01;
                                    const bbox = `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`;
                                    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
                                    const viewUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
                                    return (
                                        <div className="space-y-2">
                                            <iframe key={mapKey} title="Driver location map" className="h-[420px] w-full rounded-md" src={embedUrl} />
                                            <div className="text-muted-foreground flex items-center justify-between text-sm">
                                                <span>
                                                    Lat: {lat.toFixed(6)}, Lng: {lon.toFixed(6)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <Button size="sm" variant="outline" onClick={handleRecenter} className="flex items-center gap-1">
                                                        <RefreshCw className="h-3 w-3" />
                                                        Recenter
                                                    </Button>
                                                    <a href={viewUrl} target="_blank" rel="noreferrer" className="underline">
                                                        View larger map
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Location is currently unavailable.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function DriverLocation() {
    const { location, status } = usePage<{ location?: DriverLocation }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Location" />

            <UserProvider>
                <UserLayout role="driver">
                    <LocationContent location={location} status={status} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
