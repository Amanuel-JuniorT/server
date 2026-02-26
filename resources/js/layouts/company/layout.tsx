import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

interface CompanyLayoutProps extends PropsWithChildren {
    companyId: number;
}

export default function CompanyLayout({ children, companyId }: CompanyLayoutProps) {
    // When server-side rendering, we only render the layout on the client...
    if (typeof window === 'undefined') {
        return null;
    }

    const currentPath = window.location.pathname;

    // Navigation items with company ID
    const navItems: NavItem[] = [
        {
            title: 'Profile',
            href: `/company/profile/${companyId}`,
            icon: null,
        },
        {
            title: 'Employees',
            href: `/company/${companyId}/employees`,
            icon: null,
        },
        {
            title: 'Drivers',
            href: `/company/${companyId}/drivers`,
            icon: null,
        },
        {
            title: 'Rides',
            href: `/company/${companyId}/rides`,
            icon: null,
        },
    ];

    const getPageTitle = () => {
        return 'Company Profile';
    };

    const getPageDescription = () => {
        return 'View company details, employees, drivers, and ride history';
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
            <Heading title={getPageTitle()} description={getPageDescription()} />

            <div className="flex min-h-0 flex-1 flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-12">
                <aside className="w-full max-w-xl lg:w-48">
                    <nav className="flex flex-col space-y-1 space-x-0">
                        {navItems.map((item, index) => {
                            const isActive = currentPath === item.href || currentPath.startsWith(item.href + '/');
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
                                    <Link href={item.href} prefetch>
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </aside>

                <Separator className="my-6 md:hidden" />

                <div className="min-h-0 flex-1 overflow-y-auto md:max-w-5xl">
                    <section className="max-w-4xl space-y-12">{children}</section>
                </div>
            </div>
        </div>
    );
}
