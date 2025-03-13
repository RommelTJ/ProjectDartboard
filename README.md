# DartVision: Automated Dart Scoring System

Pi Day 2025 Project

Version: 0.3.0 - 12 Mar 2025

## Project Overview

DartVision eliminates manual dart scoring by using a ceiling-mounted 4K camera to automatically detect dart positions
on a standard dartboard. The system captures images after throws, identifies darts on the board, calculates scores
based on game rules, and provides visual feedback through cabinet lighting.

## Hardware Components

- **Dartboard**: Standard dartboard
- **Dartboard Cabinet**: Standard dartboard cabinet with LED lighting integration
- **Mini PC**: Asus Mini PC running Ubuntu and Python for image processing
- **Camera**: Reolink RLC-820A 4K PoE Dome Camera
- **Lighting**: LED light strips (63 LED beads which emit 180 lumens) with frosted diffusers
- **Networking**: PoE injector to power camera
- **Cabling**: Cat6 Ethernet cable, cable raceways

## Software Stack

### Model & Computer Vision
- **Python 3.12**: Core programming language
- **OpenCV**: Computer vision library for dart detection
- **ONNX Runtime**: High-performance inference engine for optimized models
- **YOLOv11**: Vision detection model for object detection

### Application Stack
- **FastAPI**: High-performance Python web framework
- **React**: Frontend UI library with TypeScript
- **Vite**: Modern frontend build tool
- **Docker**: Containerization for easy deployment
- **Nginx**: Web server and reverse proxy

## Methodology

1. **Setup & Calibration**
    - Mount camera on ceiling 1-2 feet in front of dartboard
    - Position LED strips at top of cabinet for even illumination
    - Calibrate camera view to dartboard coordinates

