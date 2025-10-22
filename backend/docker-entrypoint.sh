#!/usr/bin/env sh

set -eu

echo "[entrypoint] PORT=$PORT"

export SERVER_PORT="${PORT}"

echo "[entrypoint] SERVER_PORT=$SERVER_PORT"

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

envsubst '$SERVER_PORT' < "/etc/nginx/templates/port.conf.template" > "/etc/nginx/port.conf"

cp /etc/nginx/templates/nginx.conf.template /etc/nginx/nginx.conf

# Start php-fpm in foreground (better logs), backgrounded so nginx can start
php-fpm -D

# Keep dyno alive with nginx in foreground
exec nginx -g 'daemon off;'
