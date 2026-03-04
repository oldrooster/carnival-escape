#!/bin/sh
# Substitute environment variables into nginx config template
envsubst '${NODERED_URL}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

# Start nginx in foreground
exec nginx -g 'daemon off;'
