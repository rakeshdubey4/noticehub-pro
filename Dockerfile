# स्टेज 1: आधिकारिक Node इमेज से सिर्फ बाइनरी लेने के लिए
FROM node:20-slim AS node-env

# स्टेज 2: मुख्य PHP इमेज
FROM serversideup/php:8.4-fpm-nginx

# अस्थायी रूप से root यूजर पर स्विच करें
USER root

# इन-बिल्ट टूल का उपयोग करके PHP GD एक्सटेंशन इंस्टॉल करें
RUN install-php-extensions gd

# स्टेज 1 (Node इमेज) से Node और NPM को सीधे इस PHP इमेज में कॉपी करें
COPY --from=node-env /usr/local/bin/node /usr/local/bin/
COPY --from=node-env /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

# वर्किंग डायरेक्टरी सेट करें
WORKDIR /var/www/html

# पूरे प्रोजेक्ट की फाइलों को सही परमिशन के साथ कॉपी करें
COPY --chown=www-data:www-data . .

# सुरक्षित www-data यूजर पर वापस जाएं
USER www-data

# कंपोजर और फ्रंटेंड बिल्ड चलाएं
RUN composer install --no-dev --optimize-autoloader --no-interaction && \
    npm install && \
    npm run build && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# पोर्ट सेट करें
EXPOSE 8080
