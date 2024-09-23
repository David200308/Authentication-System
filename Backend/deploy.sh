#!/bin/bash

# Check if docker-compose is running
sudo docker-compose ps > /dev/null 2>&1

if [ $? -eq 0 ]; then
    # Stop and remove the Docker container
    sudo docker-compose down

    # Check for errors
    if [ $? -ne 0 ]; then
        echo "Error: Failed to stop and remove the Docker container."
        exit 1
    fi
else
    echo "docker-compose is not running, skipping 'docker-compose down'."
fi

# Check if the Docker image exists
sudo docker image inspect api_backend > /dev/null 2>&1

if [ $? -eq 0 ]; then
    # Remove the Docker image if it exists
    sudo docker image rm api_backend

    # Check for errors
    if [ $? -ne 0 ]; then
        echo "Error: Failed to remove the Docker image."
        exit 1
    fi
else
    echo "Docker image 'api_backend' does not exist, skipping removal."
fi

# Start the Docker container in detached mode
sudo docker-compose up -d

# Check for errors
if [ $? -ne 0 ]; then
    echo "Error: Failed to start the Docker container."
    exit 1
fi

# Restart the Apache2 service
sudo systemctl restart apache2.service

# Check for errors
if [ $? -ne 0 ]; then
    echo "Error: Failed to restart the Apache2 service."
    exit 1
fi

echo "---------Backend API deployment completed----------"
