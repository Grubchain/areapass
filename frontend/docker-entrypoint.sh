#!/usr/bin/env sh
set -e

export NODE_PORT=$PORT

# Substitute the PORT env var into nginx.conf.template
#envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start Nginx in the foreground
#exec nginx -g 'daemon off;'

yarn start
