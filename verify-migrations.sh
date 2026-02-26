#!/bin/bash

# Migration Cleanup and Verification Script
# This script checks and prepares migrations for production deployment

set -e

echo "🔍 Checking Migration Files..."

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if we're in the server directory
if [ ! -f "artisan" ]; then
    print_error "This script must be run from the Laravel server directory"
    exit 1
fi

# Count migration files
MIGRATION_COUNT=$(find database/migrations -name "*.php" | wc -l)
print_status "Found $MIGRATION_COUNT migration files"

# Check for duplicate migrations
echo ""
echo "Checking for duplicate migrations..."
DUPLICATES=$(find database/migrations -name "*.php" -exec basename {} \; | cut -d'_' -f4- | sort | uniq -d)
if [ -z "$DUPLICATES" ]; then
    print_status "No duplicate migrations found"
else
    print_warning "Duplicate migrations detected:"
    echo "$DUPLICATES"
fi

# Check migration status
echo ""
echo "Checking migration status..."
php artisan migrate:status

# Verify migration files syntax
echo ""
echo "Verifying migration file syntax..."
ERROR_COUNT=0
for file in database/migrations/*.php; do
    if ! php -l "$file" > /dev/null 2>&1; then
        print_error "Syntax error in: $file"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

if [ $ERROR_COUNT -eq 0 ]; then
    print_status "All migration files have valid syntax"
else
    print_error "Found $ERROR_COUNT migration files with syntax errors"
    exit 1
fi

# Create migration backup
echo ""
echo "Creating migration backup..."
BACKUP_DIR="database/migrations_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r database/migrations/* "$BACKUP_DIR/"
print_status "Backup created at: $BACKUP_DIR"

# Generate migration documentation
echo ""
echo "Generating migration documentation..."
cat > database/MIGRATIONS_DOCUMENTATION.md <<EOF
# Database Migrations Documentation

Generated on: $(date)

## Migration Summary

Total Migrations: $MIGRATION_COUNT

## Migration List

EOF

# List all migrations with descriptions
for file in database/migrations/*.php; do
    FILENAME=$(basename "$file")
    CLASSNAME=$(grep "class " "$file" | head -1 | awk '{print $2}')
    echo "### $FILENAME" >> database/MIGRATIONS_DOCUMENTATION.md
    echo "- **Class**: $CLASSNAME" >> database/MIGRATIONS_DOCUMENTATION.md
    echo "- **File**: $file" >> database/MIGRATIONS_DOCUMENTATION.md
    echo "" >> database/MIGRATIONS_DOCUMENTATION.md
done

cat >> database/MIGRATIONS_DOCUMENTATION.md <<EOF

## Migration Order

Migrations are executed in chronological order based on their timestamp prefix.

## Production Deployment

When deploying to production:

1. Backup the production database
2. Run: \`php artisan migrate:status\` to check current state
3. Run: \`php artisan migrate --force\` to apply new migrations
4. Verify: \`php artisan migrate:status\` to confirm all migrations ran

## Rollback Strategy

If a migration fails in production:

\`\`\`bash
# Rollback last batch
php artisan migrate:rollback --step=1

# Rollback specific migration
php artisan migrate:rollback --path=/database/migrations/YYYY_MM_DD_XXXXXX_migration_name.php
\`\`\`

## Fresh Installation

For a fresh database setup:

\`\`\`bash
# Drop all tables and re-run migrations
php artisan migrate:fresh

# With seeders
php artisan migrate:fresh --seed
\`\`\`

## Important Notes

- Never modify migrations that have been run in production
- Always create new migrations for schema changes
- Test migrations on a staging environment before production
- Keep migration files in version control
- Document any manual database changes

EOF

print_status "Migration documentation created at: database/MIGRATIONS_DOCUMENTATION.md"

# Summary
echo ""
echo "========================================="
echo "Migration Verification Summary"
echo "========================================="
echo "Total Migrations: $MIGRATION_COUNT"
echo "Syntax Errors: $ERROR_COUNT"
echo "Backup Location: $BACKUP_DIR"
echo "Documentation: database/MIGRATIONS_DOCUMENTATION.md"
echo "========================================="
echo ""

if [ $ERROR_COUNT -eq 0 ]; then
    print_status "All migrations are clean and ready for deployment!"
else
    print_error "Please fix syntax errors before deployment"
    exit 1
fi
