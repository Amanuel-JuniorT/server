#!/bin/bash

#Optimize Clearing
php artisan optimize:clear

#Migrate Fresh
php artisan migrate:fresh

#Super Admin Seeder
php artisan db:seed --class=SuperAdminSeeder

#Vehicle Type Seeder
php artisan db:seed --class=VehicleTypeSeeder

 