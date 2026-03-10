#!/bin/bash

# ECAB Enhanced Deployment Script for AWS Lightsail with Reverb Support
# Version: 2.0
# Includes: Reverb WebSocket Supervisor Configuration

set -e

echo "🚀 Starting ECAB Enhanced Production Deployment..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check root
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run as root or with sudo"
    exit 1
fi

# Update system
print_status "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# Install base packages
print_status "Installing base packages..."
apt-get install -y -qq \
    software-properties-common \
    curl \
    wget \
    git \
    unzip \
    zip \
    htop \
    vim

# Add PHP repository
print_info "Adding PHP 8.2 repository..."
add-apt-repository ppa:ondrej/php -y
apt-get update -qq

# Install Nginx
print_status "Installing Nginx..."
apt-get install -y -qq nginx

# Install PostgreSQL
print_status "Installing PostgreSQL..."
apt-get install -y -qq postgresql postgresql-contrib

# Install PHP 8.2 and extensions
print_status "Installing PHP 8.2 with all required extensions..."
apt-get install -y -qq \
    php8.2 \
    php8.2-fpm \
    php8.2-cli \
    php8.2-common \
    php8.2-pgsql \
    php8.2-mbstring \
    php8.2-xml \
    php8.2-bcmath \
    php8.2-curl \
    php8.2-zip \
    php8.2-gd \
    php8.2-intl \
    php8.2-soap \
    php8.2-redis

# Install Composer
print_status "Installing Composer..."
EXPECTED_CHECKSUM="$(php -r 'copy("https://composer.github.io/installer.sig", "php://stdout");')"
php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
ACTUAL_CHECKSUM="$(php -r "echo hash_file('sha384', 'composer-setup.php');")"

if [ "$EXPECTED_CHECKSUM" != "$ACTUAL_CHECKSUM" ]; then
    print_error "Invalid Composer installer checksum"
    rm composer-setup.php
    exit 1
fi

php composer-setup.php --quiet --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php
print_status "Composer installed: $(composer --version)"

# Install Node.js 20.x
print_status "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs
print_status "Node.js installed: $(node --version)"
print_status "NPM installed: $(npm --version)"

# Install Supervisor
print_status "Installing Supervisor..."
apt-get install -y -qq supervisor
systemctl enable supervisor

# Install Certbot for SSL
print_status "Installing Certbot..."
apt-get install -y -qq certbot python3-certbot-nginx

# Create application directory
APP_DIR="/var/www/ecab"
print_status "Creating application directory: $APP_DIR"
mkdir -p $APP_DIR

# Setup PostgreSQL
print_status "Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE ecab_production;" 2>/dev/null || print_warning "Database already exists"
sudo -u postgres psql -c "CREATE USER ecab_user WITH PASSWORD 'CHANGE_THIS_PASSWORD_NOW';" 2>/dev/null || print_warning "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecab_production TO ecab_user;"
sudo -u postgres psql -c "ALTER DATABASE ecab_production OWNER TO ecab_user;"
sudo -u postgres psql -c "GRANT CREATE ON SCHEMA public TO ecab_user;" ecab_production

print_warning "⚠️  IMPORTANT: Change the database password!"
print_info "   Run: sudo -u postgres psql"
print_info "   Then: ALTER USER ecab_user WITH PASSWORD 'your_strong_password';"

# Configure PHP-FPM pool
print_status "Configuring PHP-FPM pool..."
cat > /etc/php/8.2/fpm/pool.d/ecab.conf <<EOF
[ecab]
user = www-data
group = www-data
listen = /run/php/php8.2-fpm-ecab.sock
listen.owner = www-data
listen.group = www-data
listen.mode = 0660
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
php_admin_value[error_log] = /var/log/php8.2-fpm-ecab.log
php_admin_flag[log_errors] = on
EOF

# Enable PHP OPcache for production
print_status "Configuring PHP OPcache..."
cat >> /etc/php/8.2/fpm/conf.d/99-opcache.ini <<EOF
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.fast_shutdown=1
opcache.enable_cli=0
EOF

