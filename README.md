# ECAB Server - Ride Sharing API

## Overview

This is a Laravel-based backend API for a comprehensive ride-sharing application (ECAB) that supports both individual rides and ride pooling. The system includes real-time features, wallet management, driver approval workflows, and admin dashboard functionality.

## Technology Stack

- **Framework**: Laravel 12 with PHP 8.2+
- **Authentication**: Laravel Sanctum (API tokens)
- **Database**: Supabase /PostgreSQL
- **Real-time**: Laravel Reverb (WebSocket broadcasting)
- **Frontend Integration**: Inertia.js with React
- **Testing**: Pest PHP

## Core Features

### 1. User Management & Authentication

- **User Registration/Login**: Support for both passengers and drivers
- **Role-based Access**: Separate user types (passenger, driver, admin)
- **Profile Management**: User profiles with profile images
- **API Authentication**: Token-based authentication using Laravel Sanctum

### 2. Driver Management

- **Driver Registration**: Complete driver onboarding process
- **Vehicle Management**: Driver vehicle registration and management
- **Driver Approval Workflow**: Admin approval system for new drivers
- **Driver Status Management**: Online/offline status tracking
- **Location Tracking**: Real-time driver location updates
- **Driver Profile**: Comprehensive driver profile management

### 3. Ride Management

- **Ride Requesting**: Passengers can request rides with pickup/destination
- **Ride Matching**: Automatic driver assignment based on location
- **Ride Lifecycle**: Complete ride flow (requested → accepted → in_progress → completed)
- **Ride Cancellation**: Both passenger and driver can cancel rides
- **Fare Calculation**: Dynamic pricing based on distance
- **Ride History**: Complete ride history for both passengers and drivers
- **Rating System**: Mutual rating system between passengers and drivers

### 4. Ride Pooling (Carpooling)

- **Pool Ride Requests**: Passengers can request shared rides
- **Route Matching**: Advanced algorithm to match passengers going in similar directions
- **Polyline Integration**: Uses Google Maps polyline for route optimization
- **Pool Ride Management**: Separate pooling system with its own lifecycle
- **Cost Sharing**: Shared cost calculation for pooled rides

### 5. Real-time Features

- **WebSocket Broadcasting**: Real-time updates using Laravel Reverb
- **Live Events**:
    - New ride requests
    - Driver location changes
    - Ride status updates
    - Driver arrival notifications
    - Ride responses (accept/reject)

### 6. Wallet & Payment System

- **Digital Wallet**: Built-in wallet system for all users
- **Transaction Management**: Complete transaction history
- **Wallet Operations**:
    - Balance checking
    - Top-up functionality
    - Withdrawal requests
    - Transfer between users
- **Payment Integration**: Ready for payment gateway integration

### 7. Admin Dashboard

- **Statistics**: Real-time dashboard with key metrics
- **User Management**: Manage passengers and drivers
- **Driver Approval**: Approve/reject driver applications
- **System Monitoring**: Track rides, users, and system health
- **Analytics**: Comprehensive reporting and analytics

### 8. Company Management

- **Company Registration**: Register and manage companies with unique codes
- **Employee Linking**: Link employees to companies with approval workflow
- **Company Rides**: Separate ride system for company employees
- **Admin Controls**: Approve/reject employee company requests
- **Company Statistics**: Track company and employee metrics
- **One Employee Per Company**: Enforce single company per employee constraint

### 9. Location Services

- **GPS Integration**: Latitude/longitude-based location tracking
- **Address Management**: Pickup and destination address handling
- **Distance Calculation**: Haversine formula for distance calculations
- **Nearby Drivers**: Find drivers within specified radius

## API Endpoints

### Authentication

- `POST /login` - User login
- `POST /register` - User registration
- `POST /logout` - User logout (authenticated)

### Driver Management

- `POST /driver/submit-details` - Submit driver details
- `GET /driver/approval_status` - Check driver approval status
- `PATCH /driver/status` - Update driver status
- `POST /driver/location` - Update driver location
- `GET /driver/profile` - Get driver profile
- `GET /nearby-drivers` - Find nearby drivers

