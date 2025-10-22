#!/usr/bin/env sh

set -eu

echo "[entrypoint] PORT=$PORT"

export SERVER_PORT="${PORT}"

echo "[entrypoint] SERVER_PORT=$SERVER_PORT"

envsubst '$SERVER_PORT' < "/etc/nginx/templates/port.conf.template" > "/etc/nginx/port.conf"

cp /etc/nginx/templates/nginx.conf.template /etc/nginx/nginx.conf

if ! php artisan migrate --force; then
    echo "============================================"
    echo "ERROR: Migrations could not complete. Check the error above."
    echo "Ensure DATABASE_URL is set."
    echo "============================================"
fi

php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan storage:link

php-fpm -D

exec nginx -g 'daemon off;'
