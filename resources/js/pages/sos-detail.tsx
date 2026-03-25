import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import GoogleMap from '@/components/google-map';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { 
    AlertTriangle, 
    ArrowLeft, 
    Calendar, 
    Car, 
    CheckCircle2, 
    Clock, 
    MapPin, 
    MessageSquare, 
    Phone, 
    Shield, 
    User,
    UserCircle
} from 'lucide-react';
import { useState } from 'react';

interface SosAlert {
    id: number;
    user: { name: string; phone: string };
    ride: {
        id: number;
        status: string;
        pickup_address: string;
        destination_address: string;
        origin_lat: number;
        origin_lng: number;
        destination_lat: number;
        destination_lng: number;
        passenger: { name: string; phone: string };
        driver: {
            user: { name: string; phone: string };
            vehicle_type: string;
            plate_number: string;
            make: string;
            model: string;
            location?: { latitude: number; longitude: number };
        };
        route_polyline?: string;
    } | null;
    status: 'open' | 'resolved' | 'false_alarm';
    latitude: number;
    longitude: number;
    message: string | null;
    created_at: string;
    resolved_at: string | null;
    resolution_note: string | null;
    resolver?: { name: string };
}

interface Props {
    alert: SosAlert;
}

export default function SosDetail({ alert }: Props) {
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionNote, setResolutionNote] = useState('');

    const handleResolve = (status: 'resolved' | 'false_alarm') => {
        if (!confirm(`Mark this alert as ${status.replace('_', ' ')}?`)) return;
        
        setIsResolving(true);
        router.post(`/sos/${alert.id}/resolve`, {
            status,
            note: resolutionNote || `Resolved by Administrator`,
        }, {
            onFinish: () => setIsResolving(false)
        });
    };

    const parseCoord = (val: any) => {
        const n = typeof val === 'string' ? parseFloat(val) : val;
        return typeof n === 'number' && !isNaN(n) && isFinite(n) ? n : null;
    };

    const sosLat = parseCoord(alert.latitude);
    const sosLng = parseCoord(alert.longitude);

    const markers = [];
    
    if (sosLat !== null && sosLng !== null) {
        markers.push({
            position: { lat: sosLat, lng: sosLng },
            label: 'SOS',
            title: 'SOS Alert Trigger Location',
        });
    }

    if (alert.ride?.driver?.location) {
        const dLat = parseCoord(alert.ride.driver.location.latitude);
        const dLng = parseCoord(alert.ride.driver.location.longitude);
        
        if (dLat !== null && dLng !== null) {
            markers.push({
                position: { lat: dLat, lng: dLng },
                label: 'D',
                title: `Driver: ${alert.ride.driver.user.name}`,
            });
        }
    }

    if (alert.ride) {
        const pLat = parseCoord(alert.ride.origin_lat);
        const pLng = parseCoord(alert.ride.origin_lng);
        const destLat = parseCoord(alert.ride.destination_lat);
        const destLng = parseCoord(alert.ride.destination_lng);

        if (pLat !== null && pLng !== null) {
            markers.push({
                position: { lat: pLat, lng: pLng },
                label: 'P',
                title: `Pickup: ${alert.ride.pickup_address}`,
            });
        }

        if (destLat !== null && destLng !== null) {
            markers.push({
                position: { lat: destLat, lng: destLng },
                label: 'D',
                title: `Destination: ${alert.ride.destination_address}`,
            });
        }
    }

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'open': return 'destructive';
            case 'resolved': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'SOS Alerts', href: '/sos' },
            { title: `Alert #${alert.id}`, href: `/sos/${alert.id}` }
        ]}>
            <Head title={`SOS Alert #${alert.id} Details`} />

            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sos">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-bold tracking-tight">SOS Alert Details</h1>
                                <Badge variant={getStatusVariant(alert.status)}>
                                    {alert.status.toUpperCase()}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">Emergency signal received from {alert.user.name}</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Sidebar Info */}
                    <div className="flex flex-col gap-6 lg:col-span-1">
                        {/* Requester Card */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <UserCircle className="h-5 w-5 text-destructive" />
                                    Alert Requester
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Name</span>
                                    <span className="text-lg font-semibold">{alert.user.name}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Phone Number</span>
                                    <a href={`tel:${alert.user.phone}`} className="text-lg font-semibold flex items-center gap-2 text-primary hover:underline">
                                        <Phone className="h-4 w-4" /> {alert.user.phone}
                                    </a>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Trigger Time</span>
                                    <span className="font-medium flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> {new Date(alert.created_at).toLocaleString()}
                                    </span>
                                </div>
                                {alert.message && (
                                    <div className="mt-2 p-3 bg-destructive/5 rounded-md border border-destructive/10">
                                        <span className="text-xs text-destructive font-bold uppercase block mb-1">Alert Message</span>
                                        <p className="text-sm">{alert.message}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Ride & Driver Card */}
                        {alert.ride ? (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Car className="h-5 w-5 text-primary" />
                                        Associated Ride Information
                                    </CardTitle>
                                    <CardDescription>Ride #{alert.ride.id} - Status: {alert.ride.status}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="border-t pt-4">
                                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Driver Details</span>
                                        <div className="space-y-2">
                                            <div className="font-medium flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-blue-500" />
                                                {alert.ride.driver.user.name}
                                            </div>
                                            <div className="text-sm flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5" />
                                                {alert.ride.driver.user.phone}
                                            </div>
                                            <div className="text-sm flex items-center gap-2 text-muted-foreground">
                                                <Car className="h-3.5 w-3.5" />
                                                {alert.ride.driver.make} {alert.ride.driver.model} ({alert.ride.driver.plate_number})
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Route Details</span>
                                        <div className="space-y-3">
                                            <div className="flex gap-2">
                                                <MapPin className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                                                <div>
                                                    <span className="text-xs font-semibold block">Pickup Address</span>
                                                    <span className="text-sm">{alert.ride.pickup_address}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <MapPin className="h-4 w-4 text-destructive mt-1 shrink-0" />
                                                <div>
                                                    <span className="text-xs font-semibold block">Destination Address</span>
                                                    <span className="text-sm">{alert.ride.destination_address}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="bg-muted/50 border-dashed">
                                <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                    <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                                    <p className="text-sm font-medium">No associated ride found for this SOS alert.</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Resolution Info (if resolved) */}
                        {alert.status !== 'open' && (
                            <Card className="bg-green-50/50 border-green-100">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Resolution Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase font-bold">Resolved By</span>
                                            <span className="font-semibold">{alert.resolver?.name || 'Administrator'}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-xs uppercase font-bold">Time</span>
                                            <span className="font-semibold">{alert.resolved_at ? new Date(alert.resolved_at).toLocaleString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block text-xs uppercase font-bold mb-1">Resolution Note</span>
                                        <p className="text-sm italic">{alert.resolution_note || 'No notes provided.'}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Main Map and Actions */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <Card className="flex-1 overflow-hidden flex flex-col min-h-[500px]">
                            <CardHeader className="border-b bg-muted/30">
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5" />
                                    Live Location Context
                                </CardTitle>
                                <CardDescription>Red: Alert Location | Blue: Driver Last Known | Green: Pickup</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0 flex-1 relative">
                                <GoogleMap 
                                    center={{ 
                                        lat: sosLat ?? 0, 
                                        lng: sosLng ?? 0 
                                    }} 
                                    zoom={15}
                                    heightClassName="h-full min-h-[500px]"
                                    markers={markers}
                                    polylineEncoding={alert.ride?.route_polyline}
                                />
                                
                                <div className="absolute bottom-4 left-4 z-10 space-y-2">
                                    <div className="bg-white p-2 rounded shadow-md text-xs font-semibold flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-destructive" /> SOS Trigger
                                    </div>
                                    {alert.ride?.driver?.location && (
                                        <div className="bg-white p-2 rounded shadow-md text-xs font-semibold flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-blue-500" /> Driver Location
                                        </div>
                                    )}
                                    {alert.ride && (
                                        <div className="bg-white p-2 rounded shadow-md text-xs font-semibold flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full bg-green-500" /> Ride Path
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Resolution Interface (only for open alerts) */}
                        {alert.status === 'open' && (
                            <Card className="border-destructive/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5" />
                                        Update Resolution Progress
                                    </CardTitle>
                                    <CardDescription>Document actions taken and final resolution of this emergency.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <textarea
                                        placeholder="Enter resolution notes, actions taken, or result of emergency contact..."
                                        className="w-full min-h-[100px] p-3 rounded-md border focus:ring-2 focus:ring-primary outline-none"
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-3">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => handleResolve('false_alarm')}
                                            disabled={isResolving}
                                        >
                                            Mark as False Alarm
                                        </Button>
                                        <Button 
                                            variant="destructive"
                                            onClick={() => handleResolve('resolved')}
                                            disabled={isResolving}
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Resolve Emergency
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