### Ride Management

- `POST /ride/request` - Request a ride
- `POST /ride/{id}/accept` - Accept a ride (driver)
- `POST /ride/{id}/reject` - Reject a ride (driver)
- `POST /ride/{id}/start` - Start a ride
- `POST /ride/{id}/complete` - Complete a ride
- `POST /ride/{id}/cancel` - Cancel a ride
- `POST /ride/{id}/rate` - Rate a ride
- `GET /ride/history` - Get ride history

### Pooling

- `POST /pooling/request` - Request a pool ride
- `POST /pooling/{id}/join` - Join an existing pool ride
- `GET /pooling/available` - Get available pool rides

### Wallet

- `GET /wallet` - Get wallet balance
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/topup` - Add money to wallet
- `POST /wallet/withdraw` - Withdraw money
- `POST /wallet/transfer` - Transfer money to another user

### Company Management

- `POST /company/register` - Register a new company
- `GET /company/list` - List all companies (Admin)
- `GET /company/{id}` - Get company details
- `PUT /company/{id}` - Update company information
- `DELETE /company/{id}` - Delete company (Admin)

### Employee-Company Linking

- `POST /employee/link-company` - Request to link to a company
- `GET /employee/company-info` - Get employee's company information
- `POST /employee/leave-company` - Leave current company
- `POST /employee/cancel-link-request` - Cancel pending link request

### Company Rides

- `POST /company/ride/request` - Request a company ride
- `GET /company/rides` - Get company ride history
- `GET /company/ride/{id}` - Get specific ride details
- `POST /company/ride/{id}/cancel` - Cancel company ride

### Admin

- `GET /admin/stats` - Get admin dashboard statistics
- `GET /admin/drivers` - Get all drivers
- `POST /admin/drivers/{id}/approve` - Approve driver
- `POST /admin/drivers/{id}/reject` - Reject driver
- `GET /admin/company-employees` - Get all company employees
- `POST /admin/company-employees/{id}/approve` - Approve employee request
- `POST /admin/company-employees/{id}/reject` - Reject employee request
- `GET /admin/company-stats` - Get company statistics

## Database Schema

### Core Tables

#### 1. **users** - User accounts

```sql
- id (Primary Key)
- name (String)
- email (String, Nullable)
- phone (String)
- password (String)
- role (Enum: 'passenger', 'driver')
- is_active (Boolean, Default: true)
- profile_image (String, Nullable)
- created_at, updated_at (Timestamps)
```

#### 2. **drivers** - Driver-specific information

```sql
- id (Primary Key)
- user_id (Foreign Key → users.id, CASCADE DELETE)
- license_number (String)
- status (Enum: 'available', 'on_ride', 'offline', Default: 'offline')
- approval_state (Enum: 'pending', 'approved', 'rejected', Default: 'pending')
- reject_message (String, Nullable)
- license_image_path (String, Default: 'license_images/default.png')
- profile_picture_path (String, Default: 'profile_pictures/default.png')
- rating (Decimal 3,2, Default: 5.00)
- accepted_rides (Unsigned Integer, Default: 0)
- rejected_rides (Unsigned Integer, Default: 0)
- created_at, updated_at (Timestamps)
```

#### 3. **vehicles** - Vehicle information

```sql
- id (Primary Key)
- driver_id (Foreign Key → drivers.id, CASCADE DELETE)
- type (Enum: 'car', 'motorcycle')
- capacity (Integer)
- make (String)
- model (String)
- plate_number (String, Unique)
- color (String)
- year (Integer)
- created_at, updated_at (Timestamps)
```

#### 4. **rides** - Individual ride records

```sql
- id (Primary Key)
- passenger_id (Foreign Key → users.id)
- driver_id (Foreign Key → drivers.id, Nullable)
- origin_lat (Decimal 10,7)
- origin_lng (Decimal 10,7)
- destination_lat (Decimal 10,7)
- destination_lng (Decimal 10,7)
- pickup_address (String)
- destination_address (String)
- price (Decimal 10,2, Nullable)
- status (Enum: 'requested', 'accepted', 'in_progress', 'completed', 'cancelled')
- requested_at (Timestamp, Nullable)
- started_at (Timestamp, Nullable)
- completed_at (Timestamp, Nullable)
- rejected_driver_ids (JSON, Nullable)
- current_driver_id (Integer, Default: 0)
- created_at, updated_at (Timestamps)
```

#### 5. **poolings** - Pool ride records

```sql
- id (Primary Key)
- ride_id (Foreign Key → rides.id, CASCADE DELETE)
- passenger_id (Foreign Key → users.id, CASCADE DELETE)
- driver_id (Foreign Key → drivers.id, CASCADE DELETE)
- origin_lat (Decimal 10,7)
- origin_lng (Decimal 10,7)
- destination_lat (Decimal 10,7)
- destination_lng (Decimal 10,7)
- status (Enum: 'requested', 'accepted', 'in_progress', 'completed', 'cancelled')
- requested_at (Timestamp, Nullable)
- started_at (Timestamp, Nullable)
- completed_at (Timestamp, Nullable)
- created_at, updated_at (Timestamps)
```

#### 6. **pool_rides** - Pool ride management

```sql
- id (Primary Key)
- driver_id (Foreign Key → drivers.id, Nullable, SET NULL)
- status (Enum: 'pending', 'active', 'completed', Default: 'pending')
- origin_lat (Decimal 10,6)
- origin_lng (Decimal 10,6)
- destination_lat (Decimal 10,6)
- destination_lng (Decimal 10,6)
- is_straight_hail (Boolean, Default: false)
- cash_payment (Boolean, Default: true)
- created_at, updated_at (Timestamps)
```

#### 7. **wallets** - User wallet balances

```sql
- id (Primary Key)
- user_id (Foreign Key → users.id, CASCADE DELETE)
- balance (Decimal 12,2, Default: 0)
- created_at, updated_at (Timestamps)
```

#### 8. **transactions** - Wallet transaction history

```sql
- id (Primary Key)
- wallet_id (Foreign Key → wallets.id, CASCADE DELETE)
- amount (Decimal 10,2)
- type (Enum: 'topup', 'withdraw', 'transfer')
- status (Enum: 'pending', 'approved', 'rejected', Default: 'pending')
- note (Text, Nullable)
- created_at, updated_at (Timestamps)
```

#### 9. **payments** - Payment records

```sql
- id (Primary Key)
- ride_id (Foreign Key → rides.id)
- amount (Decimal 10,2)
- method (Enum: 'wallet', 'cash', 'card', 'mobile_money')
- status (Enum: 'pending', 'paid', 'failed')
- paid_at (Timestamp, Nullable)
- created_at, updated_at (Timestamps)
```

#### 10. **ratings** - User ratings and reviews

```sql
- id (Primary Key)
- ride_id (Foreign Key → rides.id)
- from_user_id (Foreign Key → users.id)
- to_user_id (Foreign Key → users.id)
- score (TinyInteger)
- comment (Text, Nullable)
- created_at, updated_at (Timestamps)
```

#### 11. **locations** - Driver location tracking

```sql
- driver_id (Primary Key, Foreign Key → drivers.id, CASCADE DELETE)
- latitude (Decimal 10,7)
- longitude (Decimal 10,7)
- updated_at (Timestamp, Default: CURRENT_TIMESTAMP)
```

#### 12. **admins** - Admin accounts

```sql
- id (Primary Key)
- name (String)
- email (String, Unique)
- password (String)
- created_at, updated_at (Timestamps)
```

#### 13. **companies** - Company information

```sql
- id (Primary Key)
- name (String)
- code (String 10, Unique) - Company code for linking
- description (Text, Nullable)
- address (Text, Nullable)
- phone (String 20, Nullable)
- email (String, Nullable)
- is_active (Boolean, Default: true)
- created_at, updated_at (Timestamps)
```

#### 14. **company_employees** - Employee-company relationships

```sql
- id (Primary Key)
- company_id (Foreign Key → companies.id, CASCADE DELETE)
- user_id (Foreign Key → users.id, CASCADE DELETE)
- status (Enum: 'pending', 'approved', 'rejected', 'left', Default: 'pending')
- requested_at (Timestamp, Default: CURRENT_TIMESTAMP)
- approved_at (Timestamp, Nullable)
- rejected_at (Timestamp, Nullable)
- left_at (Timestamp, Nullable)
- approved_by (Foreign Key → admins.id, Nullable, SET NULL)
- rejection_reason (Text, Nullable)
- created_at, updated_at (Timestamps)
- UNIQUE(company_id, user_id)
- UNIQUE(user_id, status)
```

#### 15. **company_rides** - Company-specific ride records

```sql
- id (Primary Key)
- company_id (Foreign Key → companies.id, CASCADE DELETE)
- employee_id (Foreign Key → users.id, CASCADE DELETE)
- driver_id (Foreign Key → drivers.id, Nullable, SET NULL)
- origin_lat (Decimal 10,7)
- origin_lng (Decimal 10,7)
- destination_lat (Decimal 10,7)
- destination_lng (Decimal 10,7)
- pickup_address (Text)
- destination_address (Text)
- price (Decimal 10,2, Nullable)
- status (Enum: 'requested', 'accepted', 'in_progress', 'completed', 'cancelled')
- requested_at (Timestamp, Nullable)
- started_at (Timestamp, Nullable)
- completed_at (Timestamp, Nullable)
- created_at, updated_at (Timestamps)
```

#### 16. **personal_access_tokens** - API authentication tokens

```sql
- id (Primary Key)
- tokenable_type (String)
- tokenable_id (BigInteger)
- name (String)
- token (String, Unique)
- abilities (Text, Nullable)
- last_used_at (Timestamp, Nullable)
- expires_at (Timestamp, Nullable)
- created_at, updated_at (Timestamps)
```

### Database Relationships

#### Primary Relationships

- **Users** → **Drivers** (One-to-One)
- **Users** → **Wallets** (One-to-One)
- **Drivers** → **Vehicles** (One-to-One)
- **Drivers** → **Locations** (One-to-One)
- **Users** → **Rides** (One-to-Many as passenger)
- **Drivers** → **Rides** (One-to-Many as driver)
- **Rides** → **Payments** (One-to-One)
- **Rides** → **Ratings** (One-to-Many)
- **Wallets** → **Transactions** (One-to-Many)

#### Pooling Relationships

- **Rides** → **Poolings** (One-to-Many)
- **Pool_rides** → **Drivers** (Many-to-One, nullable)
- **Users** → **Poolings** (One-to-Many as passenger)
- **Drivers** → **Poolings** (One-to-Many as driver)

#### Company Relationships

- **Companies** → **CompanyEmployees** (One-to-Many)
- **Companies** → **CompanyRides** (One-to-Many)
- **Users** → **Companies** (Many-to-One, nullable)
- **Users** → **CompanyEmployees** (One-to-One)
- **Users** → **CompanyRides** (One-to-Many as employee)
- **Drivers** → **CompanyRides** (One-to-Many as driver)
- **Admins** → **CompanyEmployees** (One-to-Many as approver)

#### Rating Relationships

- **Users** → **Ratings** (One-to-Many as rater)
- **Users** → **Ratings** (One-to-Many as rated)

### Indexes and Constraints

- **Unique Constraints**:

    - `users.email` (nullable)
    - `vehicles.plate_number`
    - `admins.email`
    - `companies.code`
    - `company_employees.company_id, user_id`
    - `company_employees.user_id, status`
    - `personal_access_tokens.token`

- **Foreign Key Constraints**:

    - All foreign keys have proper CASCADE or SET NULL behavior
    - Referential integrity maintained across all relationships

- **Enum Values**:
    - User roles: `passenger`, `driver`
    - Driver status: `available`, `on_ride`, `offline`
    - Driver approval: `pending`, `approved`, `rejected`
    - Ride status: `requested`, `accepted`, `in_progress`, `completed`, `cancelled`
    - Payment methods: `wallet`, `cash`, `card`, `mobile_money`
    - Transaction types: `topup`, `withdraw`, `transfer`
    - Transaction status: `pending`, `approved`, `rejected`
    - Company employee status: `pending`, `approved`, `rejected`, `left`
    - Company ride status: `requested`, `accepted`, `in_progress`, `completed`, `cancelled`

### Data Types and Precision

- **Coordinates**: Decimal(10,7) for latitude/longitude (GPS precision)
- **Monetary**: Decimal(10,2) for prices, Decimal(12,2) for wallet balances
- **Ratings**: Decimal(3,2) for driver ratings (0.00-5.00)
- **Timestamps**: Standard Laravel timestamps with timezone support

## Real-time Events

The system broadcasts the following events in real-time:

1. **NewRideRequested**: When a passenger requests a ride
2. **RideAccepted**: When a driver accepts a ride
3. **RideRejected**: When a driver rejects a ride
4. **RideStarted**: When a ride begins
5. **RideEnded**: When a ride is completed
6. **RideCancelled**: When a ride is cancelled
7. **DriverArrived**: When driver arrives at pickup location
8. **DriverLocationChange**: Real-time driver location updates
9. **RideStatusChanged**: Any ride status change
10. **UserRegistered**: New user registration
11. **UserSignedIn**: User login events

## Configuration

### Environment Variables

```env
# Database
DB_CONNECTION=sqlite
DB_DATABASE=database/database.sqlite

