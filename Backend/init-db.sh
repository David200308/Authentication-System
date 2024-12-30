#!/bin/bash
until mysqladmin ping -h"localhost" --silent; do
    echo "Waiting for MySQL to be available..."
    sleep 2
done

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF
