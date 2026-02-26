import { User, type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';

import HeadingSmall from '@/components/heading-small';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Shield, User as UserIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Profile',
        href: `/passenger/profile`,
    },
];

function PassengerProfileContent({ passenger }: { passenger: User }) {
    // const { userData, isLoading, error } = useUserContext();

    if (!passenger) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-gray-600">No user data found</p>
                </div>
            </div>
        );
    }

    console.log(passenger);

    // Determine user type
    const isDriver = false;

    return (
        <div className="space-y-6">
            {/* User Type Badge */}
            <div className="flex items-center justify-between">
                <HeadingSmall title="Profile Information" description={`View ${isDriver ? 'driver' : 'passenger'} profile and contact details`} />
                <Badge variant={isDriver ? 'default' : 'secondary'} className="text-sm">
                    <div className="flex items-center space-x-1">
                        <UserIcon className="h-3 w-3" />
                        <span>Passenger</span>
                    </div>
                </Badge>
            </div>

            {/* Profile Avatar Section */}
            {/* <Card>
                <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                        <AvatarFallback className="text-lg">{passenger.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                </CardContent>
            </Card> /*}

            {/* Profile Information Display */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <CardContent className="flex items-center space-x-4">
                        <a href={passenger.profile_picture_path} target="_blank" rel="noopener noreferrer" className="cursor-pointer align-middle">
                            <Avatar className="h-20 w-20">
                                <AvatarImage alt={passenger.name} src={passenger.profile_picture_path} />
                                <AvatarFallback className="text-lg">{passenger.name.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        </a>
                    </CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <p className="mt-1 text-gray-900">{passenger.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <p className="mt-1 text-gray-900">{passenger.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Phone Number</label>
                            <p className="mt-1 text-gray-900">{passenger.phone}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Shield className="h-5 w-5 text-gray-600" />
                        <span>Account Status</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Email Verification</span>
                        <span className={`text-sm ${passenger.email_verified_at ? 'text-green-600' : 'text-yellow-600'}`}>
                            {passenger.email_verified_at ? 'Verified' : 'Pending'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Created</span>
                        <span className="text-muted-foreground text-sm">{new Date(passenger.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-muted-foreground text-sm">{new Date(passenger.updated_at).toLocaleDateString()}</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PassengerProfile() {
    const { passenger } = usePage<{ passenger: User }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Profile" />

            <UserLayout role="passenger" userId={passenger.id}>
                <PassengerProfileContent passenger={passenger} />
            </UserLayout>
        </AppLayout>
    );
}
