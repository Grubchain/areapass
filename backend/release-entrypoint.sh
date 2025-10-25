#!/usr/bin/env sh

set -eu

/usr/bin/autossh -M 0 -N -L 15432:$SSH_REMOTE_HOST:5432 $SSH_TUNNEL_USER@$SSH_TUNNEL_HOST -i $SSH_TUNNEL_PEM

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
