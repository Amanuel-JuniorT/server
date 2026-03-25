import { useEffect, useRef, useState } from 'react';

type LatLngLiteral = { lat: number; lng: number };

type MarkerData = {
    position: LatLngLiteral;
    label?: string;
    title?: string;
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

            if (map) return;

            const instance = new window.google.maps.Map(mapRef.current!, {
                center,
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
        map.setCenter(center);
    }, [center.lat, center.lng, map]);

    useEffect(() => {
        if (!map || !window.google) return;

        // Clear existing markers
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];

        // Add new markers
        markers.forEach((mark) => {
            const marker = new window.google.maps.Marker({
                position: mark.position,
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
