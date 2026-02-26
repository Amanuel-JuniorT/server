import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import echo from '@/lib/reverb';
import { type NavItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    Bell,
    Building2,
    Car,
    CreditCard,
    FileText,
    LayoutGrid,
    Map,
    Send,
    Settings,
    Ticket,
    User,
    Users,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import AppLogo from './app-logo';

// Super Admin navigation sections
const superAdminNavItems = [
    {
        group: 'Overview',
        items: [{ title: 'Dashboard', href: '/dashboard', icon: LayoutGrid }],
    },
    {
        group: 'Operations',
        items: [
            { title: 'Ride Management', href: '/rides', icon: Map },
            { title: 'Manual Dispatch', href: '/request-ride', icon: Send },
            { title: 'SOS Alerts', href: '/sos', icon: AlertTriangle },
        ],
    },
    {
        group: 'Management',
        items: [
            { title: 'Passengers', href: '/passengers', icon: Users },
            { title: 'Drivers', href: '/drivers', icon: Car },
            { title: 'Vehicle Types', href: '/vehicle-types', icon: Car },
            { title: 'Companies', href: '/companies', icon: Building2 },
            { title: 'Employees', href: '/company-employees', icon: Users },
        ],
    },
    {
        group: 'Finance',
        items: [
            { title: 'Payment Receipts', href: '/payment-receipts', icon: Ticket },
            { title: 'Transactions', href: '/transactions', icon: CreditCard },
        ],
    },
    {
        group: 'System',
        items: [
            { title: 'Promotions', href: '/promotions', icon: Ticket },
            { title: 'Notifications', href: '/notifications', icon: Bell },
            { title: 'System Logs', href: '/logs', icon: Activity },
            { title: 'Audit Trail', href: '/audit', icon: FileText },
            { title: 'Admins', href: '/admin/admins', icon: Settings },
        ],
    },
];

// Company Admin navigation sections
const companyAdminNavItems = [
    {
        group: 'Overview',
        items: [{ title: 'Dashboard', href: '/company-admin/dashboard', icon: LayoutGrid }],
    },
    {
        group: 'Management',
        items: [
            { title: 'My Employees', href: '/company-admin/employees', icon: Users },
            { title: 'Ride Groups', href: '/company-admin/ride-groups', icon: Users },
            { title: 'Company Profile', href: '/company-admin/profile', icon: Settings },
        ],
    },
    {
        group: 'Finance',
        items: [{ title: 'Payment Receipts', href: '/company-admin/payment-receipts', icon: Ticket }],
    },
];

const userNavItems: NavItem[] = [
    {
        title: 'My Profile',
        href: '/settings/profile',
        icon: User,
    },
];

export function AppSidebar() {
    const page = usePage();
    const { auth, pendingActions } = page.props as any;

    // Determine which navigation items to show based on user role
    const mainNavItems = auth.user?.role === 'company_admin' ? companyAdminNavItems : superAdminNavItems;

    // Determine dashboard link based on role
    const dashboardHref = auth.user?.role === 'company_admin' ? '/company-admin/dashboard' : '/dashboard';

    useEffect(() => {
        if (auth.user?.role !== 'super_admin') return;

        // Request browser notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const channel = echo.channel('admin-alerts');

        channel.listen('.admin.notification', (e: any) => {
            console.log('Admin notification received:', e);

            // Play a subtle sound if possible or just show toast/notification
            toast.info(e.message);

            // Refresh only the pendingActions shared prop
            router.reload({
                only: ['pendingActions'],
                onSuccess: () => {
                    console.log('Pending actions refreshed');
                },
            });

            // Show browser notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Ethio-Cab Admin', {
                    body: e.message,
                    icon: '/favicon.ico',
                });
            }
        });

        channel.listen('.sos.received', (e: any) => {
            console.log('SOS alert received in sidebar:', e);
            toast.error('EMERGENCY: New SOS Alert Received!');
            router.reload({ only: ['pendingActions'] });

            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('EMERGENCY: SOS Alert', {
                    body: `New SOS alert from ${e.alert?.user?.name || 'Unknown'}`,
                    icon: '/favicon.ico',
                });
            }
        });

        return () => {
            echo.leaveChannel('admin-alerts');
        };
    }, [auth.user?.id]);

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {mainNavItems.map((group) => (
                    <SidebarGroup key={group.group} className="px-2 py-0">
                        <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const pendingActions = page.props.pendingActions as any;
                                const isSuperAdmin = auth.user?.role === 'super_admin';

                                let pendingCount = 0;
                                let showDot = false;

                                if (isSuperAdmin && pendingActions) {
                                    if (item.title === 'Dashboard') {
                                        showDot = Object.values(pendingActions).some((count: any) => count > 0);
                                    } else if (item.title === 'SOS Alerts') {
                                        pendingCount = pendingActions.sos;
                                    } else if (item.title === 'Drivers') {
                                        pendingCount = pendingActions.drivers;
                                    } else if (item.title === 'Payment Receipts') {
                                        pendingCount = (pendingActions.company_payments || 0) + (pendingActions.wallet_topups || 0);
                                    }
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                            <Link href={item.href} prefetch>
                                                {item.icon && <item.icon />}
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {pendingCount > 0 && (
                                            <SidebarMenuBadge className="bg-destructive flex h-5 min-w-[1.2rem] items-center justify-center rounded-full border-none px-1 text-[10px] font-bold !text-white">
                                                {pendingCount}
                                            </SidebarMenuBadge>
                                        )}
                                        {showDot && pendingCount === 0 && (
                                            <div className="absolute top-1/2 right-2 -translate-y-1/2">
                                                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                                            </div>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroup>
                ))}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>User</SidebarGroupLabel>
                    <SidebarMenu>
                        {userNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild tooltip={{ children: item.title }} isActive={page.url.startsWith(item.href)}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
