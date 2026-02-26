import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toast';
import echo from '@/lib/reverb';
import { type BreadcrumbItem } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle } from 'lucide-react';
import { type PropsWithChildren, useEffect } from 'react';
import { toast } from 'sonner';

export default function AppSidebarLayout({ children, breadcrumbs = [] }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    const { pendingActions } = usePage().props as any;

    useEffect(() => {
        const channel = echo.channel('admin-alerts');

        // Listen for generic notifications
        channel.listen('.admin.notification', (e: any) => {
            console.log('Admin Notification Received:', e);
            if (e.type === 'error') {
                toast.error(e.message, { description: e.type.toUpperCase() });
            } else {
                toast(e.message, { description: e.type.toUpperCase() });
            }
            // Reload specific elements if needed
            router.reload({ only: ['stats', 'notifications'] });
        });

        // Listen for SOS alerts explicitly for high-priority handling
        channel.listen('.sos.received', (e: any) => {
            console.log('SOS ALERT RECEIVED:', e);
            toast.error(`🚨 EMERGENCY SOS: ${e.alert.user?.name || 'User'}`, {
                description: 'Check the SOS dashboard immediately.',
                duration: 10000, // Persistent for 10s
            });

            // Optional: Play alert sound
            try {
                const audio = new Audio('/sounds/emergency-alert.mp3');
                audio.play();
            } catch (err) {
                console.warn('Could not play alert sound', err);
            }

            // Sync navigation dots
            router.reload({ only: ['pendingActions'] });
        });

        return () => {
            echo.leaveChannel('admin-alerts');
        };
    }, []);

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar">
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {pendingActions?.sos > 0 && (
                    <div className="bg-destructive text-destructive-foreground sticky top-0 z-50 flex animate-pulse items-center justify-between border-b border-white/20 px-6 py-4 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="rounded-full bg-white/20 p-2">
                                <AlertTriangle className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <p className="text-xl font-black tracking-tight">
                                    EMERGENCY SOS: {pendingActions.sos} ACTIVE ALERT{pendingActions.sos > 1 ? 'S' : ''}
                                </p>
                                <p className="text-sm font-medium opacity-90">Attention required immediately! Driver safety may be at risk.</p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="lg"
                            asChild
                            className="text-destructive bg-white font-bold transition-transform hover:scale-105 hover:bg-white/90"
                        >
                            <Link href="/sos">VIEW DASHBOARD</Link>
                        </Button>
                    </div>
                )}
                <div className="flex flex-1 flex-col">{children}</div>
            </AppContent>
            <Toaster />
        </AppShell>
    );
}
