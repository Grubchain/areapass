#!/usr/bin/env sh
set -e

# Substitute the PORT env var into nginx.conf.template
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx in the foreground
exec nginx -g 'daemon off;'
