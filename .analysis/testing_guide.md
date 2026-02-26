# Testing Company Admin Creation

## Quick Test Steps

### 1. Test Public Registration Restriction

**Endpoint**: `POST http://localhost:8000/api/register`

**Test Case**: Try to register with company_admin role (should fail)

```json
{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+251912345678",
    "password": "password123",
    "role": "company_admin"
}
```

**Expected Result**: ❌ Validation error

```json
{
    "status": "errors",
    "message": {
        "role": ["The selected role is invalid."]
    }
}
```

**Test Case**: Register with passenger role (should succeed)

```json
{
    "name": "Test Passenger",
    "email": "passenger@example.com",
    "phone": "+251912345679",
    "password": "password123",
    "role": "passenger"
}
```

**Expected Result**: ✅ Success

```json
{
    "status": "success",
    "data": {
        "user": {...},
        "token": "..."
    }
}
```

---

### 2. Test Company Creation with Admin

**Steps**:

1. Login to admin panel at `http://localhost:8000/login`
2. Navigate to Companies page
3. Click "Add Company" button
4. Fill in the form:

**Company Details**:

- Company Name: `Test Company Ltd`
- Company Code: (leave empty for auto-generation)
- Description: `A test company for verification`
- Address: `123 Test Street, Addis Ababa`
- Phone: `+251911111111`
- Email: `info@testcompany.com`

**Admin Credentials**:

- Admin Email: `admin@testcompany.com`
- Admin Password: `SecurePass123`

5. Click "Create Company"

**Expected Result**:

- ✅ Success message: "Company and admin account created successfully!"
- Company appears in the companies list
- Admin account is created in the database

---

### 3. Test Admin Login

**Steps**:

1. Logout from super admin
2. Go to admin login page
3. Login with:
    - Email: `admin@testcompany.com`
    - Password: `SecurePass123`

**Expected Result**:

- ✅ Successfully logged in
- Admin has access to their company dashboard
- Admin can only see/manage their assigned company

---

### 4. Database Verification

**Check Companies Table**:

```sql
SELECT * FROM companies WHERE name = 'Test Company Ltd';
```

**Expected**:

- Company record exists
- Has auto-generated code (if left empty)
- All fields populated correctly

**Check Admins Table**:

```sql
SELECT id, name, email, role, company_id FROM admins WHERE email = 'admin@testcompany.com';
```

**Expected**:

- Admin record exists
- `name` = "Test Company Ltd Admin"
- `email` = "admin@testcompany.com"
- `role` = "company_admin"
- `company_id` matches the company ID
- `password` is hashed (not visible in plain text)

---

### 5. Test Validation

**Test Duplicate Admin Email**:
Try creating another company with the same admin email `admin@testcompany.com`

**Expected Result**: ❌ Error message
"An admin with this email already exists."

**Test Short Password**:
Try creating a company with admin password `pass123` (7 characters)

**Expected Result**: ❌ Error message
"Admin password must be at least 8 characters."

**Test Invalid Email**:
Try creating a company with admin email `invalid-email`

**Expected Result**: ❌ Error message
"Please enter a valid admin email address."

---

## Manual Testing Checklist

- [ ] Public registration rejects company_admin role
- [ ] Public registration accepts passenger/driver roles
- [ ] Company creation form shows admin credential fields
- [ ] Email validation works (format check)
- [ ] Email uniqueness validation works
- [ ] Password minimum length validation works (8 chars)
- [ ] Company and admin are created together
- [ ] Admin can login with created credentials
- [ ] Admin password is hashed in database
- [ ] Admin is linked to correct company
- [ ] Transaction rolls back on error
- [ ] Success message appears on successful creation
- [ ] Error messages are clear and helpful

---

## Automated Test (Optional)

You can create a feature test in Laravel:

```php
// tests/Feature/CompanyAdminCreationTest.php

public function test_public_registration_rejects_company_admin_role()
{
    $response = $this->postJson('/api/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'phone' => '+251912345678',
        'password' => 'password123',
        'role' => 'company_admin'
    ]);

    $response->assertStatus(400)
             ->assertJsonPath('status', 'errors');
}

public function test_company_creation_creates_admin_account()
{
    $this->actingAs($superAdmin);

    $response = $this->post('/companies', [
        'name' => 'Test Company',
        'admin_email' => 'admin@test.com',
        'admin_password' => 'SecurePass123'
    ]);

    $response->assertSessionHas('success');

    $this->assertDatabaseHas('companies', ['name' => 'Test Company']);
    $this->assertDatabaseHas('admins', [
        'email' => 'admin@test.com',
        'role' => 'company_admin'
    ]);
}
```

Run with: `php artisan test --filter CompanyAdminCreationTest`
