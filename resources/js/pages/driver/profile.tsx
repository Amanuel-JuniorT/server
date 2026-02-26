import HeadingSmall from '@/components/heading-small';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProvider } from '@/contexts/UserContext';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';
import { Driver, type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { Car, FileText, MapPin, Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { RejectReasonModal } from '../drivers';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Profile',
        href: '/user/profile',
    },
];

function ProfileContent({ driver }: { driver: Driver }) {
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<{ reject_message: string }>>({
        reject_message: '',
    });

    const approveDriver = (driverId: number) => {
        post(route('drivers.approve', driverId));
    };

    const rejectDriver = (driverId: number) => {
        post(route('drivers.reject', driverId), {
            data: {
                reject_message: data.reject_message,
            },
            onFinish: () => {
                reset();
                setRejectModalOpen(false);
            },
        });
    };

    if (!driver) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-gray-600">No user data found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* User Type Badge */}
            <div className="flex items-center justify-between">
                <HeadingSmall title="Profile Information" description={`View driver profile and contact details`} />
                <div className="flex items-center space-x-2">
                    <Badge variant={'default'} className="text-sm">
                        <div className="flex items-center space-x-1">
                            <Car className="h-3 w-3" />
                            <span>Driver</span>
                        </div>
                    </Badge>
                    <Badge
                        variant={driver.approval_state === 'approved' ? 'completed' : driver.approval_state === 'pending' ? 'pending' : 'failed'}
                        className="text-sm"
                    >
                        <div className="flex items-center space-x-1">
                            <Car className="h-3 w-3" />
                            <span>{driver.approval_state.charAt(0).toUpperCase() + driver.approval_state.slice(1)}</span>
                        </div>
                    </Badge>
                </div>
            </div>

            {/* Profile Avatar Section and Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>View driver profile and contact details</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                    <a href={driver.profile_picture_path} target="_blank" rel="noopener noreferrer" className="cursor-pointer align-middle">
                        <Avatar className="h-20 w-20">
                            <AvatarImage alt={driver.name} src={driver.profile_picture_path} />
                        </Avatar>
                    </a>
                    <div>
                        <p className="text-muted-foreground text-sm">Profile picture</p>
                    </div>
                </CardContent>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <p className="mt-1 text-gray-900">{driver.name}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email Address</label>
                            <p className="mt-1 text-gray-900">{driver.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Phone Number</label>
                            <p className="mt-1 text-gray-900">{driver.phone}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium">License Number</label>
                            <p className="mt-1 text-gray-900">{driver.license_number || 'Not provided'}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Driver-Specific Information */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Car className="h-5 w-5 text-blue-600" />
                        <span>Driver Information</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="flex items-center space-x-3">
                            <div className="rounded-lg bg-blue-100 p-2">
                                <Star className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Rating</p>
                                <p className="text-lg font-bold">{Number(driver.rating || 0).toFixed(1)}/5.0</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="rounded-lg bg-green-100 p-2">
                                <MapPin className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Trips Completed</p>
                                <p className="text-lg font-bold">{driver.noOfRides}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mr-2 text-sm font-medium">Status</label>
                            <Badge
                                variant={driver.status === 'available' ? 'completed' : driver.status === 'on_ride' ? 'pending' : 'failed'}
                                className="capitalize"
                            >
                                {driver.status}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Driver's Documents */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span>Driver's Documents</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-3">
                        <div>
                            <p className="text-sm font-medium">License Picture</p>
                            <a href={driver.license_image_path} target="_blank" rel="noopener noreferrer" className="cursor-pointer align-middle">
                                <img
                                    src={driver.license_image_path}
                                    alt="License"
                                    className="h-24 w-24 cursor-pointer rounded-md border object-cover"
                                />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div>
                            <p className="text-sm font-medium">Profile Picture</p>
                            <a href={driver.profile_picture_path} target="_blank" rel="noopener noreferrer" className="cursor-pointer align-middle">
                                <img
                                    src={driver.profile_picture_path}
                                    alt="Profile"
                                    className="h-24 w-24 cursor-pointer rounded-md border object-cover"
                                />
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <div>
                            <p className="text-sm font-medium">Car Picture</p>
                            <a href={driver.car_picture_path} target="_blank" rel="noopener noreferrer" className="cursor-pointer align-middle">
                                <img src={driver.car_picture_path} alt="Car" className="h-24 w-24 cursor-pointer rounded-md border object-cover" />
                            </a>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Account Status */}
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
                        <span
                            className={`text-sm ${driver.approval_state == 'approved' ? 'text-green-600' : driver.approval_state == 'rejected' ? 'text-red-600' : driver.approval_state == 'pending' && 'text-yellow-600'}`}
                        >
                            {driver.approval_state.charAt(0).toUpperCase() + driver.approval_state.slice(1)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Account Created</span>
                        <span className="text-muted-foreground text-sm">{new Date(driver.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-muted-foreground text-sm">{new Date(driver.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Driver Status</span>
                        <Badge
                            variant={driver.status === 'available' ? 'completed' : driver.status === 'on_ride' ? 'pending' : 'failed'}
                            className="text-xs"
                        >
                            {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                        </Badge>
                    </div>
                    {driver.approval_state === 'pending' && (
                        <div className="mt-5 flex items-center justify-end">
                            <Button
                                size="sm"
                                className="mr-2"
                                variant="positive"
                                onClick={() => {
                                    approveDriver(driver.id);
                                }}
                            >
                                Approve
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                    setRejectModalOpen(true);
                                }}
                            >
                                Reject
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Reason */}

            {driver.approval_state === 'rejected' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Shield className="h-5 w-5 text-gray-600" />
                            <span>Rejection Reason</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p>{driver.reject_message}</p>
                    </CardContent>
                </Card>
            )}
            <RejectReasonModal
                value={data.reject_message}
                onChange={(v) => setData('reject_message', v)}
                open={rejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                onSubmit={() => rejectDriver(driver.id)}
            />
        </div>
    );
}

export default function UserProfile() {
    const { driver, user_id } = usePage<{ driver: Driver; user_id: number }>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Profile" />

            <UserProvider userId={user_id}>
                <UserLayout role="driver">
                    <ProfileContent driver={driver} />
                </UserLayout>
            </UserProvider>
        </AppLayout>
    );
}
