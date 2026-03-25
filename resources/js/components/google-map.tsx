import { useEffect, useRef, useState } from 'react';

type LatLngLiteral = { lat: number; lng: number };

type MarkerData = {
    position: LatLngLiteral;
    label?: string;
    title?: string;
};

const isValidCoordinate = (val: any): val is number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) && isFinite(num);
};

const ensureNumber = (val: any): number => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return isValidCoordinate(num) ? num : 0;
};

type GoogleMapProps = {
    center: LatLngLiteral;
    zoom?: number;
    heightClassName?: string;
    onMapReady?: (map: any) => void;
    markers?: MarkerData[];
    polylineEncoding?: string;
};

export default function GoogleMap({ center, zoom = 14, heightClassName = 'h-[360px]', onMapReady, markers = [], polylineEncoding }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any | null>(null);

    useEffect(() => {
        if (!mapRef.current) return;
        if (typeof window === 'undefined') return;

        const initMap = () => {
            if (!window.google || !window.google.maps) {
                setTimeout(initMap, 100);
                return;
            }

            const validCenter = {
                lat: ensureNumber(center.lat),
                lng: ensureNumber(center.lng)
            };

            const instance = new window.google.maps.Map(mapRef.current!, {
                center: validCenter,
                zoom,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });
            setMap(instance);
            onMapReady?.(instance);
        };

        initMap();
    }, []);

    useEffect(() => {
        if (!map) return;
        const lat = ensureNumber(center.lat);
        const lng = ensureNumber(center.lng);
        if (isValidCoordinate(lat) && isValidCoordinate(lng)) {
            map.setCenter({ lat, lng });
        }
    }, [center.lat, center.lng, map]);

    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach((mark) => {
            const lat = ensureNumber(mark.position.lat);
            const lng = ensureNumber(mark.position.lng);
            
            if (!isValidCoordinate(lat) || !isValidCoordinate(lng)) {
                console.warn('GoogleMap: Skipping invalid marker position', mark);
                return;
            }

            const marker = new window.google.maps.Marker({
                position: { lat, lng },
                map: map,
                label: mark.label,
                title: mark.title,
            });
            markersRef.current.push(marker);
        });
    }, [markers, map]);

    useEffect(() => {
        if (!map || !window.google || !polylineEncoding) {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
                polylineRef.current = null;
            }
            return;
        }

        if (polylineRef.current) {
            polylineRef.current.setMap(null);
        }

        const path = window.google.maps.geometry.encoding.decodePath(polylineEncoding);
        const polyline = new window.google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#3b82f6', // blue-500
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: map,
        });

        polylineRef.current = polyline;

        // Auto-fit map if polyline exists
        const bounds = new window.google.maps.LatLngBounds();
        path.forEach((latLng: any) => bounds.extend(latLng));
        map.fitBounds(bounds);

    }, [polylineEncoding, map]);

    return <div ref={mapRef} className={`w-full rounded-md ${heightClassName}`} />;
}
