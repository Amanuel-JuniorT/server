# Database Migrations Documentation

Generated on: Tue Feb 17 11:20:29 AM EAT 2026

## Migration Summary

Total Migrations: 26

## Migration List

### 2024_01_01_000001_create_system_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000001_create_system_tables.php

### 2024_01_01_000002_create_companies_table.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000002_create_companies_table.php

### 2024_01_01_000003_create_users_table.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000003_create_users_table.php

### 2024_01_01_000004_create_drivers_and_vehicles_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000004_create_drivers_and_vehicles_tables.php

### 2024_01_01_000005_create_company_groups_and_members_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000005_create_company_groups_and_members_tables.php

### 2024_01_01_000006_create_ride_systems_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000006_create_ride_systems_tables.php

### 2024_01_01_000007_create_financial_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000007_create_financial_tables.php

### 2024_01_01_000008_create_pooling_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000008_create_pooling_tables.php

### 2024_01_01_000009_create_support_tables.php
- **Class**: new
- **File**: database/migrations/2024_01_01_000009_create_support_tables.php

### 2024_01_13_000001_update_admins_table_for_invitations.php
- **Class**: new
- **File**: database/migrations/2024_01_13_000001_update_admins_table_for_invitations.php

### 2024_01_13_000002_create_admin_invitations_table.php
- **Class**: new
- **File**: database/migrations/2024_01_13_000002_create_admin_invitations_table.php

### 2026_01_21_120000_add_receipt_path_to_transactions.php
- **Class**: new
- **File**: database/migrations/2026_01_21_120000_add_receipt_path_to_transactions.php

### 2026_01_22_125859_create_sos_alerts_table.php
- **Class**: new
- **File**: database/migrations/2026_01_22_125859_create_sos_alerts_table.php

### 2026_01_22_134656_create_audit_logs_table.php
- **Class**: new
- **File**: database/migrations/2026_01_22_134656_create_audit_logs_table.php

### 2026_01_22_141601_fix_audit_logs_foreign_key.php
- **Class**: new
- **File**: database/migrations/2026_01_22_141601_fix_audit_logs_foreign_key.php

### 2026_01_26_100113_create_vehicle_types_table.php
- **Class**: new
- **File**: database/migrations/2026_01_26_100113_create_vehicle_types_table.php

### 2026_01_26_100144_add_vehicle_type_id_to_vehicles_and_rides_table.php
- **Class**: new
- **File**: database/migrations/2026_01_26_100144_add_vehicle_type_id_to_vehicles_and_rides_table.php

### 2026_01_29_100029_change_vehicle_type_to_string_in_vehicles_table.php
- **Class**: new
- **File**: database/migrations/2026_01_29_100029_change_vehicle_type_to_string_in_vehicles_table.php

### 2026_01_30_165550_drop_vehicle_type_check_constraint.php
- **Class**: new
- **File**: database/migrations/2026_01_30_165550_drop_vehicle_type_check_constraint.php

### 2026_02_05_080244_add_fcm_token_to_users_table.php
- **Class**: new
- **File**: database/migrations/2026_02_05_080244_add_fcm_token_to_users_table.php

### 2026_02_06_223551_finalize_rides_status_check.php
- **Class**: new
- **File**: database/migrations/2026_02_06_223551_finalize_rides_status_check.php

### 2026_02_07_000001_update_rides_status_check.php
- **Class**: new
- **File**: database/migrations/2026_02_07_000001_update_rides_status_check.php

### 2026_02_10_053349_add_actual_data_to_rides_table.php
- **Class**: new
- **File**: database/migrations/2026_02_10_053349_add_actual_data_to_rides_table.php

### 2026_02_10_054909_add_privacy_settings_to_users_table.php
- **Class**: new
- **File**: database/migrations/2026_02_10_054909_add_privacy_settings_to_users_table.php

### 2026_02_10_200000_create_promotions_table.php
- **Class**: new
- **File**: database/migrations/2026_02_10_200000_create_promotions_table.php

### 2026_02_14_172353_add_arrived_at_to_rides_table.php
- **Class**: new
- **File**: database/migrations/2026_02_14_172353_add_arrived_at_to_rides_table.php


## Migration Order

Migrations are executed in chronological order based on their timestamp prefix.

## Production Deployment

When deploying to production:

1. Backup the production database
2. Run: `php artisan migrate:status` to check current state
3. Run: `php artisan migrate --force` to apply new migrations
4. Verify: `php artisan migrate:status` to confirm all migrations ran

## Rollback Strategy

If a migration fails in production:

```bash
# Rollback last batch
php artisan migrate:rollback --step=1

# Rollback specific migration
php artisan migrate:rollback --path=/database/migrations/YYYY_MM_DD_XXXXXX_migration_name.php
```

## Fresh Installation

For a fresh database setup:

```bash
# Drop all tables and re-run migrations
php artisan migrate:fresh

# With seeders
php artisan migrate:fresh --seed
```

## Important Notes

- Never modify migrations that have been run in production
- Always create new migrations for schema changes
- Test migrations on a staging environment before production
- Keep migration files in version control
- Document any manual database changes

