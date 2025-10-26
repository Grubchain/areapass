#!/usr/bin/env sh

set -eu

exec /usr/bin/supervisord -c /etc/release-supervisord.conf
