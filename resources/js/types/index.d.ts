import { LucideIcon } from 'lucide-react';
import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

type RideRequestForm = {
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    pickupAddress: string;
    destinationAddress: string,
};

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    pendingActions?: {
        sos: number;
        drivers: number;
        company_payments: number;
        wallet_topups: number;
    } | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    noOfRides: number;
    name: string;
    email: string;
    profile_picture_path:string;
    role: string;
    phone: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Driver {
    id: number;
    name: string;
    email: string;
    phone: string;
    license_number: string;
    status: string;
    approval_state: string;
    profile_picture_path:string;
    license_image_path:string;
    car_picture_path:string;
    created_at: string;
    updated_at: string;
    noOfRides: number;
    vehicle_type: string;
    vehicle_details: string;
    reject_message: string;
    [key: string]: unknown; // This allows for additional properties...
}

export interface Ride {
    id: number;
    passenger_id: number;
    passenger_name: string;
    passenger_phone: string;
    driver_id: number | null;
    driver_name: string;
    pickup_address: string;
    destination_address: string;
    origin_lat: number;
    origin_lng: number;
    destination_lat: number;
    destination_lng: number;
    price: number;
    status: string;
    cash_payment: boolean;
    prepaid: boolean;
    is_pool_ride: boolean;
    requested_at: string | null;
    started_at: string | null;
    completed_at: string | null;
    cancelled_at: string | null;
    created_at: string;
    payment_status: string | null;
    rating: number | null;
    dispatched_by_admin_id: number | null;
    cancelled_by: string | null;
    notified_driver_id: number | null;
    notified_driver_name: string | null;
    notified_driver_phone: string | null;
    notified_drivers_count: number;
}

export interface RideStats {
    total_rides: number;
    live_rides: number;
    requested_rides: number;
    completed_rides: number;
    cancelled_rides: number;
}
