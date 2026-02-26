import { Link, usePage } from '@inertiajs/react';
import { Car } from 'lucide-react';

import { SharedData } from '@/types';

export function FloatingRideButton() {
    const { url, auth } = usePage<SharedData>().props;

    // Hide for Company Admins (they use the dashboard)
    if (auth.user?.role === 'company_admin') {
        return null;
    }

    // Hide the button on the ride request page
    if (url === '/request-ride') {
        return null;
    }

    return (
        <Link
            href="/request-ride"
            className="fixed right-6 bottom-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-blue-700 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            title="Request Ride"
        >
            <Car className="h-8 w-8" />
        </Link>
    );
}
