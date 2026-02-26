import AppLayout from '@/layouts/app-layout';
import RideLayout from '@/layouts/ride/layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useRef, useState } from 'react';
import echo from '@/lib/reverb';

interface Ride {
    id: number;
    status: string;
    origin_lat: string | number;
    origin_lng: string | number;
    destination_lat: string | number;
    destination_lng: string | number;
    driver_id?: number | null;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Ride Management', href: '/rides' },
    { title: 'Live Tracking', href: '#' },
];

export default function RideTrack({ ride }: { ride: Ride }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<any>(null);
    const driverMarkerRef = useRef<any>(null);
    const [isLive, setIsLive] = useState(false);

    useEffect(() => {
        if (mapRef.current && !map) {
            const origin = { lat: Number(ride.origin_lat), lng: Number(ride.origin_lng) };
            const destination = { lat: Number(ride.destination_lat), lng: Number(ride.destination_lng) };

            const googleMap = new window.google.maps.Map(mapRef.current, {
                center: origin,
                zoom: 14,
                disableDefaultUI: true,
                zoomControl: true,
            });

            // Route Drawing
            const directionsService = new window.google.maps.DirectionsService();
            const directionsRenderer = new window.google.maps.DirectionsRenderer({
                map: googleMap,
                suppressMarkers: false,
            });

            directionsService.route(
                {
                    origin: origin,
                    destination: destination,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result: any, status: any) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                    } else {
                        console.error('Directions request failed due to ' + status);
                    }
                }
            );

            setMap(googleMap);
        }
    }, [ride]);

    useEffect(() => {
        if (!map || !ride.driver_id) return;

        const channel = echo.private(`driver.location.${ride.driver_id}`);
        
        console.log(`[Tracking] Subscribing to driver ${ride.driver_id}`);

        channel.listen('.nearby.drivers', (e: any) => {
            console.log('[Tracking] Location update received:', e);
            setIsLive(true);
            
            const newPos = { lat: Number(e.latitude), lng: Number(e.longitude) };

            if (!driverMarkerRef.current) {
                driverMarkerRef.current = new window.google.maps.Marker({
                    position: newPos,
                    map: map,
                    icon: {
                        path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 6,
                        fillColor: '#3b82f6',
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: '#ffffff',
                        rotation: 0 // We could calculate heading if we had prev pos
                    },
                    title: 'Driver Location'
                });
            } else {
                driverMarkerRef.current.setPosition(newPos);
            }
        });

        return () => {
            console.log(`[Tracking] Unsubscribing from driver ${ride.driver_id}`);
            echo.leaveChannel(`driver.location.${ride.driver_id}`);
        };
    }, [map, ride.driver_id]);

    const isTripActive = ['accepted', 'started', 'arrived', 'in_progress'].includes(ride.status);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Track Ride #${ride.id}`} />

            <RideLayout rideId={ride.id} status={ride.status}>
                <Card className="h-[600px] overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle>Real-time Tracking</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-full relative">
                        <div ref={mapRef} className="w-full h-full" />
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 text-xs">
                            <p className="font-bold flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${isTripActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                                {isTripActive ? 'Live Telemetry Active' : 'Trip Not Started'}
                            </p>
                            <p className="text-muted-foreground mt-1">
                                {isLive ? 'Receiving real-time coordinates' : 'Waiting for driver signal...'}
                            </p>
                            {isTripActive && !isLive && (
                                <p className="text-[10px] text-orange-600 mt-1 font-medium italic">
                                    Driver may be offline or in poor signal area
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </RideLayout>
        </AppLayout>
    );
}
