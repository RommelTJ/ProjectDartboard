# DartVision Project Notes

## Project Structure
- `app/` - Final application for dockerization and deployment
- `training/` - TensorFlow training data and models
- `playground/` - Testing scripts for camera interaction and development

## Camera API Usage

### Reolink Camera Snapshot API
Successfully captured images using direct API calls:

```bash
# Capture snapshot from Reolink camera with HTTPS (port 443)
./playground/simple_capture.py CAMERA_IP admin 'CAMERA_PASSWORD'

# If HTTPS doesn't work, try HTTP (port 80)
./playground/simple_capture.py CAMERA_IP admin 'CAMERA_PASSWORD' --port 80 --http
```

The working endpoint is:
```
/cgi-bin/api.cgi?cmd=Snap&channel=0&user=USERNAME&password=PASSWORD
```

### Important Camera Notes
- The Reolink RLC-820A 4K PoE Dome Camera can be accessed programmatically
- Direct API calls work better than the reolinkapi library
- When using passwords with special characters, wrap in single quotes

## Data Collection

### Dataset Structure
The training dataset has the following structure:
- Image files stored in `training/images/`
- Metadata in `training/dart_dataset.csv`
- CSV columns include:
  - image_id - Unique identifier
  - filename - Path to image file
  - timestamp - When image was captured
  - dart_count - Number of darts on board (0-3)
  - board_state - 'empty', 'partial', 'full'
  - dart1_segment, dart1_ring - Position data for first dart
  - dart2_segment, dart2_ring - Position data for second dart 
  - dart3_segment, dart3_ring - Position data for third dart
  - notes - Additional information

### Running Data Collection

```bash
# Start interactive data collection session
./training/data_collector.py CAMERA_IP admin 'CAMERA_PASSWORD'
```

This will:
1. Take images when you press ENTER
2. Prompt for number of darts and their positions
3. Save images and metadata to CSV
4. Store in training/images with unique filenames

## Dependencies
```bash
# Install dependencies for playground scripts
pip install -r playground/requirements.txt
```

## Future Tasks
- Process collected dataset for TensorFlow training
- Train object detection model to identify darts and positions
- Implement scoring logic for Cricket game
- Integrate with LED lighting feedback system