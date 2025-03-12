# DartVision Project Notes

## Project Structure
- `app/` - Final application for dockerization and deployment
- `training/` - Training data, models, and object detection
  - `phaseOneSmallDataset/` - Small dataset for initial manual annotation
  - `phaseTwoFullDataset/` - Full dataset for comprehensive training
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
- Image files stored in `training/phaseOneSmallDataset/images/` and `training/phaseTwoFullDataset/images/`
- Metadata in `training/phaseOneSmallDataset/dart_dataset.csv` and `training/phaseTwoFullDataset/dart_dataset.csv`
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

# Install dependencies for training scripts
pip install -r training/requirements.txt
```

## Object Detection Training

### Revised Approach: Manual Annotation

After initial attempts with estimated positions failed to produce reliable models, we're implementing a manual annotation approach:

1. **Manual Annotation with Label Studio**
   - Set up Label Studio for annotation:
     ```bash
     docker pull heartexlabs/label-studio:latest
     docker run -it -p 8080:8080 -v $(pwd)/labelStudioData:/label-studio/data heartexlabs/label-studio:latest
     ```
   - Manually annotate 50 high-quality images with precise bounding boxes
   - Export annotations in "YOLOv8 OBB" format

2. **Training with YOLOv11**
   - Using YOLOv11n-OBB model for oriented bounding box detection
   - Split dataset: 80/20 (40 training, 10 validation images)
   - Train command:
     ```bash
     yolo detect train model=yolov11n-obb.pt data=/path/to/dataset.yaml epochs=50 imgsz=2160
     ```
   - Export to ONNX format:
     ```bash
     yolo export model=runs/detect/train/weights/best.pt format=onnx
     ```

3. **Advantages of YOLOv11n-OBB**
   - OBB capability for detecting darts at various angles
   - Lightweight (2.7M parameters)
   - Fast inference time (4.4ms on GPU)
   - Solid performance (78.4 mAP@50)

## Future Tasks
- Train initial model on small manually annotated dataset
- Test detection performance and adjust as needed
- If time permits, expand to full dataset annotation
- Implement scoring logic for Cricket game
- Integrate with LED lighting feedback system