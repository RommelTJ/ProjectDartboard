FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Environment variables for camera configuration
# These will be set at runtime using docker-compose or docker run command
ENV CAMERA_IP="placeholder_ip"
ENV CAMERA_PASSWORD="placeholder_password"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Create feed directory for storing camera images
RUN mkdir -p /app/feed

EXPOSE 5000

# Use our start script that cleans the feed directory before starting the app
CMD ["/app/build/start.sh"]