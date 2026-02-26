# Driver Location Broadcasting Logic

To optimize network traffic, driver location updates are no longer broadcast to a global channel. Instead, we use a **Grid/Mesh System**.

## Backend Logic

When a driver updates their location, the server calculates a grid key based on their latitude and longitude:

```php
$lat_mesh = floor($latitude * 10);
$lng_mesh = floor($longitude * 10);
$channel = 'drivers.' . $lat_mesh . '.' . $lng_mesh;
```

This creates grid cells of approximately **11km x 11km**.

## Frontend Implementation (Passenger App)

Passengers should subscribe to the channel corresponding to their current location **AND** the 8 surrounding channels to ensure they see drivers in the 5km radius even if they are near a grid boundary.

### How to Subscribe

1. Get passenger's current `lat` and `lng`.
2. Calculate the center mesh:
    ```javascript
    const centerLatMesh = Math.floor(lat * 10);
    const centerLngMesh = Math.floor(lng * 10);
    ```
3. Subscribe to the 3x3 grid centered on that mesh:
    ```javascript
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const channelName = `drivers.${centerLatMesh + i}.${centerLngMesh + j}`;
            Echo.channel(channelName).listen('.nearby.drivers', (e) => {
                console.log('Driver moved:', e);
                // Update map marker
            });
        }
    }
    ```
4. When the passenger moves significantly (e.g., crosses a mesh boundary), unsubscribe from old channels and subscribe to new ones.

## Event Data

The event `.nearby.drivers` now contains:

- `driver_id`
- `driver_name`
- `latitude`
- `longitude`
- `vehicle` (plate, color, model)
