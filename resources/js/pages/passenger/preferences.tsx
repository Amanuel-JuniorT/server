import { type BreadcrumbItem, User } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { Bell, Car, Shield, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Preferences',
        href: '/passenger/preferences',
    },
];

export default function PassengerPreferences() {
    const { passenger } = usePage<{ passenger: User }>().props;
    // State for all the switches
    const [notifications, setNotifications] = useState({
        rideUpdates: true,
        driverArrival: true,
        paymentReminders: true,
        promotionalOffers: false,
        newsUpdates: false,
    });

    const [privacy, setPrivacy] = useState({
        locationSharing: true,
        profileVisibility: true,
        rideHistory: true,
        analytics: false,
    });

    const [accessibility, setAccessibility] = useState({
        highContrast: false,
        screenReader: false,
    });

    const [ridePreferences, setRidePreferences] = useState({
        vehicleType: 'standard',
        waitTime: '10',
        pickupRadius: '100',
        language: 'en',
    });

    const [uiPreferences, setUIPreferences] = useState({
        fontSize: 'medium',
        colorTheme: 'auto',
    });

    const handleSavePreferences = () => {
        // TODO: Implement save logic
        console.log('Saving preferences:', {
            notifications,
            privacy,
            accessibility,
            ridePreferences,
            uiPreferences,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Preferences" />

            <UserLayout role="passenger" userId={passenger.id}>
                <div className="space-y-6">
                    <HeadingSmall title="Preferences" description="Customize your ride experience and app settings" />

                    {/* Ride Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Car className="h-5 w-5 text-blue-600" />
                                <span>Ride Preferences</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Preferred Vehicle Type</Label>
                                    <Select
                                        value={ridePreferences.vehicleType}
                                        onValueChange={(value) => setRidePreferences((prev) => ({ ...prev, vehicleType: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="standard">Standard</SelectItem>
                                            <SelectItem value="premium">Premium</SelectItem>
                                            <SelectItem value="pool">Pool</SelectItem>
                                            <SelectItem value="auto">Auto-Select</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-base font-medium">Maximum Wait Time</Label>
                                    <Select
                                        value={ridePreferences.waitTime}
                                        onValueChange={(value) => setRidePreferences((prev) => ({ ...prev, waitTime: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select wait time" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">5 minutes</SelectItem>
                                            <SelectItem value="10">10 minutes</SelectItem>
                                            <SelectItem value="15">15 minutes</SelectItem>
                                            <SelectItem value="20">20 minutes</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Preferred Pickup Radius</Label>
                                    <Select
                                        value={ridePreferences.pickupRadius}
                                        onValueChange={(value) => setRidePreferences((prev) => ({ ...prev, pickupRadius: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select radius" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="50">50 meters</SelectItem>
                                            <SelectItem value="100">100 meters</SelectItem>
                                            <SelectItem value="200">200 meters</SelectItem>
                                            <SelectItem value="500">500 meters</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-base font-medium">Language</Label>
                                    <Select
                                        value={ridePreferences.language}
                                        onValueChange={(value) => setRidePreferences((prev) => ({ ...prev, language: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select language" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="am">Amharic</SelectItem>
                                            <SelectItem value="or">Oromo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notification Preferences */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Bell className="h-5 w-5 text-green-600" />
                                <span>Notification Preferences</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Ride Updates</Label>
                                    <p className="text-muted-foreground text-sm">Get notified about ride status changes</p>
                                </div>
                                <Switch
                                    checked={notifications.rideUpdates}
                                    onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, rideUpdates: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Driver Arrival</Label>
                                    <p className="text-muted-foreground text-sm">Notify when driver is approaching</p>
                                </div>
                                <Switch
                                    checked={notifications.driverArrival}
                                    onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, driverArrival: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Payment Reminders</Label>
                                    <p className="text-muted-foreground text-sm">Get payment due reminders</p>
                                </div>
                                <Switch
                                    checked={notifications.paymentReminders}
                                    onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, paymentReminders: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Promotional Offers</Label>
                                    <p className="text-muted-foreground text-sm">Receive special offers and discounts</p>
                                </div>
                                <Switch
                                    checked={notifications.promotionalOffers}
                                    onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, promotionalOffers: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">News & Updates</Label>
                                    <p className="text-muted-foreground text-sm">App updates and new features</p>
                                </div>
                                <Switch
                                    checked={notifications.newsUpdates}
                                    onCheckedChange={(checked: boolean) => setNotifications((prev) => ({ ...prev, newsUpdates: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Privacy & Security */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Shield className="h-5 w-5 text-red-600" />
                                <span>Privacy & Security</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Location Sharing</Label>
                                    <p className="text-muted-foreground text-sm">Share location with drivers during rides</p>
                                </div>
                                <Switch
                                    checked={privacy.locationSharing}
                                    onCheckedChange={(checked: boolean) => setPrivacy((prev) => ({ ...prev, locationSharing: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Profile Visibility</Label>
                                    <p className="text-muted-foreground text-sm">Allow drivers to see your profile picture</p>
                                </div>
                                <Switch
                                    checked={privacy.profileVisibility}
                                    onCheckedChange={(checked: boolean) => setPrivacy((prev) => ({ ...prev, profileVisibility: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Ride History</Label>
                                    <p className="text-muted-foreground text-sm">Save detailed ride history</p>
                                </div>
                                <Switch
                                    checked={privacy.rideHistory}
                                    onCheckedChange={(checked: boolean) => setPrivacy((prev) => ({ ...prev, rideHistory: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Analytics</Label>
                                    <p className="text-muted-foreground text-sm">Help improve service with usage data</p>
                                </div>
                                <Switch
                                    checked={privacy.analytics}
                                    onCheckedChange={(checked: boolean) => setPrivacy((prev) => ({ ...prev, analytics: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Accessibility */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <UserIcon className="h-5 w-5 text-purple-600" />
                                <span>Accessibility</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label className="text-base font-medium">Font Size</Label>
                                    <Select
                                        value={uiPreferences.fontSize}
                                        onValueChange={(value) => setUIPreferences((prev) => ({ ...prev, fontSize: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select font size" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="small">Small</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="large">Large</SelectItem>
                                            <SelectItem value="extra-large">Extra Large</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-base font-medium">Color Theme</Label>
                                    <Select
                                        value={uiPreferences.colorTheme}
                                        onValueChange={(value) => setUIPreferences((prev) => ({ ...prev, colorTheme: value }))}
                                    >
                                        <SelectTrigger className="mt-2">
                                            <SelectValue placeholder="Select theme" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">Light</SelectItem>
                                            <SelectItem value="dark">Dark</SelectItem>
                                            <SelectItem value="auto">Auto (System)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">High Contrast</Label>
                                    <p className="text-muted-foreground text-sm">Use high contrast colors for better visibility</p>
                                </div>
                                <Switch
                                    checked={accessibility.highContrast}
                                    onCheckedChange={(checked: boolean) => setAccessibility((prev) => ({ ...prev, highContrast: checked }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className="text-base font-medium">Screen Reader Support</Label>
                                    <p className="text-muted-foreground text-sm">Enable screen reader compatibility</p>
                                </div>
                                <Switch
                                    checked={accessibility.screenReader}
                                    onCheckedChange={(checked: boolean) => setAccessibility((prev) => ({ ...prev, screenReader: checked }))}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button size="lg" className="px-8" onClick={handleSavePreferences}>
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </UserLayout>
        </AppLayout>
    );
}
