# Company Management Backend Implementation

## Overview

This document outlines the implementation requirements for adding company management features to the ECAB ride-sharing backend. The system will support employee-company relationships, company ride management, and approval workflows.

## New Features to Implement

### 1. Company Management

- Company registration and profile management
- Employee linking to companies with approval workflow
- Company ride management and tracking
- One employee per company constraint

### 2. Employee-Company Workflow

- Employee requests to link to a company
- Company approval/rejection of employee requests
- Employee leaving company functionality
- Company state management (none, pending, linked)

## Database Schema Extensions

### New Tables

#### 1. **companies** - Company information

```sql
CREATE TABLE companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL, -- Company code for linking (e.g., "ABC123")
    description TEXT NULL,
    address TEXT NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
);
```

#### 2. **company_employees** - Employee-company relationships

```sql
CREATE TABLE company_employees (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'left') DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP NULL,
    rejected_at TIMESTAMP NULL,
    left_at TIMESTAMP NULL,
    approved_by BIGINT UNSIGNED NULL, -- Admin who approved
    rejection_reason TEXT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL,

    UNIQUE KEY unique_company_user (company_id, user_id),
    UNIQUE KEY unique_active_employee (user_id, status) -- One active employee per user
);
```

#### 3. **company_rides** - Company-specific ride records

```sql
CREATE TABLE company_rides (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    employee_id BIGINT UNSIGNED NOT NULL,
    driver_id BIGINT UNSIGNED NULL,
    origin_lat DECIMAL(10,7) NOT NULL,
    origin_lng DECIMAL(10,7) NOT NULL,
    destination_lat DECIMAL(10,7) NOT NULL,
    destination_lng DECIMAL(10,7) NOT NULL,
    pickup_address TEXT NOT NULL,
    destination_address TEXT NOT NULL,
    price DECIMAL(10,2) NULL,
    status ENUM('requested', 'accepted', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
    requested_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);
```

### Updated Tables

#### **users** table - Add company-related fields

```sql
ALTER TABLE users ADD COLUMN is_employee BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN company_id BIGINT UNSIGNED NULL;
ALTER TABLE users ADD COLUMN company_name VARCHAR(255) NULL;

ALTER TABLE users ADD FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
```

## API Endpoints

### Company Management

#### 1. **POST /api/company/register** - Register a new company

```json
Request:
{
    "name": "Acme Corporation",
    "code": "ACME123",
    "description": "Technology company",
    "address": "123 Main St, City",
    "phone": "+1234567890",
    "email": "contact@acme.com"
}

Response:
{
    "success": true,
    "data": {
        "company": {
            "id": 1,
            "name": "Acme Corporation",
            "code": "ACME123",
            "description": "Technology company",
            "address": "123 Main St, City",
            "phone": "+1234567890",
            "email": "contact@acme.com",
            "is_active": true,
            "created_at": "2024-01-01T00:00:00Z"
        }
    },
    "message": "Company registered successfully"
}
```

#### 2. **GET /api/company/list** - List all companies (Admin only)

```json
Response:
{
    "success": true,
    "data": {
        "companies": [
            {
                "id": 1,
                "name": "Acme Corporation",
                "code": "ACME123",
                "employee_count": 5,
                "is_active": true,
                "created_at": "2024-01-01T00:00:00Z"
            }
        ]
    }
}
```

### Employee-Company Linking

#### 3. **POST /api/employee/link-company** - Request to link to a company

```json
Request:
{
    "code": "ACME123"
}

Response (Pending):
{
    "success": true,
    "status": "pending",
    "data": {
        "company": {
            "id": 1,
            "name": "Acme Corporation"
        },
        "request_id": 101,
        "requested_at": "2024-01-01T10:31:00Z"
    },
    "message": "Request sent. Awaiting company approval."
}

Response (Immediate Approval):
{
    "success": true,
    "status": "linked",
    "data": {
        "user": {
            "id": 7,
            "is_employee": true,
            "company_id": 1,
            "company_name": "Acme Corporation"
        }
    },
    "message": "Successfully linked to company"
}
```

#### 4. **GET /api/employee/company-info** - Get employee's company information

```json
Response:
{
    "success": true,
    "data": {
        "state": "linked", // "none", "pending", "linked"
        "company": {
            "id": 1,
            "name": "Acme Corporation",
            "code": "ACME123"
        },
        "requested_at": "2024-01-01T10:31:00Z",
        "approved_at": "2024-01-01T11:00:00Z"
    }
}
```

#### 5. **POST /api/employee/leave-company** - Leave current company

```json
Response:
{
    "success": true,
    "data": {
        "state": "none"
    },
    "message": "Successfully left company"
}
```

#### 6. **POST /api/employee/cancel-link-request** - Cancel pending link request

```json
Response:
{
    "success": true,
    "data": {
        "state": "none"
    },
    "message": "Link request cancelled"
}
```

### Company Ride Management

#### 7. **POST /api/company/ride/request** - Request a company ride

```json
Request:
{
    "origin_lat": 9.0192,
    "origin_lng": 38.7525,
    "destination_lat": 9.0192,
    "destination_lng": 38.7525,
    "pickup_address": "Addis Ababa, Ethiopia",
    "destination_address": "Bole Airport, Addis Ababa"
}

Response:
{
    "success": true,
    "data": {
        "ride": {
            "id": 1,
            "company_id": 1,
            "employee_id": 7,
            "origin_lat": 9.0192,
            "origin_lng": 38.7525,
            "destination_lat": 9.0192,
            "destination_lng": 38.7525,
            "pickup_address": "Addis Ababa, Ethiopia",
            "destination_address": "Bole Airport, Addis Ababa",
            "status": "requested",
            "requested_at": "2024-01-01T10:31:00Z"
        }
    }
}
```

#### 8. **GET /api/company/rides** - Get company ride history

```json
Response:
{
    "success": true,
    "data": {
        "rides": [
            {
                "id": 1,
                "origin_address": "Addis Ababa, Ethiopia",
                "destination_address": "Bole Airport, Addis Ababa",
                "status": "completed",
                "price": 150.00,
                "requested_at": "2024-01-01T10:31:00Z",
                "completed_at": "2024-01-01T11:15:00Z"
            }
        ]
    }
}
```

### Admin Company Management

#### 9. **GET /api/admin/company-employees** - Get all company employees (Admin only)

```json
Response:
{
    "success": true,
    "data": {
        "employees": [
            {
                "id": 1,
                "user": {
                    "id": 7,
                    "name": "John Doe",
                    "email": "john@example.com",
                    "phone": "+1234567890"
                },
                "company": {
                    "id": 1,
                    "name": "Acme Corporation"
                },
                "status": "approved",
                "requested_at": "2024-01-01T10:31:00Z",
                "approved_at": "2024-01-01T11:00:00Z"
            }
        ]
    }
}
```

#### 10. **POST /api/admin/company-employees/{id}/approve** - Approve employee request

```json
Response:
{
    "success": true,
    "data": {
        "employee": {
            "id": 1,
            "status": "approved",
            "approved_at": "2024-01-01T11:00:00Z"
        }
    },
    "message": "Employee request approved"
}
```

#### 11. **POST /api/admin/company-employees/{id}/reject** - Reject employee request

```json
Request:
{
    "rejection_reason": "Invalid company code"
}

Response:
{
    "success": true,
    "data": {
        "employee": {
            "id": 1,
            "status": "rejected",
            "rejected_at": "2024-01-01T11:00:00Z",
            "rejection_reason": "Invalid company code"
        }
    },
    "message": "Employee request rejected"
}
```

## Business Logic Requirements

### 1. Employee-Company Constraints

- **One Employee Per Company**: A user can only be linked to one company at a time
- **One Employee Per User**: A company can only have one employee per user account
- **Status Management**: Track pending, approved, rejected, and left states

### 2. Company Code System

- Generate unique 6-character alphanumeric codes for companies
- Codes should be case-insensitive for linking
- Format: `[A-Z0-9]{6}` (e.g., "ABC123", "XYZ789")

### 3. Approval Workflow

- Employee requests link with company code
- Admin can approve/reject requests
- Automatic approval for certain conditions (if needed)
- Email notifications for status changes

### 4. Company Ride Features

- Separate ride system for company employees
- Company-specific ride tracking and reporting
- Integration with existing ride system
- Company billing and reporting

## Model Classes

