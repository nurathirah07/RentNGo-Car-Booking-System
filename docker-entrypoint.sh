
#!/bin/sh
set -e

cd /var/www/html

mkdir -p storage/app storage/framework/cache \
    storage/framework/sessions storage/framework/views \
    storage/logs bootstrap/cache

chown -R www-data:www-data storage bootstrap/cache

DB_FILE="/var/www/html/storage/app/database.sqlite"

if [ ! -f "$DB_FILE" ]; then
    touch "$DB_FILE"
fi

chown www-data:www-data "$DB_FILE"
chmod 664 "$DB_FILE"

php artisan migrate --force

exec "$@"
