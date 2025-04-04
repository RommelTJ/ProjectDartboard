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

### Revised Approach: Manual Annotation with Cross-Platform Optimization

After initial attempts with estimated positions failed to produce reliable models, we've implemented a cross-platform optimization approach:

1. **Manual Annotation with Label Studio**
    - Set up Label Studio for annotation:
      ```bash
      docker pull heartexlabs/label-studio:latest
      docker run -it -p 8080:8080 -v $(pwd)/labelStudioData:/label-studio/data heartexlabs/label-studio:latest
      ```
    - Manually annotate 200 high-quality images with precise oriented bounding boxes
    - Export annotations in "YOLOv8 OBB" format

2. **Dataset Preparation Workflow**
    - After labeling with Label Studio, export annotations in "YOLOv8 OBB" format
    - Place label files in `training/phaseOneSmallDataset/labels/`
    - Use the updated dataset preparation script:
      ```bash
      # Create dataset with a specific name (e.g., dart_dataset_v1)
      cd training/phaseOneSmallDataset
      python prepare_dataset.py dart_dataset_v1
      ```

3. **Cross-Platform Training Pipeline**
    - **Training (Windows with RTX 3080)**
      ```bash
      # On Windows with RTX 3080
      yolo detect train model=yolo11n-obb.pt data=C:\path\to\dart_dataset_v1\data.yaml epochs=50 imgsz=2160 batch=8
      ```
    - **Export (macOS)**
      ```bash
      # On macOS
      yolo export model=/path/to/best.pt format=onnx
      ```
    - **Deployment (Ubuntu Mini PC)**
        - Deploy using ONNX Runtime on the Ubuntu mini PC
        - Package as Docker container for easy deployment

4. **Performance Metrics**
    - Current model (50 images): 89.5% mAP50, 69.3% mAP50-95
    - Training time: 29 minutes on RTX 3080 (vs 2.6 hours on MacBook Pro)
    - Inference speed: 17.6ms per image on CPU
    - Model size: 11.3MB (ONNX format)

5. **Advantages of YOLOv11n-OBB**
    - OBB capability for detecting darts at various angles
    - Lightweight (2.7M parameters)
    - Fast inference time on CPU deployment
    - Solid performance even with limited training data

## Application Development

### App Structure
The dockerized application is located in the `app/` directory and consists of:
- Frontend: React TypeScript with Vite
- Backend: FastAPI Python REST API
- Deployment: Docker containers with Nginx

### Running the Application
```bash
cd app
docker compose up --build
```

Access the application at:
- Frontend: http://localhost:9720
- API: http://localhost:9721
- API Documentation: http://localhost:9721/docs

## Development Roadmap

### Day 1: Frontend Capture & Single Dart Scoring ✓
- Set up the project foundation
- Created dockerized React/TypeScript frontend
- Implemented FastAPI backend

### Day 2: Model Integration & Single Dart Detection ✓
- Implemented manual image capture button on frontend
- Integrated object detection model into FastAPI
- Created endpoints to process images and detect darts
- Built Cricket scoring logic for a single dart
- Displayed detected dart positions and scores on frontend

### Day 3: Multi-Dart Game Experience ✓
- Added automatic detection for 3-dart throws
- Implemented game state management 
- Created automatic scoring system with adaptive capture timing
- Added round completion indicators and manual override

### Day 4: Hackathon Completed ✓
- Fixed bugs and improved user interface
- Added visual polish and UI improvements
- Completed documentation
- Successfully demonstrated working system

## Future Expansion (Post-Hackathon)
- Fix minor bugs in the automatic capture system 
- Complete annotation of 1000 images for improved model performance
- Add support for different game types (301, 501)
- Create proper game state management with player profiles
- Add manual scoring override for cases where detection fails
- Implement web socket-based real-time updates
- Integrate with LED lighting feedback system
- Consider commercial opportunities in dart communities

## Technical Implementation Notes
- The model performs detection with 99.1% mAP50 accuracy
- FastAPI handles both image processing and game state management
- Docker ensures consistent deployment environment on the mini PC
- Automatic scoring system adapts timing based on dart detection:
  - 30-second intervals when no darts are detected
  - 5-second intervals when some darts are detected
  - Round completion when 3 darts are detected
- Manual round completion available when automatic detection misses darts
- Visual countdown and status indicators show system state
