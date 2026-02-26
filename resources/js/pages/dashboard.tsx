import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="flex h-full flex-col items-center justify-center p-8">
                <h1 className="mb-4 text-2xl font-bold">Dashboard Moved</h1>
                <p className="mb-4">The dashboard is now the Admin Dashboard.</p>
                <Link href="/admin" className="text-blue-600 underline">
                    Go to Admin Dashboard
                </Link>
            </div>
        </AppLayout>
    );
}
