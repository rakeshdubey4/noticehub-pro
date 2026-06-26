FROM serversideup/php:8.2-fpm-nginx

# अस्थायी रूप से root यूजर पर स्विच करें ताकि Node.js इंस्टॉल किया जा सके
USER root

# Node.js (v20) और NPM इंस्टॉल करें
RUN apt-get update && \
    apt-get install -y curl && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

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
