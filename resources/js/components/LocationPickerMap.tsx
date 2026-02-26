import L from 'leaflet';
import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// Fix for default marker icon in React Leaflet
if (typeof window !== 'undefined') {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
}

interface LocationPickerMapProps {
    lat: number;
    lng: number;
    onLocationSelect?: (lat: number, lng: number) => void;
    className?: string;
    readOnly?: boolean;
}

// Component to handle map clicks
function MapEvents({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            if (onLocationSelect) {
                onLocationSelect(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Component to update view when props change
function MapUpdater({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView([lat, lng], map.getZoom());
    }, [lat, lng, map]);
    return null;
}

export default function LocationPickerMap({ lat, lng, onLocationSelect, className, readOnly = false }: LocationPickerMapProps) {
    // Default to Addis Ababa if 0,0 provided
    const displayLat = lat || 9.005401;
    const displayLng = lng || 38.763611;

    return (
        <div className={`h-full w-full ${className || ''}`}>
            <MapContainer
                center={[displayLat, displayLng]}
                zoom={13}
                scrollWheelZoom={true}
                className="h-full w-full rounded-md"
                style={{ height: '100%', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[displayLat, displayLng]} />
                {!readOnly && <MapEvents onLocationSelect={onLocationSelect} />}
                <MapUpdater lat={displayLat} lng={displayLng} />
            </MapContainer>
        </div>
    );
}
