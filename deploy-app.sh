#!/bin/bash

# ECAB Application Deployment Script
# Run this script after the server setup is complete

set -e

APP_DIR="/var/www/ecab"
REPO_URL="your-git-repo-url"  # Update this with your actual repository URL

echo "🚀 Deploying ECAB Application..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Navigate to application directory
cd $APP_DIR

# Pull latest changes (if using git deployment)
if [ -d ".git" ]; then
    print_status "Pulling latest changes from repository..."
    git pull origin main
else
    print_warning "Not a git repository. Please upload your files manually."
fi

# Install PHP dependencies
print_status "Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev

# Install Node dependencies
print_status "Installing Node.js dependencies..."
npm ci

# Build frontend assets
print_status "Building frontend assets..."
npm run build

# Set proper permissions
print_status "Setting proper permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod -R 775 $APP_DIR/storage
chmod -R 775 $APP_DIR/bootstrap/cache

# Run migrations
print_status "Running database migrations..."
php artisan migrate --force

# Clear and cache configuration
print_status "Optimizing application..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

php artisan config:cache
php artisan route:cache
php artisan view:cache

# Create storage link
print_status "Creating storage link..."
php artisan storage:link

# Restart services
print_status "Restarting services..."
systemctl restart php8.2-fpm
systemctl restart nginx
supervisorctl reread
supervisorctl update
supervisorctl restart all

print_status "Deployment completed successfully!"
echo ""
echo "Application is now running at: http://$(curl -s ifconfig.me)"
echo "Don't forget to set up SSL certificate with: certbot --nginx -d your-domain.com"
