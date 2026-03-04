FROM nginx:alpine

# Install CA certificates for HTTPS proxying and remove default config
RUN apk add --no-cache ca-certificates && rm /etc/nginx/conf.d/default.conf

# Copy nginx config template
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template

# Copy static files
COPY public/ /usr/share/nginx/html/

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh

# Default Node-RED URL
ENV NODERED_URL=https://nodered.cbf.nz

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
