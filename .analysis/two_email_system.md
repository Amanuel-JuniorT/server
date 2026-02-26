# Two Email System - Implementation

## Overview

The system now clearly distinguishes between two types of email addresses:

### 1. **Company Email** 📧

- **Purpose**: General company contact information
- **Usage**: Public-facing email for the company
- **Field**: `email` in companies table
- **Label**: "Company Email"
- **Placeholder**: `company@example.com`
- **Helper Text**: "General company contact email"
- **Required**: No (optional)

### 2. **Admin Email (Login)** 🔐

- **Purpose**: Login credentials for the company administrator
- **Usage**: Used to authenticate and access the admin panel
- **Field**: `email` in admins table
- **Label**: "Admin Email (Login) \*"
- **Placeholder**: `admin@example.com`
- **Helper Text**: "Email for admin login credentials (can be different from company email)"
- **Required**: Yes (mandatory)

## Use Cases

### Scenario 1: Same Email for Both

**Example**: Small company where the owner manages everything

```
Company Email: info@smallbiz.com
Admin Email: info@smallbiz.com
```

✅ Valid - Both can be the same

### Scenario 2: Different Emails

**Example**: Large company with dedicated IT admin

```
Company Email: contact@bigcorp.com
Admin Email: it.admin@bigcorp.com
```

✅ Valid - Recommended for better separation

### Scenario 3: Personal Email for Admin

**Example**: Company wants to use admin's personal email for login

```
Company Email: info@company.com
Admin Email: john.doe@gmail.com
```

✅ Valid - Admin uses personal email for login

## Form Layout

```
┌─────────────────────────────────────────┐
│  Create New Company                     │
├─────────────────────────────────────────┤
│                                         │
│  Company Name *                         │
│  [Enter company name]                   │
│                                         │
│  Company Code                           │
│  [Leave empty for auto-generation]      │
│                                         │
│  Description                            │
│  [Enter company description]            │
│                                         │
│  Address                                │
│  [Enter company address]                │
│                                         │
│  Phone              Company Email       │
│  [Enter phone]      [company@...]       │
│                     General company     │
│                     contact email       │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Company Admin Credentials              │
│  Create login credentials for the       │
│  company administrator                  │
│                                         │
│  Admin Email (Login) *                  │
│  [admin@example.com]                    │
│  Email for admin login credentials      │
│  (can be different from company email)  │
│                                         │
│  Admin Password *                       │
│  [Minimum 8 characters]                 │
│  Password must be at least 8 chars      │
│                                         │
│  [Cancel]              [Create Company] │
└─────────────────────────────────────────┘
```

## Benefits

### ✅ **Clarity**

- Users clearly understand the purpose of each email field
- No confusion between company contact and admin login

### ✅ **Flexibility**

- Company can use different emails for different purposes
- Admin can use personal email if preferred
- Better security by separating concerns

### ✅ **Professional**

- Allows companies to maintain professional company email
- While using different email for admin access

### ✅ **Security**

- Admin login email can be kept private
- Company email can be public-facing

## Validation

### Company Email

- Format: Valid email format
- Uniqueness: Must be unique across companies (if provided)
- Required: No (optional field)

### Admin Email

- Format: Valid email format
- Uniqueness: Must be unique across all admins
- Required: Yes (mandatory field)
- Purpose: Used for authentication

## Database Structure

### Companies Table

```sql
email VARCHAR(255) NULLABLE  -- General company contact
```

### Admins Table

```sql
email VARCHAR(255) UNIQUE NOT NULL  -- Admin login credential
```

## Example Data

### Company Record

```json
{
    "id": 1,
    "name": "Tech Solutions Ltd",
    "code": "TECH01",
    "email": "contact@techsolutions.com", // Company email
    "phone": "+251911234567",
    "address": "123 Tech Street, Addis Ababa"
}
```

### Admin Record

```json
{
    "id": 1,
    "name": "Tech Solutions Ltd Admin",
    "email": "admin@techsolutions.com", // Admin login email
    "role": "company_admin",
    "company_id": 1
}
```

## User Experience

1. **Creating Company**:

    - Fill company details including optional company email
    - Fill admin credentials with required admin email
    - Admin email can match or differ from company email

2. **Admin Login**:

    - Uses the admin email (not company email)
    - Clear separation of concerns

3. **Contact Information**:
    - Public uses company email for general inquiries
    - Admin uses admin email for system access