# Configure Nginx with WebSocket support
print_status "Configuring Nginx with Reverb WebSocket support..."
cat > /etc/nginx/sites-available/ecab <<'NGINX_EOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/ecab/public;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server with WebSocket support
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    root /var/www/ecab/public;
    index index.php index.html;

    # SSL configuration (will be managed by Certbot)
    # ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # WebSocket proxy for Reverb
    location /app {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    # Broadcasting auth endpoint
    location /broadcasting/auth {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Laravel application
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # Static files
    location = /favicon.ico { 
        access_log off; 
        log_not_found off; 
    }
    
    location = /robots.txt { 
        access_log off; 
        log_not_found off; 
    }

    # PHP-FPM handling
    location ~ \.php$ {
        fastcgi_pass unix:/run/php/php8.2-fpm-ecab.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_read_timeout 300;
        fastcgi_buffers 16 16k;
        fastcgi_buffer_size 32k;
    }

    # Block access to hidden files
    location ~ /\.(?!well-known).* {
        deny all;
    }

    # File upload size limit
    client_max_body_size 20M;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 1000;
}
NGINX_EOF

# Enable site
ln -sf /etc/nginx/sites-available/ecab /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Configure Supervisor for Queue Workers
print_status "Configuring Supervisor for Laravel queue workers..."
cat > /etc/supervisor/conf.d/ecab-worker.conf <<EOF
[program:ecab-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ecab/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ecab/storage/logs/worker.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
stopwaitsecs=3600
EOF

# Configure Supervisor for Reverb WebSocket Server
print_status "Configuring Supervisor for Reverb WebSocket server..."
cat > /etc/supervisor/conf.d/ecab-reverb.conf <<EOF
[program:ecab-reverb]
process_name=%(program_name)s
command=php /var/www/ecab/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/ecab/storage/logs/reverb.log
stdout_logfile_maxbytes=10MB
stdout_logfile_backups=5
stopwaitsecs=3600
startsecs=5
EOF

# Set up log rotation
print_status "Configuring log rotation..."
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
    postrotate
        /usr/bin/supervisorctl restart ecab-worker:* > /dev/null
    endscript
}
EOF

# Enable PHP-FPM service
systemctl enable php8.2-fpm

# Create deployment info
cat > $APP_DIR/DEPLOYMENT_INFO.md <<EOF
# ECAB Deployment Information

**Deployed**: $(date)  
**Server**: AWS Lightsail  
**OS**: Ubuntu 22.04 LTS  
**PHP**: 8.2  
**Database**: PostgreSQL  
**Web Server**: Nginx  
**Process Manager**: Supervisor  

## Important Paths

- **Application**: /var/www/ecab
- **Nginx Config**: /etc/nginx/sites-available/ecab
- **PHP-FPM Pool**: /etc/php/8.2/fpm/pool.d/ecab.conf
- **Supervisor Configs**: /etc/supervisor/conf.d/ecab-*.conf
- **Application Logs**: /var/www/ecab/storage/logs/
- **Nginx Logs**: /var/log/nginx/

## Next Steps

1. Upload application code to /var/www/ecab
2. Upload firebase_credentials.json to /var/www/ecab/
3. Create .env file based on .env.production.example
4. Update domain in: /etc/nginx/sites-available/ecab
5. Update database password
6. Run: composer install --optimize-autoloader --no-dev
7. Run: npm ci --production && npm run build
8. Run: php artisan key:generate
9. Run: php artisan migrate --force
10. Run: php artisan storage:link
11. Run: php artisan config:cache && php artisan route:cache
12. Install SSL: certbot --nginx -d your-domain.com
13. Set permissions: chown -R www-data:www-data /var/www/ecab
14. Start services: supervisorctl reread && supervisorctl update && supervisorctl start all
15. Restart: systemctl restart nginx php8.2-fpm

## Service Management

\`\`\`bash
# Restart all services
systemctl restart nginx php8.2-fpm
supervisorctl restart all

# View logs
tail -f /var/www/ecab/storage/logs/laravel.log
tail -f /var/www/ecab/storage/logs/reverb.log
tail -f /var/www/ecab/storage/logs/worker.log

# Check status
supervisorctl status
systemctl status nginx
systemctl status php8.2-fpm
\`\`\`

## Security Reminders

- [ ] Change database password
- [ ] Update domain in Nginx config
- [ ] Set APP_DEBUG=false in .env
- [ ] Install SSL certificate
- [ ] Configure database backups
- [ ] Set strong admin password
EOF

# Summary
echo ""
print_status "===================================="
print_status "Server setup completed successfully!"
print_status "===================================="
echo ""
print_info "✅ Nginx installed and configured"
print_info "✅ PostgreSQL installed"
print_info "✅ PHP 8.2 with FPM configured"
print_info "✅ OPcache enabled"
print_info "✅ Node.js 20.x installed"
print_info "✅ Composer installed"
print_info "✅ Supervisor configured"
print_info "✅ Reverb WebSocket support configured"
print_info "✅ Queue workers configured"
print_info "✅ SSL/Certbot installed"
echo ""
print_warning "⚠️  IMPORTANT NEXT STEPS:"
echo "   1. Change PostgreSQL password"
echo "   2. Update domain in /etc/nginx/sites-available/ecab"
echo "   3. Upload application code"
echo "   4. Upload firebase_credentials.json"
echo "   5. Configure .env file"
echo "   6. Install dependencies and migrate database"
echo "   7. Install SSL certificate"
echo ""
print_info "📄 Detailed instructions saved to: $APP_DIR/DEPLOYMENT_INFO.md"
echo ""
