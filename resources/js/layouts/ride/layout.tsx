import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

const rideNavItems: NavItem[] = [
    {
        title: 'Ride Details',
        href: '/rides',
        icon: null,
    },
    {
        title: 'Timeline',
        href: '/rides/timeline',
        icon: null,
    },
];

interface RideLayoutProps extends PropsWithChildren {
    rideId: number;
    status: string;
}

export default function RideLayout({ children, rideId, status }: RideLayoutProps) {
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    const navItems = [...rideNavItems];
    
    // Add Tracking tab only for active rides
    const isActive = ['accepted', 'in_progress'].includes(status);
    if (isActive) {
        navItems.splice(1, 0, {
            title: 'Live Tracking',
            href: '/rides/track',
            icon: null,
        });
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
            <Heading 
                title={`Ride #${rideId}`} 
                description="View comprehensive ride details, live tracking, and audit timeline" 
            />

            <div className="flex min-h-0 flex-1 flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {navItems.map((item, index) => {
                            const itemPath = item.href === '/rides' ? `/rides/${rideId}` : `${item.href}/${rideId}`;
                            const isCurrent = currentPath === itemPath;
                            
                            return (
                                <Button
                                    key={`${item.href}-${index}`}
                                    size="sm"
                                    variant="ghost"
                                    asChild
                                    className={cn(
                                        'w-full justify-start',
                                        isCurrent ? 'bg-primary/10 text-primary border-primary border font-semibold' : undefined,
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
