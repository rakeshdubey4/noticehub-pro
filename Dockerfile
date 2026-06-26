FROM serversideup/php:8.4-fpm-nginx

# अस्थायी रूप से root यूजर पर स्विच करें
USER root

# 1. इन-बिल्ट टूल का उपयोग करके PHP GD एक्सटेंशन इंस्टॉल करें
RUN install-php-extensions gd

# 2. आधिकारिक NodeSource रिपॉजिटरी से Node.js (v20) इंस्टॉल करें
RUN apt-get update && apt-get install -y ca-certificates curl gnupg && \
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://nodesource.com | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://nodesource.com nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# वापस डिफ़ॉल्ट working directory पर आएं
WORKDIR /var/www/html

# पूरे प्रोजेक्ट की फाइलों को सही परमिशन के साथ कॉपी करें
COPY --chown=www-data:www-data . .

# वापस सुरक्षित www-data यूजर पर स्विच करें
USER www-data

# Composer dependencies इंस्टॉल करें, NPM पैकेज डालें और फ्रंटेंड बिल्ड करें
RUN composer install --no-dev --optimize-autoloader --no-interaction && \
    npm install && \
    npm run build && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache

# पोर्ट सेट करें
EXPOSE 8080
