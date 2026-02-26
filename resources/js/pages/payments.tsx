import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Payments', href: '/payments' }];

export default function PaymentsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payments" />
            <div className="p-6">
                <h1 className="mb-4 text-2xl font-bold">Payments</h1>
                <p className="text-muted-foreground">Payment management and overview will appear here.</p>
            </div>
        </AppLayout>
    );
}
