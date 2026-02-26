# Database Migrations Documentation

Generated on: Sat Dec  6 09:16:31 AM EAT 2025

## Migration Summary

Total Migrations: 34

## Migration List

### 2025_05_26_064410_create_personal_access_tokens_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_064410_create_personal_access_tokens_table.php

### 2025_05_26_065500_create_users_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065500_create_users_table.php

### 2025_05_26_065617_create_drivers_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065617_create_drivers_table.php

### 2025_05_26_065637_create_vehicles_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065637_create_vehicles_table.php

### 2025_05_26_065706_create_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065706_create_rides_table.php

### 2025_05_26_065727_create_locations_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065727_create_locations_table.php

### 2025_05_26_065757_create_payments_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065757_create_payments_table.php

### 2025_05_26_065810_create_wallet_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065810_create_wallet_table.php

### 2025_05_26_065825_create_transactions_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065825_create_transactions_table.php

### 2025_05_26_065857_create_ratings_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065857_create_ratings_table.php

### 2025_05_26_065916_create_admins_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_065916_create_admins_table.php

### 2025_05_26_090827_create_sessions_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_090827_create_sessions_table.php

### 2025_05_26_091717_create_cache_table.php
- **Class**: new
- **File**: database/migrations/2025_05_26_091717_create_cache_table.php

### 2025_06_02_112037_rename_type_column_on_vehicles_table.php
- **Class**: new
- **File**: database/migrations/2025_06_02_112037_rename_type_column_on_vehicles_table.php

### 2025_06_25_083831_add_accepted_and_rejected_rides_to_drivers_table.php
- **Class**: new
- **File**: database/migrations/2025_06_25_083831_add_accepted_and_rejected_rides_to_drivers_table.php

### 2025_07_14_061306_add_current_driver_and_rejected_list_to_rides.php
- **Class**: new
- **File**: database/migrations/2025_07_14_061306_add_current_driver_and_rejected_list_to_rides.php

### 2025_07_15_064614_create_pool_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_07_15_064614_create_pool_rides_table.php

### 2025_07_15_064918_add_pool_ride_id_to_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_07_15_064918_add_pool_ride_id_to_rides_table.php

### 2025_07_24_125345_create_poolings_table.php
- **Class**: new
- **File**: database/migrations/2025_07_24_125345_create_poolings_table.php

### 2025_08_20_125458_add_pickup_address_and_destination_address_to_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_08_20_125458_add_pickup_address_and_destination_address_to_rides_table.php

### 2025_10_04_110813_fix_database_schema_issues.php
- **Class**: new
- **File**: database/migrations/2025_10_04_110813_fix_database_schema_issues.php

### 2025_10_04_110945_create_driver_locations_table.php
- **Class**: new
- **File**: database/migrations/2025_10_04_110945_create_driver_locations_table.php

### 2025_10_04_122709_add_location_fields_to_drivers_table.php
- **Class**: new
- **File**: database/migrations/2025_10_04_122709_add_location_fields_to_drivers_table.php

### 2025_10_04_183401_add_payment_transaction_type.php
- **Class**: new
- **File**: database/migrations/2025_10_04_183401_add_payment_transaction_type.php

### 2025_10_04_200757_create_driver_fcm_tokens_table.php
- **Class**: new
- **File**: database/migrations/2025_10_04_200757_create_driver_fcm_tokens_table.php

### 2025_10_05_060753_add_enhanced_rating_fields_to_drivers_table.php
- **Class**: new
- **File**: database/migrations/2025_10_05_060753_add_enhanced_rating_fields_to_drivers_table.php

### 2025_11_22_062019_create_companies_table.php
- **Class**: new
- **File**: database/migrations/2025_11_22_062019_create_companies_table.php

### 2025_11_22_062024_create_employees_table.php
- **Class**: new
- **File**: database/migrations/2025_11_22_062024_create_employees_table.php

### 2025_11_22_062025_create_company_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_11_22_062025_create_company_rides_table.php

### 2025_11_27_143639_create_documents_table.php
- **Class**: new
- **File**: database/migrations/2025_11_27_143639_create_documents_table.php

### 2025_11_27_144215_add_profile_fields_to_drivers_table.php
- **Class**: new
- **File**: database/migrations/2025_11_27_144215_add_profile_fields_to_drivers_table.php

### 2025_11_27_144239_add_features_to_vehicles_table.php
- **Class**: new
- **File**: database/migrations/2025_11_27_144239_add_features_to_vehicles_table.php

### 2025_11_29_194500_create_promotions_table.php
- **Class**: new
- **File**: database/migrations/2025_11_29_194500_create_promotions_table.php

### 2025_12_04_153210_add_missing_columns_to_rides_table.php
- **Class**: new
- **File**: database/migrations/2025_12_04_153210_add_missing_columns_to_rides_table.php


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

