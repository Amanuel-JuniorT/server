# RideScheduled Event - Frontend Integration Guide

## Overview

The `RideScheduled` event is broadcast when a company ride is scheduled. This event is dispatched immediately after a ride is created, before driver assignment.

## Event Details

- **Event Name**: `ride.scheduled`
- **Broadcast Channels**:
    - `company.{company_id}` - For company admins
    - `user.{employee_id}` - For the employee who the ride is scheduled for
    - `drivers` - For all drivers (so they can see new scheduled company rides)

## Event Data Structure

The event payload contains the following structure:

```typescript
interface RideScheduledEvent {
    ride: {
        id: number;
        company_id: number;
        employee_id: number;
        status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
        pickup_address: string;
        destination_address: string;
        origin_lat: number;
        origin_lng: number;
        destination_lat: number;
        destination_lng: number;
        price: number;
        scheduled_time: string | null; // ISO 8601 format
        requested_at: string | null; // ISO 8601 format
        company: {
            id: number;
            name: string;
        } | null;
        employee: {
            id: number;
            name: string;
            phone: string;
            email: string;
        } | null;
    };
}
```

## Implementation Examples

### Example 1: Listening on Company Channel (Company Admin Dashboard)

```typescript
import { useEffect } from 'react';
import echo from '@/lib/reverb';

export default function CompanyAdminRidesPage() {
    useEffect(() => {
        // Get company ID from your page props or context
        const companyId = 1; // Replace with actual company ID

        const channel = echo.channel(`company.${companyId}`);

        channel.listen('.ride.scheduled', (event: RideScheduledEvent) => {
            console.log('New ride scheduled:', event.ride);

            // Update your rides list
            // Show notification
            // Refresh data, etc.
        });

        // Cleanup on unmount
        return () => {
            echo.leave(`company.${companyId}`);
        };
    }, []);

    // ... rest of your component
}
```

### Example 2: Listening on User Channel (Employee View)

```typescript
import { useEffect } from 'react';
import echo from '@/lib/reverb';
import { usePage } from '@inertiajs/react';

export default function EmployeeRidesPage() {
    const { user } = usePage().props; // Assuming user is available in props

    useEffect(() => {
        if (!user?.id) return;

        const channel = echo.channel(`user.${user.id}`);

        channel.listen('.ride.scheduled', (event: RideScheduledEvent) => {
            console.log('Ride scheduled for you:', event.ride);

            // Show notification to employee
            // Update rides list
            // Display toast notification
        });

        return () => {
            echo.leave(`user.${user.id}`);
        };
    }, [user?.id]);

    // ... rest of your component
}
```

### Example 3: Listening on Drivers Channel (Driver App)

For drivers to see new scheduled company rides:

```typescript
import { useEffect } from 'react';
import echo from '@/lib/reverb';
import { toast } from 'sonner';

export default function DriverDashboard() {
    useEffect(() => {
        const channel = echo.channel('drivers');

        channel.listen('.ride.scheduled', (event: RideScheduledEvent) => {
            console.log('New company ride scheduled:', event.ride);

            // Show notification to driver
            toast.info('New Company Ride Scheduled', {
                description: `Ride from ${event.ride.pickup_address} to ${event.ride.destination_address} scheduled for ${event.ride.scheduled_time ? new Date(event.ride.scheduled_time).toLocaleString() : 'now'}`,
            });

            // Update available rides list
            // Optionally show on map
        });

        return () => {
            echo.leave('drivers');
        };
    }, []);

    // ... rest of your component
}
```

### Example 4: Using the Helper Function (Admin Dashboard)

If you're on the admin dashboard, you can use the existing `listenToAdminEvents` helper:

```typescript
import { useEffect } from 'react';
import { listenToAdminEvents } from '@/lib/reverb';

export default function AdminDashboard() {
    useEffect(() => {
        listenToAdminEvents('.ride.scheduled', (event: RideScheduledEvent) => {
            console.log('Ride scheduled:', event.ride);
            // Handle the event
        });
    }, []);

    // ... rest of your component
}
```

