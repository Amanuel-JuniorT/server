# Company Feature - Passenger Side (README)

This document explains how the **Company Transport** feature is implemented on the **passenger side** and how it integrates with the existing ride system.

---

## 🚗 Overview

The Company Feature allows companies to manage transportation for their employees. Rides are **scheduled** at pre-determined times (e.g., morning to work, evening back home), and employees typically **cannot order rides on-demand**. In certain cases, companies may assign additional rides if necessary.

---

## 🧭 Passenger App Integration

### 1. Authentication
Employees log in normally. Their profile is linked to a company, which determines available rides.

### 2. Ride Access Flow
- Employees can **view scheduled rides** assigned to them.
- Employees **cannot request rides freely**; rides are pre-scheduled by the company.
- If the company adds an extra ride, the employee will see the new assignment in the app.

### 3. API Integration
New API endpoints handle:
- `/api/company/rides` → list rides assigned to employees
- `/api/company/summary` → statistics and ride history for company admins

### 4. Database Additions
- `companies` table: stores company info.
- `company_users` table: maps users to companies.
- `scheduled_rides` table: stores all rides scheduled by companies for employees.

---

## 🧑‍💼 Admin Panel (Company Admin)

### Option 1: External Web Page
Create a **dedicated web dashboard** for companies using Laravel + Inertia + React (or Vue).  
This allows flexible scheduling and reporting.

### Option 2: Extend Existing Admin
Extend the current Laravel admin panel:
- Add a `company` role.
- Restrict access using middleware (`can:manage-company`).
- Load a different dashboard view for company admins.

#### Example:
```php
// routes/web.php
Route::middleware(['auth', 'role:company'])->group(function () {
    Route::get('/company/dashboard', [CompanyController::class, 'index'])->name('company.dashboard');
});
 ```