2. **Training Methodology**

   ### Object Detection with YOLO
    - **What is YOLO?**: "You Only Look Once" is a state-of-the-art, real-time object detection algorithm
    - **How it works**: YOLO processes the entire image in a single pass through a neural network, making it extremely fast
    - **YOLOv11**: We're using the latest version which offers improved accuracy and performance over previous iterations

   ### Data Collection & Preparation
    - Collected over 1,000 images of dart throws using our ceiling-mounted camera
    - Created a comprehensive CSV dataset with:
        - Timestamp information
        - Dart count (0-3 darts)
        - Board state (empty, partial, full)
        - Dart positions (segment and ring for each dart)

   ### YOLO Annotation Format
    - YOLO requires specific formatting for training:
        - One text file per image with the same name
        - Each line represents one object: `class x_center y_center width height angle`
        - Class: A number representing the type of object (0 = dart)
        - Coordinates: Normalized between 0-1 relative to image dimensions
        - Example for OBB: `0 0.5 0.6 0.05 0.1 45` (dart centered at 50% width, 60% height, with 5% width, 10% height, and 45° angle)

   ### Our Learning Journey: Trial and Error

   #### First Attempt: Estimated Positions (Failed)
    - **Challenge**: Our dataset lacked explicit bounding box information for darts
    - **Approach**: Created estimated positions based on dart segment/ring data
    - **Implementation**:
        - Wrote a script to convert segment/ring info to approximate x,y coordinates
        - Created YOLO dataset with 80/20 train/validation split
        - Converted 1,000+ images to JPEG format for training
    - **Results**: After multiple training attempts, the model failed to detect darts reliably
    - **Lesson Learned**: Accurate bounding box annotations are essential - there's no shortcut!

   #### Revised Approach: Manual Annotation with Cross-Platform Optimization
    - **Dataset Strategy**:
        - Manually annotate 200 high-quality images using Label Studio
        - Draw precise oriented bounding boxes around each dart
        - Export as "YOLOv8 OBB" format in Label Studio
        - Split into training/validation sets (80/20 split)
          ```bash
          # Label Studio setup command
          docker pull heartexlabs/label-studio:latest
          docker run -it -p 8080:8080 -v $(pwd)/labelStudioData:/label-studio/data heartexlabs/label-studio:latest
          ```

    - **The Journey from 50 to 200 Images: A Story of Determination**:
        - **The Initial Model**: We started with just 50 manually labeled images, spending hours carefully drawing boxes around each dart
        - **Promising but Limited Results**: Our first model showed potential (89.5% mAP50, 69.3% mAP50-95) but missed darts in certain positions and lighting conditions
        - **The Decision Point**: We faced a choice - try to use AI vision assistants to generate labels automatically or invest more time in manual labeling
          - Having access to an NVIDIA RTX 3080 GPU was a game-changer - training that would take hours on a CPU took minutes
          - This faster iteration cycle made manual labeling much more practical and worth the investment
        - **The One-Day Labeling Push**: We committed to manual labeling, spending one intensive day meticulously annotating 150 additional images
        - **The Payoff**: This investment yielded dramatic improvements:
          - Detection accuracy (mAP50) jumped from 89.5% to 99.1%
          - Position accuracy (mAP50-95) improved from 69.3% to 85.2%
          - Precision increased to 98.7% with 97.6% recall
        - **Real-World Impact**: Our system now reliably detects darts, though precise localization for cricket scoring will need further refinement
        - **Future Potential**: With our full dataset of 1000+ images still available, we expect precision to increase even further as we continue expanding our training data

    - **Cross-Platform Training Pipeline**:
        - Train on Windows with RTX 3080 GPU (5.4x faster than MacBook Pro)
          ```bash
          # Windows command
          yolo detect train model=yolo11n-obb.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\dart_dataset_v1\data.yaml epochs=50 imgsz=2160 batch=8 val=False
          ```
        - Export to ONNX format on macOS (better compatibility)
          ```bash
          # macOS command
          yolo export model=/Users/rommel/code/work/chatmeter/ProjectDartboard/runs/obb/train12/weights/best.pt format=onnx
          ```
        - Deploy on Ubuntu mini PC using ONNX Runtime

    - **YOLOv11n-OBB Model Selection**:
        - OBB (Oriented Bounding Box) capability for detecting darts at various angles
        - Lightweight (2.7M parameters) for efficient inference on mini PC
        - Fast inference time (17.7ms inference, 51.6ms total processing)
        - Outstanding performance metrics:
          - mAP50: 99.1% (this means our system correctly identifies 99 out of 100 darts)
          - mAP50-95: 85.2% (while good for detection, this suggests we may still have some localization challenges for precise scoring)
          - Precision: 98.7% (when our system says "that's a dart," it's right 99% of the time)
          - Recall: 97.6% (our system finds 98 out of 100 darts present on the board)
          ```bash
          # Validation command showing performance metrics
          yolo val model=C:\Users\me\Documents\GitHub\ProjectDartboard\runs\obb\train12\weights\best.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\dart_dataset_v1\data.yaml imgsz=2160
          ```
    
    - **Why Manual Labeling Was Worth Every Minute**:
        - **The "AI Shortcut" Temptation**: We considered using AI vision tools like Gemini or Meta's Segment Anything to automate labeling
        - **The Reality Check**: Testing revealed these tools couldn't consistently identify darts from our camera angle with the precision we needed
        - **Quality Over Quantity**: 200 expertly labeled images proved far more valuable than thousands of auto-labeled ones
        - **The Human Advantage**: Our manual labels captured subtle details like dart angles and partial occlusions that AI tools missed
        - **A Lesson in Machine Learning**: This reinforced a fundamental ML principle - the quality of your training data ultimately determines the quality of your results
        - **The Bottom Line**: That day of meticulous labeling was the best time investment we made in the entire project

3. **Game Workflow**
    - Activate scoring mode via software interface
    - System captures images at regular intervals (every few seconds)
    - Images processed to detect dart positions
    - Scoring algorithms applied based on game type (e.g., Cricket)
    - Results displayed in real-time on connected display

4. **Dart Detection Process**
    - Capture high-resolution image of dartboard
    - Apply ONNX-optimized model to detect dart positions
    - Map physical positions to dartboard segments and scores
    - Distinguish between previously counted darts and new throws

5. **Features**
    - Automatic scoring for Cricket and other game modes
    - Statistic tracking across games
    - Low latency detection and scoring
    - LED feedback for successful detection

## Current Development Status

### Model Training ✅
- Completed manual annotation of 200 images
- Trained YOLOv11n-OBB model with 99.1% mAP50 accuracy
- Exported to ONNX format for deployment

### Application Foundation ✅
- Created dockerized React TypeScript frontend with Vite
- Implemented FastAPI backend with API documentation
- Set up Docker Compose for easy deployment

### Running the Application
```bash
cd app
docker compose up --build
```

Access points:
- Frontend: http://localhost:9720
- API: http://localhost:9721
- API Documentation: http://localhost:9721/docs

## Next Steps

### Immediate Tasks
- Integrate the ONNX model into the FastAPI backend
- Implement camera capture endpoints
- Create dart detection and scoring logic
- Develop the game tracking UI

### Future Enhancements
- Expand training dataset to improve accuracy
- Add support for additional game modes
- Implement player recognition
- Develop mobile app companion

## License

MIT License
