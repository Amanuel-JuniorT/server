import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

// Common navigation items for all users
const commonNavItems: NavItem[] = [];

// Navigation items specific to passengers
const passengerNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/passenger/profile',
        icon: null,
    },
    {
        title: 'Ride History',
        href: '/passenger/rides',
        icon: null,
    },
    {
        title: 'Payments',
        href: '/passenger/payments',
        icon: null,
    },
    {
        title: 'Favorites',
        href: '/passenger/favorites',
        icon: null,
    },
];

// Navigation items specific to drivers
const driverNavItems: NavItem[] = [
    {
        title: 'Profile',
        href: '/driver/profile',
        icon: null,
    },
    {
        title: 'Trips',
        href: '/driver/trips',
        icon: null,
    },
    {
        title: 'Location',
        href: '/driver/location',
        icon: null,
    },
    {
        title: 'Earnings',
        href: '/driver/earnings',
        icon: null,
    },
    {
        title: 'Vehicle',
        href: '/driver/vehicle',
        icon: null,
    },
    {
        title: 'Schedule',
        href: '/driver/schedule',
        icon: null,
    },
];

interface UserLayoutProps extends PropsWithChildren {
    role?: string;
    userId?: number;
}

export default function UserLayout({ children, role, userId }: UserLayoutProps) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    // Get the ID from props or URL
    const idFromURL = window.location.pathname.split('/').pop();
    const id = userId || (idFromURL && !isNaN(Number(idFromURL)) ? idFromURL : '');

    const currentPath = window.location.pathname;

    // Determine user type and get appropriate navigation items
    const isDriver = role === 'driver';
    const isPassenger = role === 'passenger';

    let navItems = [...commonNavItems];

    if (isDriver) {
        navItems = [...commonNavItems, ...driverNavItems];
    } else if (isPassenger) {
        navItems = [...commonNavItems, ...passengerNavItems];
    }

    const getPageTitle = () => {
        if (isDriver) return 'Driver Profile';
        if (isPassenger) return 'Passenger Profile';
        return 'User Profile';
    };

    const getPageDescription = () => {
        if (isDriver) return 'Manage your driver profile, trips, earnings, and vehicle information';
        if (isPassenger) return 'Manage your passenger profile, ride history, and preferences';
        return 'Manage your profile, settings, and preferences';
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
            <Heading title={getPageTitle()} description={getPageDescription()} />

            <div className="flex min-h-0 flex-1 flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {navItems.map((item, index) => {
                            const itemPath = `${item.href}${id ? `/${id}` : ''}`;
                            const isActive = currentPath === itemPath || currentPath.startsWith(item.href);
                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'w-full justify-start',
                                        isActive ? 'bg-primary/10 text-primary border-primary border font-semibold' : undefined,
                                    )}
                                >
                                    <Link href={itemPath} prefetch>
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="min-h-0 flex-1 overflow-y-auto md:max-w-2xl">
                    <section className="max-w-xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
