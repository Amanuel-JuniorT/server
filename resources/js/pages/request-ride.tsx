import GoogleMap from '@/components/google-map';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Car, MapPin, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface RequestRideProps {
    vehicleTypes: Array<{
        id: number;
        name: string;
        display_name: string;
        base_fare: string;
        image_path: string;
    }>;
}

export default function RequestRide({ vehicleTypes }: RequestRideProps) {
    const { auth } = usePage<SharedData>().props;

    const [pickupLocation, setPickupLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [rideType, setRideType] = useState('standard');
    const [center, setCenter] = useState<{ lat: number; lng: number }>({ lat: 8.9806, lng: 38.7578 });
    const pickupRef = useRef<HTMLInputElement | null>(null);
    const destinationRef = useRef<HTMLInputElement | null>(null);
    const mapRef = useRef<unknown | null>(null);
    const directionsServiceRef = useRef<unknown | null>(null);
    const directionsRendererRef = useRef<unknown | null>(null);
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [pickupPreds, setPickupPreds] = useState<Array<{ description: string; place_id: string }>>([]);
    const [destinationPreds, setDestinationPreds] = useState<Array<{ description: string; place_id: string }>>([]);
    const [selectedPickupPlaceId, setSelectedPickupPlaceId] = useState<string | null>(null);
    const [selectedDestinationPlaceId, setSelectedDestinationPlaceId] = useState<string | null>(null);
    const [isMapReady, setIsMapReady] = useState(false);

    const [passengerPhone, setPassengerPhone] = useState('');
    const [passenger, setPassenger] = useState<any>(null);
    const [isSearchingPassenger, setIsSearchingPassenger] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<any>({
        passenger_id: '',
        phone: '',
        originLat: 0,
        originLng: 0,
        destLat: 0,
        destLng: 0,
        pickupAddress: '',
        destinationAddress: '',
        vehicle_type_id: '',
        rideType: 'standard',
    });

    // Geocode helpers triggered on button click to control costs
    const geocodeAddress = (address: string): Promise<{ lat: number; lng: number } | null> => {
        return new Promise((resolve) => {
            if (!window.google || !window.google.maps || !address.trim()) return resolve(null);
            const geocoder = new window.google.maps.Geocoder();
            type GeocodeLite = { geometry?: { location?: { lat: () => number; lng: () => number } } };
            geocoder.geocode({ address }, (results: GeocodeLite[] | null, status: string) => {
                const r = results;
                if (status === 'OK' && r?.[0]?.geometry?.location) {
                    resolve({ lat: r[0].geometry.location.lat(), lng: r[0].geometry.location.lng() });
                } else {
                    console.warn('[Maps] Geocode failed', { address, status });
                    resolve(null);
                }
            });
        });
    };

    const ensureDirections = (): boolean => {
        if (!window.google || !window.google.maps || !mapRef.current) return false;
        if (!directionsServiceRef.current) directionsServiceRef.current = new window.google.maps.DirectionsService();
        if (!directionsRendererRef.current) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const m: any = mapRef.current as any;
            const renderer = new window.google.maps.DirectionsRenderer({ suppressMarkers: false });
            renderer.setMap(m);
            directionsRendererRef.current = renderer;
        }
        return true;
    };

    const maybeDrawRoute = () => {
        if (!pickupCoords || !destinationCoords) return;
        if (!ensureDirections()) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const svc: any = directionsServiceRef.current as any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rnd: any = directionsRendererRef.current as any;
        svc.route(
            {
                origin: pickupCoords,
                destination: destinationCoords,
                travelMode: 'DRIVING',
            },
            (result: { routes?: Array<{ legs?: Array<{ distance?: { text?: string }; duration?: { text?: string } }> }> } | null, status: string) => {
                const res = result;
                if (status === 'OK' && res) {
                    rnd.setDirections(res as never);
                    try {
                        const leg = res?.routes?.[0]?.legs?.[0];
                        console.log('[Maps] Route', { distanceText: leg?.distance?.text, durationText: leg?.duration?.text });
                    } catch {
                        console.log('[Maps] Route parsed with minor issues');
                    }
                } else {
                    console.warn('[Maps] Directions failed', { status, result: res });
                }
            },
        );
    };

    const handleSetPickup = async () => {
        if (selectedPickupPlaceId && window.google && window.google.maps) {
            const svc = new window.google.maps.places.PlacesService(document.createElement('div'));
            type PlaceLite = { geometry?: { location?: { lat: () => number; lng: () => number } }; formatted_address?: string };
            svc.getDetails(
                { placeId: selectedPickupPlaceId, fields: ['geometry', 'formatted_address'] },
                (place: PlaceLite | null, status: string) => {
                    if (status === 'OK' && place?.geometry?.location) {
                        const loc = place.geometry.location;
                        const coords = { lat: loc.lat(), lng: loc.lng() };
                        setPickupLocation(place.formatted_address ?? pickupLocation);
                        setPickupCoords(coords);
                        setData('originLat', coords.lat);
                        setData('originLng', coords.lng);
                        setCenter(coords);
                        setPickupPreds([]);
                    } else {
                        console.warn('[Maps] Place details failed for pickup', { status });
                    }
                },
            );
            return;
        }
        const coords = await geocodeAddress(pickupLocation);
        if (coords) {
            setPickupCoords(coords);
            setCenter(coords);
            setData('originLat', coords.lat);
            setData('originLng', coords.lng);
        }
    };

    useEffect(() => {
        if (pickupCoords && destinationCoords && isMapReady) {
            maybeDrawRoute();
        }
    }, [pickupCoords, destinationCoords, isMapReady]);

    const handleSetDestination = async () => {
        if (selectedDestinationPlaceId && window.google && window.google.maps) {
            const svc = new window.google.maps.places.PlacesService(document.createElement('div'));
            type PlaceLite = { geometry?: { location?: { lat: () => number; lng: () => number } }; formatted_address?: string };
            svc.getDetails(
                { placeId: selectedDestinationPlaceId, fields: ['geometry', 'formatted_address'] },
                (place: PlaceLite | null, status: string) => {
                    if (status === 'OK' && place?.geometry?.location) {
                        const loc = place.geometry.location;
                        const coords = { lat: loc.lat(), lng: loc.lng() };
                        setDestination(place.formatted_address ?? destination);
                        setDestinationCoords(coords);
                        setData('destLat', coords.lat);
                        setData('destLng', coords.lng);
                        setDestinationPreds([]);
                    } else {
                        console.warn('[Maps] Place details failed for destination', { status });
                    }
                },
            );
            return;
        }
        const coords = await geocodeAddress(destination);
        if (coords) {
            setDestinationCoords(coords);
            setData('destLat', coords.lat);
            setData('destLng', coords.lng);
        }
    };

    const handleSearchPickup = () => {
        if (!window.google || !window.google.maps) return;
        const svc = new window.google.maps.places.AutocompleteService();
        svc.getPlacePredictions(
            { input: pickupLocation, componentRestrictions: { country: ['et'] } },
            (predictions: Array<{ description: string; place_id: string }> | null, status: string) => {
                if (status === 'OK' && Array.isArray(predictions)) {
                    setPickupPreds(predictions.map((p) => ({ description: p.description, place_id: p.place_id })));
                } else {
                    setPickupPreds([]);
                }
            },
        );
    };

    const handleSearchDestination = () => {
        if (!window.google || !window.google.maps) return;
        const svc = new window.google.maps.places.AutocompleteService();
        svc.getPlacePredictions(
            { input: destination, componentRestrictions: { country: ['et'] } },
            (predictions: Array<{ description: string; place_id: string }> | null, status: string) => {
                if (status === 'OK' && Array.isArray(predictions)) {
                    setDestinationPreds(predictions.map((p) => ({ description: p.description, place_id: p.place_id })));
                } else {
                    setDestinationPreds([]);
                }
            },
        );
    };

    const searchPassenger = async () => {
        let phone = passengerPhone;
        // Handle prefixing
        if (phone.startsWith('0')) {
            phone = '+251' + phone.substring(1);
        } else if (phone.length === 9 && !phone.startsWith('+')) {
            phone = '+251' + phone;
        }
        setPassengerPhone(phone);
        setData('phone', phone);

        if (!phone) return;
        setIsSearchingPassenger(true);
        try {
            const response = await fetch(`/api/passengers/search?phone=${encodeURIComponent(phone)}`);
            const result = await response.json();
            if (response.ok) {
                setPassenger(result.user);
                setData('passenger_id', result.user.id);
            } else {
                setPassenger(null);
                setData('passenger_id', '');
                // Check if it's a "not found" case to offer registration
                if (response.status === 404) {
                    if (confirm(`Passenger with phone ${phone} not found. Would you like to register them as a new passenger and continue?`)) {
                        setPassenger({ name: 'New Passenger (To be registered)', phone: phone, is_new: true });
                        setData('passenger_id', ''); // Controller will handle creation since id is null
                    }
                } else {
                    alert(result.message || 'Passenger not found');
                }
            }
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setIsSearchingPassenger(false);
        }
    };

    const handleRequestRide = () => {
        if (!passenger && !data.phone) {
            alert('Please select or enter a passenger first');
            return;
        }
        post(route('request-ride.store'), {
            onSuccess: () => {
                reset();
                setPassenger(null);
                setPassengerPhone('');
                setPickupCoords(null);
                setDestinationCoords(null);
                setPickupLocation('');
                setDestination('');
                alert('Ride requested successfully');
            },
        });
    };

    // Debug: verify Google Maps API accessibility and basic functionality
    useEffect(() => {
        let attempts = 0;
        const maxAttempts = 20;
        const intervalMs = 250;
        let dynamicLoaded = false;

        const runSanityCheck = () => {
            if (!(window.google && window.google.maps)) return;
            const version = window.google.maps.version;
            console.log('[Maps] Google Maps JS loaded', { version });

            try {
                type GeocodeResultLite = { geometry?: { location?: { toJSON?: () => { lat: number; lng: number } } } };
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ address: 'Addis Ababa' }, (results: GeocodeResultLite[] | null, status: string) => {
                    const loc = results?.[0]?.geometry?.location?.toJSON?.();
                    console.log('[Maps] Geocode test', { status, location: loc });
                });
            } catch (err) {
                console.error('[Maps] Geocode test failed', err);
            }
        };

        const tryDynamicLoad = () => {
            if (dynamicLoaded) return;
            dynamicLoaded = true;
            const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
            if (existing) {
                existing.addEventListener('load', () => {
                    console.log('[Maps] Existing script emitted load');
                    setTimeout(runSanityCheck, 200);
                });
                existing.addEventListener('error', (e: Event) => {
                    console.warn('[Maps] Existing script emitted error', e);
                });
                return;
            }

            const key = (document.querySelector('meta[name="google-maps-key"]') as HTMLMetaElement | null)?.content;
            if (!key) {
                console.warn('[Maps] No API key meta tag present; cannot dynamically load');
                return;
            }
            const s = document.createElement('script');
            s.id = 'google-maps-script';
            s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
            s.async = true;
            s.defer = true;
            s.addEventListener('load', () => {
                console.log('[Maps] Dynamic script loaded');
                setTimeout(runSanityCheck, 200);
            });
            s.addEventListener('error', (e: Event) => {
                console.warn('[Maps] Dynamic script failed to load', e);
            });
            document.head.appendChild(s);
        };

        const checkGoogle = () => {
            if (typeof window !== 'undefined' && window.google && window.google.maps) {
                runSanityCheck();
                return;
            }
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkGoogle, intervalMs);
            } else {
                console.warn('[Maps] Google Maps JS not available after waiting');
                tryDynamicLoad();
            }
        };

        checkGoogle();
    }, []);

    // Remove the redundant handler from earlier

    const content = (
        <div className="container mx-auto max-w-5xl p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manual Dispatch</h1>
                    <p className="text-muted-foreground">Request a ride on behalf of a passenger</p>
                </div>
                <Link href="/rides" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> Back to Rides
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="space-y-6">
                    {/* Passenger Search */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Passenger Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-2">
                                <div className="bg-background flex flex-1 items-center rounded-md border">
                                    <span className="text-muted-foreground flex items-center gap-1 border-r px-3 py-2 text-sm font-medium select-none">
                                        <Phone className="h-4 w-4" />
                                        +251
                                    </span>
                                    <Input
                                        placeholder="9XXXXXXXX"
                                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                        value={passengerPhone}
                                        onChange={(e) => setPassengerPhone(e.target.value)}
                                    />
                                </div>
                                <Button variant="secondary" onClick={searchPassenger} disabled={isSearchingPassenger}>
                                    {isSearchingPassenger ? '...' : 'Search'}
                                </Button>
                            </div>

                            {passenger && (
                                <div className="mt-4 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-200 font-bold text-blue-700">
                                            {passenger.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-blue-900">{passenger.name}</p>
                                            <p className="text-sm text-blue-700">{passenger.email}</p>
                                        </div>
                                    </div>
                                    <Badge>Verified Passenger</Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Trip Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Trip Locations</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pickup Address</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                        <Input
                                            placeholder="Enter pickup location"
                                            className="pl-9"
                                            value={pickupLocation}
                                            onChange={(e) => {
                                                setPickupLocation(e.target.value);
                                                setData('pickupAddress', e.target.value);
                                            }}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleSearchPickup}>
                                        Search
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleSetPickup}>
                                        Pin
                                    </Button>
                                </div>
                                {pickupPreds.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full max-w-sm overflow-hidden rounded border bg-white shadow-sm">
                                        {pickupPreds.map((p) => (
                                            <button
                                                key={p.place_id}
                                                type="button"
                                                className="w-full truncate p-2 text-left text-sm hover:bg-gray-100"
                                                onClick={() => {
                                                    setSelectedPickupPlaceId(p.place_id);
                                                    setPickupLocation(p.description);
                                                    setData('pickupAddress', p.description);
                                                    setPickupPreds([]);
                                                }}
                                            >
                                                {p.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Destination Address</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                        <Input
                                            placeholder="Enter destination"
                                            className="pl-9"
                                            value={destination}
                                            onChange={(e) => {
                                                setDestination(e.target.value);
                                                setData('destinationAddress', e.target.value);
                                            }}
                                        />
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleSearchDestination}>
                                        Search
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleSetDestination}>
                                        Pin
                                    </Button>
                                </div>
                                {destinationPreds.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full max-w-sm overflow-hidden rounded border bg-white shadow-sm">
                                        {destinationPreds.map((p) => (
                                            <button
                                                key={p.place_id}
                                                type="button"
                                                className="w-full truncate p-2 text-left text-sm hover:bg-gray-100"
                                                onClick={() => {
                                                    setSelectedDestinationPlaceId(p.place_id);
                                                    setDestination(p.description);
                                                    setData('destinationAddress', p.description);
                                                    setDestinationPreds([]);
                                                }}
                                            >
                                                {p.description}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Ride Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {vehicleTypes?.map((type) => (
                                    <Button
                                        key={type.id}
                                        type="button"
                                        variant={data.vehicle_type_id === type.id ? 'default' : 'outline'}
                                        onClick={() => {
                                            setData('vehicle_type_id', type.id);
                                            setData('rideType', type.name.toLowerCase() === 'pool' ? 'pool' : 'standard');
                                        }}
                                        className="flex h-auto flex-col gap-1 px-1 py-3 capitalize"
                                    >
                                        <div className="relative mb-1 h-10 w-20">
                                            {type.image_path ? (
                                                <img src={type.image_path} alt={type.display_name} className="h-full w-full object-contain" />
                                            ) : (
                                                <Car className="mx-auto h-8 w-8" />
                                            )}
                                        </div>
                                        <span className="text-center text-[10px] font-semibold">{type.display_name}</span>
                                    </Button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        size="lg"
                        type="button"
                        className="h-14 w-full text-xl font-bold"
                        onClick={handleRequestRide}
                        disabled={processing || !passenger || !pickupCoords || !destinationCoords}
                    >
                        {processing ? 'Processing...' : 'Dispatch Ride'}
                    </Button>
                </div>

                <div className="space-y-6">
                    <Card className="min-h-[500px] overflow-hidden">
                        <GoogleMap
                            center={center}
                            heightClassName="h-full min-h-[500px]"
                            onMapReady={(map) => {
                                mapRef.current = map;
                                setIsMapReady(true);
                            }}
                            markers={[
                                ...(pickupCoords ? [{ position: pickupCoords, label: 'P', title: 'Pickup' }] : []),
                                ...(destinationCoords ? [{ position: destinationCoords, label: 'D', title: 'Destination' }] : []),
                            ]}
                        />
                    </Card>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <Head title="Request Ride" />
            {auth.user ? <AppLayout>{content}</AppLayout> : <div className="min-h-screen bg-gray-50">{content}</div>}
        </>
    );
}
