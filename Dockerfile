# Use the official PHP 8.2 image with Apache
FROM php:8.2-apache

# Install required packages and PHP extensions
RUN apt-get update && apt-get install -y \
    libpq-dev \
    && docker-php-ext-install pdo_pgsql pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

# Copy over custom Apache configuration
# (This assumes you have a config/apache.conf file in your project)
COPY config/apache.conf /etc/apache2/sites-available/000-default.conf

# Copy application source code into the container
# If you'd prefer to use volumes for the source code, you can skip this step
# COPY src/ /var/www/html/
COPY public/ /var/www/html/
COPY src/ /var/www/html/src/

# Adjust ownership and permissions if necessary
RUN chown -R www-data:www-data /var/www/html

# Expose port 80 (not strictly necessary in Dockerfile if using docker-compose)
EXPOSE 80

# The default command (from php:apache) will be "apache2-foreground"