### Company Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    protected $fillable = [
        'name', 'code', 'description', 'address',
        'phone', 'email', 'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(CompanyEmployee::class);
    }

    public function rides(): HasMany
    {
        return $this->hasMany(CompanyRide::class);
    }
}
```

### CompanyEmployee Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyEmployee extends Model
{
    protected $fillable = [
        'company_id', 'user_id', 'status', 'requested_at',
        'approved_at', 'rejected_at', 'left_at',
        'approved_by', 'rejection_reason'
    ];

    protected $casts = [
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'approved_by');
    }
}
```

### CompanyRide Model

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanyRide extends Model
{
    protected $fillable = [
        'company_id', 'employee_id', 'driver_id',
        'origin_lat', 'origin_lng', 'destination_lat', 'destination_lng',
        'pickup_address', 'destination_address', 'price', 'status',
        'requested_at', 'started_at', 'completed_at'
    ];

    protected $casts = [
        'origin_lat' => 'decimal:7',
        'origin_lng' => 'decimal:7',
        'destination_lat' => 'decimal:7',
        'destination_lng' => 'decimal:7',
        'price' => 'decimal:2',
        'requested_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
```

## Controller Structure

### CompanyController

- `register()` - Register new company
- `list()` - List all companies (Admin)
- `show($id)` - Show company details
- `update($id)` - Update company information
- `delete($id)` - Delete company (Admin)

### EmployeeController

- `linkCompany()` - Request to link to company
- `getCompanyInfo()` - Get employee's company info
- `leaveCompany()` - Leave current company
- `cancelLinkRequest()` - Cancel pending request

### CompanyRideController

- `requestRide()` - Request company ride
- `getRides()` - Get company ride history
- `getRide($id)` - Get specific ride details
- `cancelRide($id)` - Cancel company ride

### AdminCompanyController

- `getEmployees()` - Get all company employees
- `approveEmployee($id)` - Approve employee request
- `rejectEmployee($id)` - Reject employee request
- `getCompanyStats()` - Get company statistics

## Migration Files

### 1. Create Companies Table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('companies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code', 10)->unique();
            $table->text('description')->nullable();
            $table->text('address')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('email')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('companies');
    }
};
```

### 2. Create Company Employees Table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('company_employees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected', 'left'])->default('pending');
            $table->timestamp('requested_at')->useCurrent();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('left_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('admins')->onDelete('set null');
            $table->text('rejection_reason')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'user_id']);
            $table->unique(['user_id', 'status']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('company_employees');
    }
};
```

### 3. Create Company Rides Table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('company_rides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('driver_id')->nullable()->constrained('drivers')->onDelete('set null');
            $table->decimal('origin_lat', 10, 7);
            $table->decimal('origin_lng', 10, 7);
            $table->decimal('destination_lat', 10, 7);
            $table->decimal('destination_lng', 10, 7);
            $table->text('pickup_address');
            $table->text('destination_address');
            $table->decimal('price', 10, 2)->nullable();
            $table->enum('status', ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'])->default('requested');
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('company_rides');
    }
};
```

### 4. Update Users Table

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_employee')->default(false);
            $table->foreignId('company_id')->nullable()->constrained()->onDelete('set null');
            $table->string('company_name')->nullable();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['company_id']);
            $table->dropColumn(['is_employee', 'company_id', 'company_name']);
        });
    }
};
```

## Testing Requirements

### Unit Tests

- Company model relationships
- Employee linking logic
- Company code generation
- Status transitions

### Feature Tests

- API endpoint responses
- Authentication requirements
- Validation rules
- Error handling

### Integration Tests

- Complete employee linking workflow
- Company ride lifecycle
- Admin approval process

## Security Considerations

1. **Authentication**: All endpoints require valid API token
2. **Authorization**: Role-based access control
3. **Validation**: Input validation for all requests
4. **Rate Limiting**: Prevent abuse of linking requests
5. **Data Privacy**: Secure handling of company information

## Implementation Priority

1. **Phase 1**: Database schema and models
2. **Phase 2**: Basic company management endpoints
3. **Phase 3**: Employee linking workflow
4. **Phase 4**: Company ride management
5. **Phase 5**: Admin management features
6. **Phase 6**: Testing and optimization

## Notes for Backend Team

- Follow existing Laravel patterns and conventions
- Use the same response format as existing API endpoints
- Implement proper error handling and validation
- Add comprehensive logging for debugging
- Consider adding email notifications for status changes
- Ensure database transactions for data consistency
- Add proper indexes for performance optimization

This implementation will seamlessly integrate with the existing ECAB backend while adding the required company management functionality for the Android app.