# Broadcasting
BROADCAST_DRIVER=reverb
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=localhost
REVERB_PORT=8080
REVERB_SCHEME=http

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

## Installation & Setup

1. **Clone the repository**
2. **Install dependencies**: `composer install`
3. **Environment setup**: Copy `.env.example` to `.env`
4. **Generate key**: `php artisan key:generate`
5. **Database setup**: `php artisan migrate`
6. **Seed data**: `php artisan db:seed` (optional)
7. **Start development**: `composer run dev`

## Development Commands

- `composer run dev` - Start development server with queue and Vite
- `composer run dev:ssr` - Start with SSR support
- `composer run test` - Run test suite
- `php artisan queue:work` - Process background jobs
- `php artisan reverb:start` - Start WebSocket server

## Frontend Integration

This backend is designed to work with a React frontend using Inertia.js. The frontend should handle:

- User authentication and registration
- Real-time ride tracking
- Driver location updates
- Wallet management interface
- Admin dashboard
- Ride history and ratings

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "errors": { ... }
}
```

## Security Features

- **API Token Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Eloquent ORM protection
- **CORS Configuration**: Proper cross-origin resource sharing
- **Rate Limiting**: Built-in rate limiting for API endpoints

## Testing

The project includes comprehensive testing using Pest PHP:

- Feature tests for API endpoints
- Unit tests for models and services
- Authentication tests
- Dashboard functionality tests

Run tests with: `composer run test`

## Deployment Considerations

- **Database**: Switch from SQLite to MySQL/PostgreSQL for production
- **Broadcasting**: Configure proper WebSocket server (Reverb/Pusher)
- **Queue**: Set up Redis or database queue for background jobs
- **File Storage**: Configure proper file storage for images
- **SSL**: Ensure HTTPS for production
- **Environment**: Set proper environment variables

## Future Enhancements

- Payment gateway integration
- Push notifications
- Advanced analytics
- Multi-language support
- Advanced ride matching algorithms
- Integration with external mapping services
- Driver earnings tracking
- Promotional codes and discounts

---

This server provides a complete backend solution for a modern ride-sharing application with real-time features, comprehensive user management, and scalable architecture.
