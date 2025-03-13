FROM python:3.12-slim

WORKDIR /app

# Environment variables for camera configuration
# These will be set at runtime using docker-compose or docker run command
ENV CAMERA_IP="placeholder_ip"
ENV CAMERA_PASSWORD="placeholder_password"

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]