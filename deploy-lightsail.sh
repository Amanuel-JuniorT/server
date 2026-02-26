#!/bin/bash

# ECAB Backend Deployment Script for AWS Lightsail
# This script prepares and deploys the Laravel backend

set -e

echo "🚀 Starting ECAB Backend Deployment..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
print_status "Installing required packages..."
apt-get install -y \
    nginx \
    postgresql \
    postgresql-contrib \
    php8.2 \
    php8.2-fpm \
    php8.2-pgsql \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-bcmath \
    php8.2-curl \
    php8.2-zip \
    php8.2-gd \
    php8.2-redis \
    composer \
    git \
    curl \
    unzip \
    supervisor \
    certbot \
    python3-certbot-nginx

# Install Node.js 20.x
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Create application directory
APP_DIR="/var/www/ecab"
print_status "Creating application directory at $APP_DIR..."
mkdir -p $APP_DIR

# Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ecab_production;" 2>/dev/null || print_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER ecab_user WITH PASSWORD 'change_this_password';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecab_production TO ecab_user;"
sudo -u postgres psql -c "ALTER DATABASE ecab_production OWNER TO ecab_user;"

# Configure PHP-FPM
print_status "Configuring PHP-FPM..."
cat > /etc/php/8.2/fpm/pool.d/ecab.conf <<EOF
[ecab]
user = www-data
group = www-data
listen = /run/php/php8.2-fpm-ecab.sock
listen.owner = www-data
listen.group = www-data
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
EOF

# Configure Nginx
print_status "Configuring Nginx..."
cat > /etc/nginx/sites-available/ecab <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/ecab/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm-ecab.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Increase upload size
    client_max_body_size 20M;
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/ecab /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Configure Supervisor for Queue Workers
print_status "Configuring Supervisor for queue workers..."
cat > /etc/supervisor/conf.d/ecab-worker.conf <<EOF
[program:ecab-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ecab/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ecab/storage/logs/worker.log
stopwaitsecs=3600
EOF

# Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/ecab <<EOF
/var/www/ecab/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
EOF

# Create deployment info file
cat > $APP_DIR/DEPLOYMENT_INFO.txt <<EOF
ECAB Backend Deployment Information
====================================
Deployed on: $(date)
Server: AWS Lightsail
OS: Ubuntu 22.04 LTS
PHP Version: 8.2
Database: PostgreSQL
Web Server: Nginx
Process Manager: Supervisor

Important Paths:
- Application: /var/www/ecab
- Nginx Config: /etc/nginx/sites-available/ecab
- PHP-FPM Config: /etc/php/8.2/fpm/pool.d/ecab.conf
- Supervisor Config: /etc/supervisor/conf.d/ecab-worker.conf
- Logs: /var/www/ecab/storage/logs

Next Steps:
1. Copy your application files to /var/www/ecab
2. Update .env file with production settings
3. Run: composer install --optimize-autoloader --no-dev
4. Run: npm install && npm run build
5. Run: php artisan key:generate
6. Run: php artisan migrate --force
7. Run: php artisan storage:link
8. Run: php artisan config:cache
9. Run: php artisan route:cache
10. Run: php artisan view:cache
11. Set up SSL with: certbot --nginx -d your-domain.com
12. Restart services

Commands:
- Restart Nginx: systemctl restart nginx
- Restart PHP-FPM: systemctl restart php8.2-fpm
- Restart Supervisor: systemctl restart supervisor
- View logs: tail -f /var/www/ecab/storage/logs/laravel.log
EOF

print_status "Server setup completed!"
print_warning "Please review and update the following:"
echo "  1. Database password in PostgreSQL"
echo "  2. Domain name in Nginx configuration"
echo "  3. Environment variables in .env file"
echo ""
print_status "Deployment information saved to: $APP_DIR/DEPLOYMENT_INFO.txt"
