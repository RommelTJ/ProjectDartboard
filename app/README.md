# DartVision App

DartVision is an automated dart scoring system that uses computer vision to detect darts on a dartboard.

## Project Structure

- `api/`: Flask backend API
- `frontend/`: React TypeScript frontend

## Prerequisites

- Docker

## Building and Running the App

1. Clone the repository:
```bash
git clone <repository-url>
cd ProjectDartboard/app
```

2. Set up environment variables:
```bash
# Create a .env file from the template
cp .env.example .env

# Edit the .env file with your camera credentials
# Replace the placeholder values with your actual camera IP and password
vi .env
```

3. Build and start the containers:
```bash
docker compose up --build
```

4. Access the application:
   - Frontend: http://localhost:9720
   - API: http://localhost:9721

## Development

### Frontend

The frontend is a React TypeScript application built with Vite.

To run the frontend in development mode:

```bash
cd frontend
npm install
npm run dev
```

### Backend

The backend is a FastAPI application.

To run the backend in development mode:

```bash
cd api
pip install -r requirements.txt
python app.py
```

FastAPI also provides automatic API documentation at:
- Swagger UI: http://localhost:9721/docs
- ReDoc: http://localhost:9721/redoc

## Stopping the App

To stop the application:

```bash
docker compose down
```

## License

MIT