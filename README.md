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
    
    #### Revised Approach: Manual Annotation
    - **New Strategy**: Manually annotate a small subset of images with precise bounding boxes
      - Use Label Studio to manually annotate 50 high-quality images
        - https://github.com/HumanSignal/label-studio 
        - docker pull heartexlabs/label-studio:latest
        - docker run -it -p 8080:8080 -v $(pwd)/labelStudioData:/label-studio/data heartexlabs/label-studio:latest
      - Draw precise bounding boxes around each dart
      - Export as "YOLOv8 OBB" export format in Label Studio
      - Split into training/validation sets (80/20 split - 40 training, 10 validation)
      - Create YAML configuration file
      - Use the YOLOv11n-OBB model as a starting point
        - Why?
          - OBB (Oriented Bounding Box) capability
            This is perfect for detecting darts at various angles on your dartboard, which will give you better 
            accuracy for edge cases in cricket scoring.
          - Size and speed
            The nano version (YOLOv11n-obb) is the smallest and fastest in the OBB family:
              - Only 2.7M parameters (very lightweight)
              - Fast inference time (4.4ms on GPU, reasonable speed on your mini PC)
              - Still provides solid performance (78.4 mAP@50)
      - Train for 50 epochs
        - Train: 
            - `yolo detect train model=yolo11n-obb.pt data=/Users/rommel/code/work/chatmeter/ProjectDartboard/training/phaseOneSmallDataset/test_yolo_dataset/data.yaml epochs=50 imgsz=2160`
            - `yolo detect train model=yolo11n-obb.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\test_yolo_dataset\data.yaml epochs=50 imgsz=2160 batch=8`
            - `yolo detect train model=yolo11n-obb.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\test_yolo_dataset\data.yaml epochs=50 imgsz=2160 batch=4`
            - `yolo detect train model=yolo11n-obb.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\test_yolo_dataset\data.yaml epochs=50 imgsz=2160 batch=8 val=False` followed by 
              `yolo val model=C:\Users\me\Documents\GitHub\ProjectDartboard\runs\obb\train9\weights\best.pt data=C:\Users\me\Documents\GitHub\ProjectDartboard\training\phaseOneSmallDataset\test_yolo_dataset\data.yaml imgsz=2160` (replace "trainX" with latest training data)
        - Export / Optimize: `yolo export model=runs/detect/train/weights/best.pt format=onnx` (`yolo export model=/Users/rommel/code/work/chatmeter/ProjectDartboard/runs/obb/train9/weights/best.pt format=onnx`)
      - Implement basic detection
    - Then, if we have time, rinse and repeat with the entire image dataset
    - Then, if we have time, experiment with other models
    - Note: Gemini Pro has vision abilities capable of automatically drawing bounding boxes, but I decided not to pursue this option because:
      - Size limitations. Dart tips are extremely small objects. I had concerns about Gemini's accuracy.
      - Occlusion issues. Darts overlap or cause shadows. I threw the darts so I know how they landed. I don't think a 
        general vision model can handle this.
      - Precision requirements. Dartboard scoring is serious business. Friendships are on the line. You need 
        pixel-level accuracy for where the dart tips land.
      - Consistent annotation style. By hand, I can draw boxes using a similar style, and I can record the orientation 
        of the darts. I don't think a general vision model can handle this.

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

DartVision Project: Revised Approach
Updated Training Strategy

Expand dataset from 50 to 200 manually annotated images
Continue using YOLOv11n-OBB model for oriented bounding box detection
Train on RTX 3080 GPU with batch size 8
Expected training time: ~2 hours (vs. 8-10 hours on MacBook Pro)
Export to ONNX format for optimized inference

Performance Benefits

Current model already shows strong metrics (89.5% mAP50, 69.3% mAP50-95)
Larger dataset will improve detection accuracy for challenging scenarios:

Darts at unusual angles
Multiple darts close together
Varying lighting conditions
Different board states



Implementation Timeline

Dataset Expansion & Training: Complete by end of day

Annotate additional 150 images in Label Studio
Train with the same parameters as successful run
Export optimized model


Cricket App Development: 24 hours

Backend detection system (6-8 hours)
Cricket scoring logic (4-6 hours)
Simple web interface (6-8 hours)
Integration and testing (4-6 hours)



Key Advantages

GPU acceleration enables 5.4x faster training, allowing for larger dataset
Improved model accuracy will create a more reliable and impressive demo
Better detection means less time handling edge cases, more time for polish
Creates a stronger technical foundation for future expansion

This revised approach prioritizes model quality while still allowing sufficient time for developing a compelling hackathon demo.
