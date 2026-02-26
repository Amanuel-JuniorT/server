import AuthLayout from '@/layouts/auth-layout';
import { Head, Link } from '@inertiajs/react';

export default function AcceptInvitationError({ message }: { message?: string }) {
    return (
        <AuthLayout title="Invitation Error" description={message || 'Something went wrong with your invitation.'}>
            <Head title="Invitation Error" />

            <div className="mt-4 text-center">
                <Link
                    href={route('login')}
                    className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                >
                    Return to Login
                </Link>
            </div>
        </AuthLayout>
    );
}
