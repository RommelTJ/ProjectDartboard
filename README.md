# DartVision: Automated Dart Scoring System

Pi Day 2025 Project

Version: 0.1.0 - 09 Mar 2025

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
- **TensorFlow Lite**: Lightweight version of TensorFlow designed for reduced resource usage
- **YOLOv11**: Vision detection model

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
      - Each line represents one object: `class x_center y_center width height`
      - Class: A number representing the type of object (0 = dart)
      - Coordinates: Normalized between 0-1 relative to image dimensions
      - Example: `0 0.5 0.6 0.05 0.1` (dart centered at 50% width, 60% height, with 5% width and 10% height)
    
    ### Two-Phase Training Approach
    
    #### Phase 1: Initial Model (Current)
    - **Challenge**: Our dataset lacks explicit bounding box information for darts
    - **Approach**: Use approximate positions based on our dart position data
    - **Limitations**: Model will likely struggle with precise dart localization
    - **Purpose**: Establish training pipeline, learn model development process, and evaluate baseline performance
    - **Implementation**: 
      - Created YOLO dataset with 80/20 train/validation split
      - Converted 1,000+ images to JPEG format for compatibility
      - Training with Docker container using YOLOv8 nano model:
        ```bash
        docker run --rm -v "$(pwd):/workspace" ultralytics/ultralytics:latest \
          yolo detect train \
          data=/workspace/yolo_dataset/dataset.yaml \
          model=yolov8n.pt \
          epochs=20 \
          imgsz=2160 \
          batch=4 
        ```
      - Running on CPU with full 4K resolution (3840 × 2160) for maximum detail
    
    #### Phase 2: Refined Model (Future Work)
    - **Improvement**: Manually annotate a subset of images with precise bounding boxes
    - **Tools**: Use annotation software like LabelImg or CVAT
    - **Expected Outcome**: Significantly improved dart detection accuracy
    - **Additional Features**: May add dartboard detection to enable automatic coordinate calibration

2. **Game Workflow**
    - Activate scoring mode via software interface
    - System captures images at regular intervals (every few seconds)
    - Images processed to detect dart positions
    - Scoring algorithms applied based on game type (e.g., Cricket)
    - Results displayed in real-time on connected display

3. **Dart Detection Process**
    - Capture high-resolution image of dartboard
    - Apply image processing to detect dart positions
    - Map physical positions to dartboard segments and scores
    - Distinguish between previously counted darts and new throws

4. **Features**
    - Automatic scoring for Cricket and other game modes
    - Statistic tracking across games
    - Low latency detection and scoring
    - LED feedback for successful detection

## Future Enhancements

- TBD

## License

MIT License
