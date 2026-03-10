# ECAB Production Deployment Guide: AWS Lightsail + Supabase

This guide provides a professional, sustainable, and secure procedure for hosting your ECAB backend. It assumes you are utilizing **Supabase** for your Database and Storage, which is the most future-proof approach for your application.

---

## 🏗 Infrastructure Overview
- **Hosting**: AWS Lightsail (Ubuntu 22.04)
- **Database**: Supabase PostgreSQL (Managed)
- **File Storage**: Supabase Storage (S3 Compatible)
- **Real-time**: Laravel Reverb (WebSockets proxied through Nginx)
- **Frontend**: React/Inertia (Compiled production assets)

---

## 🛠 Step 1: Provision the Server

1.  **Launch Instance**: Select Ubuntu 22.04 LTS on AWS Lightsail. A 2GB RAM instance is recommended for smooth operation of Reverb and Vite builds.
2.  **Upload Deployment Script**: Transfer `lightsail-supabase-deploy.sh` to your server.
3.  **Run the script**:
    ```bash
    chmod +x lightsail-supabase-deploy.sh
    sudo ./lightsail-supabase-deploy.sh
    ```
    *This script installs Nginx, PHP 8.2, Node.js, Supervisor, and configures the firewall.*

### 🌐 1.1 DNS Configuration (Bluehost)
Before your server can be reached, you must point your domain to your Lightsail Static IP.

1.  **Get your Lightsail IP**: In your Lightsail dashboard, look for your **Public/Static IP**.
2.  **Login to Bluehost**: Go to your Bluehost Control Panel.
3.  **Navigate to DNS**: 
    - Click **Domains** on the left sidebar.
    - Click **Manage** next to your domain.
    - Select the **DNS** tab.
4.  **Edit A Records**:
    - Under the **A (Host)** section:
        - Host `@` (representing your main domain) → Point to your **Lightsail IP**.
        - Host `www` → Point to your **Lightsail IP**.
5.  **Wait for Propagation**: It can take anywhere from a few minutes to 24 hours for the name to start pointing to your new server.

---

## 📂 Step 2: Deploy the Codebase

1.  **Clone Repository**:
    ```bash
    cd /var/www
    sudo git clone <your-repo-url> ecab
    sudo chown -R www-data:www-data /var/www/ecab
    ```
2.  **Environment Setup**:
    Create `/var/www/ecab/.env` and copy your local settings. Ensure these key values are set for production:
    ```env
    APP_ENV=production
    APP_DEBUG=false
    APP_URL=https://your-ecab-domain.com

    DB_CONNECTION=pgsql
    DB_HOST=your-supabase-bb-host
    DB_PORT=6543
    DB_DATABASE=postgres
    DB_USERNAME=postgres.xxxx
    DB_PASSWORD=your-secure-password

    FILESYSTEM_DISK=supabase
    # Supabase credentials as verified in verify_connections.php

    # Reverb Production (Crucial for Mobile/Web Sockets)
    REVERB_HOST="0.0.0.0"
    REVERB_PORT=8080
    VITE_REVERB_HOST="${APP_URL#https://}"
    VITE_REVERB_PORT=443
    VITE_REVERB_SCHEME="https"
    ```
3.  **Install Dependencies**:
    ```bash
    cd /var/www/ecab
    sudo -u www-data composer install --optimize-autoloader --no-dev
    sudo -u www-data npm install
    sudo -u www-data npm run build
    ```

---

## 🔒 Step 3: Security & SSL

1.  **SSL Certificate**:
    ```bash
    sudo certbot --nginx -d your-ecab-domain.com -d www.your-ecab-domain.com
    ```
2.  **Supabase Allowlist**:
    Go to your Supabase Dashboard → Settings → Database → Network Restrictions. Add your Lightsail Static IP to the allowlist to ensure the connection is secure.

---

## ⚡ Step 4: Background Processes (Supervisor)

The deployment script already prepared the configurations. Ensure they are running:
```bash
sudo supervisorctl reload
sudo supervisorctl status
```
*Processes `ecab-worker` (Queues) and `ecab-reverb` (WebSockets) should be 'RUNNING'.*

---

## 📈 Future Sustainability & Best Practices

1.  **CI/CD Pipeline**: 
    Set up a GitHub Action to automatically run `git pull`, `composer install`, and `npm run build` on every push to the `main` branch. This eliminates manual errors.
2.  **Automated Backups**: 
    Supabase handles DB backups automatically, but ensure you have the **PITR (Point-in-Time Recovery)** enabled for production.
3.  **Health Monitoring**:
    Use a service like **UptimeRobot** to monitor your `APP_URL`.
4.  **Logging**:
    Check logs regularly to catch silent errors:
    - Laravel: `/var/www/ecab/storage/logs/laravel.log`
    - Reverb: `/var/www/ecab/storage/logs/reverb.log`
    - Nginx: `/var/log/nginx/error.log`

---

## ✅ Final Pre-Flight Check
Run this on the server after deployment:
```bash
php artisan about
php artisan migrate --status
```

*Your Supabase Storage integration is already production-ready as it uses path-style endpoints and S3-compatible drivers, ensuring wide compatibility.*
