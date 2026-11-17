
# PHP 8.3 with Apache
FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    zip \
    pkg-config \
    libsqlite3-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libicu-dev \
    libonig-dev \
    && rm -rf /var/lib/apt/lists/*


# Configure GD
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg

# Install PHP extensions one by one
RUN docker-php-ext-install -j1 pdo_sqlite
RUN docker-php-ext-install -j1 sqlite3
RUN docker-php-ext-install -j1 pdo_mysql
RUN docker-php-ext-install -j1 mbstring
RUN docker-php-ext-install -j1 bcmath
RUN docker-php-ext-install -j1 exif
RUN docker-php-ext-install -j1 gd
RUN docker-php-ext-install -j1 zip
RUN docker-php-ext-install -j1 intl
RUN docker-php-ext-install -j1 opcache


# Enable Apache rewrite
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install Node.js 24 and npm
COPY --from=node:24-bookworm-slim /usr/local/ /usr/local/

# Set working directory
WORKDIR /var/www/html

# Copy project files
COPY . .

# Install Laravel dependencies
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader

# Install frontend dependencies
RUN npm ci

# Build React and Vite assets
RUN npm run build

# Configure Apache for Render port 10000
RUN sed -i 's/Listen 80/Listen 10000/' /etc/apache2/ports.conf \
    && sed -i 's/<VirtualHost \*:80>/<VirtualHost *:10000>/' \
    /etc/apache2/sites-available/000-default.conf \
    && sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/public|' \
    /etc/apache2/sites-available/000-default.conf

# Allow Laravel .htaccess routing
RUN printf '<Directory /var/www/html/public>\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n' >> /etc/apache2/apache2.conf

# Create Laravel storage directories
RUN mkdir -p \
    storage/app \
    storage/framework/cache \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Expose Render port
EXPOSE 10000

# Start Apache
CMD ["apache2-foreground"]
