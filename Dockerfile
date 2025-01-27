# Use the official PHP 8.2 image with Apache
FROM php:8.2-apache

# Install required packages and PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    && docker-php-ext-configure zip \
    && docker-php-ext-install pdo_pgsql pgsql zip \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Copy over custom Apache configuration
COPY config/apache.conf /etc/apache2/sites-available/000-default.conf

# Copy application source code into the container
COPY public/ /var/www/html/
COPY src/ /var/www/html/src/
COPY uploads/ /var/www/html/uploads/

# Adjust ownership and permissions if necessary
RUN chown -R www-data:www-data /var/www/html
RUN chmod -R 755 /var/www/html

# Expose port 80 (not strictly necessary in Dockerfile if using docker-compose)
EXPOSE 80

# The default command (from php:apache) will be "apache2-foreground"
