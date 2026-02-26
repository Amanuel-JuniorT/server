import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Car, Clock, Heart, MapPin, Navigation, Plus, Trash2 } from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import UserLayout from '@/layouts/user/layout';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Favorites',
        href: '/driver/favorites',
    },
];

// Mock data - replace with actual data from your backend
const mockFavorites = [
    {
        id: 1,
        name: 'Home',
        address: 'Addis Ababa, Bole, House No. 123',
        type: 'home',
        coordinates: { lat: 8.9806, lng: 38.7578 },
        lastUsed: '2024-01-15',
        useCount: 15,
    },
    {
        id: 2,
        name: 'Work',
        address: 'Addis Ababa, Kazanchis, Office Building A',
        type: 'work',
        coordinates: { lat: 8.9906, lng: 38.7678 },
        lastUsed: '2024-01-14',
        useCount: 23,
    },
    {
        id: 3,
        name: 'Shopping Mall',
        address: 'Addis Ababa, Meskel Square, Edna Mall',
        type: 'shopping',
        coordinates: { lat: 8.9706, lng: 38.7478 },
        lastUsed: '2024-01-10',
        useCount: 8,
    },
    {
        id: 4,
        name: 'Airport',
        address: 'Addis Ababa, Bole International Airport',
        type: 'airport',
        coordinates: { lat: 8.9606, lng: 38.7378 },
        lastUsed: '2024-01-05',
        useCount: 5,
    },
];

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'home':
            return <Heart className="h-5 w-5 text-red-500" />;
        case 'work':
            return <Car className="h-5 w-5 text-blue-500" />;
        case 'shopping':
            return <MapPin className="h-5 w-5 text-green-500" />;
        case 'airport':
            return <Navigation className="h-5 w-5 text-purple-500" />;
        default:
            return <MapPin className="h-5 w-5 text-gray-500" />;
    }
};

const getTypeColor = (type: string) => {
    switch (type) {
        case 'home':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        case 'work':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        case 'shopping':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'airport':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
};

const getTypeText = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
};

export default function UserFavorites() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Favorites" />

            <UserLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Favorite Locations" description="Quick access to your frequently used destinations" />

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button className="flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Add New Favorite</span>
                            </Button>
                            <Button variant="outline" className="flex items-center space-x-2">
                                <Navigation className="h-4 w-4" />
                                <span>Request Ride to Favorites</span>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Favorites Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {mockFavorites.map((favorite) => (
                            <Card key={favorite.id} className="transition-shadow hover:shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="rounded-lg bg-gray-100 p-2 dark:bg-gray-800">{getTypeIcon(favorite.type)}</div>
                                            <div className="flex-1">
                                                <div className="mb-1 flex items-center space-x-2">
                                                    <h3 className="font-semibold">{favorite.name}</h3>
                                                    <Badge className={getTypeColor(favorite.type)}>{getTypeText(favorite.type)}</Badge>
                                                </div>
                                                <p className="text-muted-foreground mb-2 text-sm">{favorite.address}</p>
                                                <div className="text-muted-foreground flex items-center space-x-4 text-xs">
                                                    <span className="flex items-center space-x-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>Used {favorite.useCount} times</span>
                                                    </span>
                                                    <span>Last: {favorite.lastUsed}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <Button size="sm" className="flex items-center space-x-1">
                                                <Navigation className="h-3 w-3" />
                                                <span>Go</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex items-center space-x-1 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                                <span>Remove</span>
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Add New Favorite Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Add New Favorite Location</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Location Name</label>
                                        <input
                                            type="text"
                                            placeholder="e.g., Home, Work, Gym"
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium">Location Type</label>
                                        <select className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                            <option value="home">Home</option>
                                            <option value="work">Work</option>
                                            <option value="shopping">Shopping</option>
                                            <option value="airport">Airport</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Address</label>
                                    <input
                                        type="text"
                                        placeholder="Enter full address"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button>Add to Favorites</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Usage Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Usage Statistics</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-blue-600">15</p>
                                    <p className="text-muted-foreground text-sm">Total Favorites</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">51</p>
                                    <p className="text-muted-foreground text-sm">Total Uses</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">3.4</p>
                                    <p className="text-muted-foreground text-sm">Avg Uses per Favorite</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </UserLayout>
        </AppLayout>
    );
}
