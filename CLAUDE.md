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

## Dependencies
```bash
# Install dependencies for playground scripts
pip install -r playground/requirements.txt
```

## Future Tasks
- Setup image preprocessing for dart detection
- Train TensorFlow model for dart detection
- Implement scoring logic
- Integrate with LED lighting feedback system