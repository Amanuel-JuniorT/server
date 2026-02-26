# Company Admin Account Creation - Implementation Summary

## Overview

Implemented a secure system for creating company admin accounts when a new company is created, while preventing unauthorized company_admin role creation through public registration.

## Changes Made

### 1. ✅ Restricted Public Registration (AuthManager.php)

**File**: `app/Http/Controllers/AuthManager.php`

- Updated role validation to only allow `passenger` and `driver` roles
- Prevents `company_admin` role from being created via `/register` endpoint
- Added comment for clarity: `// Only allow passenger and driver`

**Code Change**:

```php
'role' => 'required|string|in:passenger,driver', // Only allow passenger and driver
```

### 2. ✅ Updated Frontend Form (companies.tsx)

**File**: `resources/js/pages/companies.tsx`

**Added Fields to State**:

- `admin_email`: Email for company admin account
- `admin_password`: Password for company admin account

**Added UI Section**:

- New "Company Admin Credentials" section in the create dialog
- Email input field (required, validated)
- Password input field (required, min 8 characters)
- Clear visual separation with border and descriptive text
- Proper validation and error handling

**Features**:

- Required field validation
- Email format validation
- Minimum password length (8 characters)
- Disabled state during submission
- Helper text for password requirements

### 3. ✅ Updated Backend Controller (AdminDashboardController.php)

**File**: `app/Http/Controllers/AdminDashboardController.php`

**Added Validation Rules**:

```php
'admin_email' => 'required|email|max:255|unique:admins,email',
'admin_password' => 'required|string|min:8',
```

**Added Custom Error Messages**:

- Clear, user-friendly validation messages
- Specific messages for duplicate admin emails
- Password requirement messages

**Database Transaction**:

- Wrapped company and admin creation in `DB::beginTransaction()`
- Automatic rollback on failure
- Creates both company and admin atomically

**Admin Account Creation**:

```php
$admin = \App\Models\Admin::create([
    'name' => $company->name . ' Admin',
    'email' => $request->admin_email,
    'password' => Hash::make($request->admin_password),
    'role' => 'company_admin',
    'company_id' => $company->id,
]);
```

**Added Import**:

- `use Illuminate\Support\Facades\Hash;`

## Security Features

1. **Role Restriction**: Public registration cannot create admin accounts
2. **Email Uniqueness**: Admin emails must be unique across all admins
3. **Password Hashing**: Passwords are hashed using Laravel's Hash facade
4. **Transaction Safety**: Both company and admin are created together or not at all
5. **Validation**: Comprehensive server-side and client-side validation

## User Flow

### Creating a Company with Admin:

1. Super admin navigates to Companies page
2. Clicks "Add Company" button
3. Fills in company details:
    - Company Name (required)
    - Company Code (optional, auto-generated if empty)
    - Description
    - Address
    - Phone
    - Email
4. Fills in admin credentials:
    - Admin Email (required, must be unique)
    - Admin Password (required, min 8 characters)
5. Clicks "Create Company"
6. System creates:
    - Company record
    - Admin account with `company_admin` role linked to the company
7. Success message: "Company and admin account created successfully!"

### Company Admin Login:

1. Admin navigates to admin login page
2. Enters the email and password created during company setup
3. Logs in with `company_admin` role
4. Has access to manage their specific company

## Database Structure

### Admins Table:

- `id`: Primary key
- `name`: Admin name (auto-generated as "{Company Name} Admin")
- `email`: Unique email for login
- `password`: Hashed password
- `role`: Either 'super_admin' or 'company_admin'
- `company_id`: Foreign key to companies table (for company_admin)

## Testing Checklist

- [ ] Public registration cannot create company_admin role
- [ ] Company creation form shows admin credential fields
- [ ] Email validation works (format and uniqueness)
- [ ] Password validation works (minimum 8 characters)
- [ ] Company and admin are created together
- [ ] Transaction rolls back on error
- [ ] Admin can login with created credentials
- [ ] Admin has access to their company only
- [ ] Duplicate admin email shows proper error message

## Notes

- Admin name is automatically set to "{Company Name} Admin"
- Can be changed later if needed
- Company admin is automatically linked to their company via `company_id`
- Super admins can manage all companies
- Company admins can only manage their assigned company