### Example 5: Complete Implementation with State Management

```typescript
import { useEffect, useState } from 'react';
import echo from '@/lib/reverb';
import { toast } from 'sonner';

interface CompanyRide {
    id: number;
    employee: {
        id: number;
        name: string;
        email: string;
    };
    company: {
        id: number;
        name: string;
    };
    pickup_address: string;
    destination_address: string;
    origin_lat: number;
    origin_lng: number;
    destination_lat: number;
    destination_lng: number;
    price?: number;
    status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
    scheduled_time?: string;
    requested_at?: string;
}

interface RideScheduledEvent {
    ride: CompanyRide;
}

export default function CompanyAdminRidesPage() {
    const [rides, setRides] = useState<CompanyRide[]>([]);
    const companyId = 1; // Get from props/context

    useEffect(() => {
        const channel = echo.channel(`company.${companyId}`);

        channel.listen('.ride.scheduled', (event: RideScheduledEvent) => {
            const newRide = event.ride;

            // Add to rides list
            setRides((prev) => [newRide, ...prev]);

            // Show notification
            toast.success('New Ride Scheduled', {
                description: `Ride for ${newRide.employee?.name || 'Employee'} scheduled for ${newRide.scheduled_time ? new Date(newRide.scheduled_time).toLocaleString() : 'now'}`,
            });

            // Optional: Play notification sound
            // playNotificationSound();
        });

        return () => {
            echo.leave(`company.${companyId}`);
        };
    }, [companyId]);

    // ... rest of your component
}
```

## TypeScript Type Definitions

Add this to your types file (e.g., `resources/js/types/index.ts`):

```typescript
export interface RideScheduledEvent {
    ride: {
        id: number;
        company_id: number;
        employee_id: number;
        status: 'requested' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
        pickup_address: string;
        destination_address: string;
        origin_lat: number;
        origin_lng: number;
        destination_lat: number;
        destination_lng: number;
        price: number;
        scheduled_time: string | null;
        requested_at: string | null;
        company: {
            id: number;
            name: string;
        } | null;
        employee: {
            id: number;
            name: string;
            phone: string;
            email: string;
        } | null;
    };
}
```

## Important Notes

1. **Event Name Prefix**: Laravel Echo automatically prefixes broadcast events with a dot (`.`), so listen for `.ride.scheduled` not `ride.scheduled`.

2. **Channel Authorization**:

    - `company.{company_id}` channel requires the user to be a company admin for that company
    - `user.{employee_id}` channel requires the user ID to match the employee_id
    - `drivers` channel requires the user to have the `driver` role

3. **Cleanup**: Always clean up listeners when the component unmounts to prevent memory leaks.

4. **Connection Status**: Make sure Echo is connected before listening. You can check connection status using:

    ```typescript
    echo.connector.pusher.connection.state === 'connected';
    ```

5. **Multiple Listeners**: You can have multiple listeners on the same channel for different purposes (e.g., updating UI, showing notifications, logging).

## Testing

To test the event:

1. Schedule a ride through the company admin interface
2. Check browser console for the event
3. Verify the event data structure matches expectations
4. Test on both company admin and employee views

## Related Events

- `company-ride.driver-assigned` - Dispatched when a driver is assigned to a scheduled ride
- `ride.status-changed` - Dispatched when ride status changes

## Environment Variables

Make sure these are set in your `.env` file:

```env
BROADCAST_DRIVER=reverb
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http
```

And in your frontend `.env`:

```env
VITE_REVERB_APP_KEY=your_app_key
VITE_REVERB_HOST=localhost
VITE_REVERB_PORT=8080
VITE_REVERB_SCHEME=http
```

## Troubleshooting

1. **Event not received**:

    - Check that Echo is connected
    - Verify channel name matches exactly
    - Check browser console for errors
    - Verify user has authorization for the channel

2. **Type errors**:

    - Make sure TypeScript types are properly defined
    - Check that event structure matches the backend

3. **Multiple events**:
    - Ensure cleanup functions are properly called
    - Check for duplicate listeners
