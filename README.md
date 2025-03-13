# DartVision: Automated Dart Scoring System

Pi Day 2025 Project

Version: 0.2.0 - 12 Mar 2025

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

- **Python 3**: Core programming language
- **OpenCV**: Computer vision library for dart detection
- **ONNX Runtime**: High-performance inference engine for optimized models
- **YOLOv11**: Vision detection model for object detection

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

    - **Cross-Platform Training Pipeline**:
        - Train on Windows with RTX 3080 GPU (5.4x faster than MacBook Pro)
          ```bash
          # Windows command
          yolo detect train model=yolo11n-obb.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\dart_dataset_v1\data.yaml epochs=50 imgsz=2160 batch=8 val=False
          ```
        - Export to ONNX format on macOS (better compatibility)
          ```bash
          # macOS command
          yolo export model=/Users/rommel/code/work/chatmeter/ProjectDartboard/runs/obb/train9/weights/best.pt format=onnx
          ```
        - Deploy on Ubuntu mini PC using ONNX Runtime

    - **YOLOv11n-OBB Model Selection**:
        - OBB (Oriented Bounding Box) capability for detecting darts at various angles
        - Lightweight (2.7M parameters) for efficient inference on mini PC
        - Fast inference time (17.6ms on CPU)
        - Excellent performance (89.5% mAP50, 69.3% mAP50-95)
          ```bash
          # Validation command showing performance metrics
          yolo val model=C:\Users\me\Documents\GitHub\ProjectDartboard\runs\obb\train12\weights\best.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\dart_dataset_v1\data.yaml imgsz=2160
          ```

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

## Future Enhancements

- Expand training dataset to improve accuracy
- Add support for additional game modes
- Implement player recognition
- Develop mobile app companion

## License

MIT License
