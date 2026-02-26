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
};

export default function GoogleMap({ center, zoom = 14, heightClassName = 'h-[360px]', onMapReady, markers = [] }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement | null>(null);
    const [map, setMap] = useState<any | null>(null);
    const markersRef = useRef<any[]>([]);

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

    return <div ref={mapRef} className={`w-full rounded-md ${heightClassName}`} />;
}
