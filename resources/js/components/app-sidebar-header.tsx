import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { router } from '@inertiajs/react';
import { useState } from 'react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = () => {
        setIsRefreshing(true);
        router.reload({
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <header className="border-sidebar-border/50 flex h-16 shrink-0 items-center justify-between border-b px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-8 gap-2 bg-background shadow-sm hover:bg-slate-50 transition-all border-slate-200"
                title="Sync and Refresh Meta Data"
            >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="text-xs font-semibold">Sync Meta</span>
            </Button>
        </header>
    );
}
