#!/bin/bash

# Clean the feed directory
echo "Cleaning feed directory..."
rm -rf /app/feed/*

# Start the application
echo "Starting application..."
uvicorn app:app --host 0.0.0.0 --port 5000