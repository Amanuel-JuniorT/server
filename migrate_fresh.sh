#!/bin/bash

 php artisan migrate:fresh

 php artisan db:seed --class=SuperAdminSeeder

 php artisan db:seed --class=VehicleTypeSeeder

 