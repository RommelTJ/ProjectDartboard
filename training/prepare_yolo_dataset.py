#!/usr/bin/env python3
"""
Prepare YOLO dataset from dart_dataset.csv
This script converts the dart board dataset to YOLO format for training
"""
import os
import csv
import shutil
import random
import math
from pathlib import Path

# Define paths
DATASET_CSV = "dart_dataset.csv"
IMAGES_DIR = "images"
OUTPUT_DIR = "yolo_dataset"
TRAIN_RATIO = 0.8  # 80% for training, 20% for validation

# Create output directory structure
os.makedirs(f"{OUTPUT_DIR}/images/train", exist_ok=True)
os.makedirs(f"{OUTPUT_DIR}/images/val", exist_ok=True)
os.makedirs(f"{OUTPUT_DIR}/labels/train", exist_ok=True)
os.makedirs(f"{OUTPUT_DIR}/labels/val", exist_ok=True)

# Define dart board segments (not used directly but helpful for reference)
# In YOLO, we'll just use a single class (0) for darts

def parse_position(segment, ring):
    """Convert segment and ring information to a binary 'on board' flag"""
    # For simplicity, we consider a dart 'on board' if it's not a miss
    if segment == 'miss' and ring == 'miss':
        return False, None, None
        
    # Dart is on board, need to estimate position
    return True, segment, ring

def estimate_dart_position(segment, ring):
    """Estimate relative dart position based on segment and ring"""
    # Dartboard is in upper right quadrant of the image, not in center
    # Approximate center of dartboard in normalized coordinates
    board_center_x = 0.65
    board_center_y = 0.4
    
    # Approximate radius of dartboard in normalized coordinates
    board_radius = 0.25
    
    # If missing segment or ring info, return board center with small random offset
    if segment is None or ring is None:
        offset_x = random.uniform(-0.05, 0.05)
        offset_y = random.uniform(-0.05, 0.05)
        return board_center_x + offset_x, board_center_y + offset_y
    
    # Convert segment number to angle (degrees)
    # Segment 20 is at top (0 degrees), then counter-clockwise
    segment_map = {
        '20': 0, '1': 18, '18': 36, '4': 54, '13': 72, '6': 90, '10': 108,
        '15': 126, '2': 144, '17': 162, '3': 180, '19': 198, '7': 216,
        '16': 234, '8': 252, '11': 270, '14': 288, '9': 306, '12': 324, '5': 342,
        'bull': 0  # Bull is at center, angle doesn't matter
    }
    
    # Convert ring to relative distance from center
    ring_map = {
        'miss': 1.1,  # Outside the board
        'single': 0.7,
        'double': 0.95,
        'triple': 0.5,
        'outer_bull': 0.2,
        'inner_bull': 0.1
    }
    
    # For bull, use special handling
    if segment == 'bull':
        if ring == 'inner_bull':
            return board_center_x, board_center_y
        else:  # outer bull
            offset_x = random.uniform(-0.05, 0.05)
            offset_y = random.uniform(-0.05, 0.05)
            return board_center_x + offset_x, board_center_y + offset_y
    
    # Get angle and radius
    try:
        angle_deg = segment_map.get(segment, 0)
        radius_factor = ring_map.get(ring, 0.7)  # Default to single if unknown
    except:
        # If we can't map the segment/ring, return center with offset
        offset_x = random.uniform(-0.1, 0.1)
        offset_y = random.uniform(-0.1, 0.1)
        return board_center_x + offset_x, board_center_y + offset_y
    
    # Convert angle to radians
    angle_rad = math.radians(angle_deg)
    
    # Calculate position based on angle and distance
    rel_x = math.sin(angle_rad) * board_radius * radius_factor
    rel_y = -math.cos(angle_rad) * board_radius * radius_factor
    
    # Apply position relative to board center
    x = board_center_x + rel_x
    y = board_center_y + rel_y
    
    # Ensure values stay within [0,1] range
    x = max(0.0, min(1.0, x))
    y = max(0.0, min(1.0, y))
    
    return x, y

def convert_to_yolo_format():
    """Convert dart dataset to YOLO format"""
    # Read CSV file
    dart_data = []
    with open(DATASET_CSV, 'r') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            dart_data.append(row)
    
    # Shuffle data
    random.shuffle(dart_data)
    
    # Split into train and validation sets
    split_idx = int(len(dart_data) * TRAIN_RATIO)
    train_data = dart_data[:split_idx]
    val_data = dart_data[split_idx:]
    
    # Process each set
    process_dataset(train_data, "train")
    process_dataset(val_data, "val")
    
    # Create dataset.yaml file
    create_yaml_config(len(dart_data), split_idx)
    
    print(f"Dataset prepared: {len(train_data)} training images, {len(val_data)} validation images")

def process_dataset(data, dataset_type):
    """Process each image and create corresponding label file"""
    for item in data:
        # Copy image to the destination folder
        src_img = os.path.join(IMAGES_DIR, item['filename'])
        dst_img = os.path.join(OUTPUT_DIR, "images", dataset_type, item['filename'])
        
        if os.path.exists(src_img):
            shutil.copy2(src_img, dst_img)
        else:
            print(f"Warning: Image {src_img} not found")
            continue
        
        # Create label file
        label_path = os.path.join(OUTPUT_DIR, "labels", dataset_type, Path(item['filename']).stem + ".txt")
        
        with open(label_path, 'w') as label_file:
            # Add each dart (we're only tracking dart positions, not values)
            dart_count = int(item['dart_count'])
            
            if dart_count >= 1 and parse_position(item['dart1_segment'], item['dart1_ring']):
                # In real implementation, we would calculate precise x,y,w,h
                # For now we'll use placeholder values that need to be refined
                # Format: class x_center y_center width height
                # Note: These values need to be normalized between 0-1
                # This is a simplified placeholder and needs to be replaced with actual detection
                label_file.write(f"0 0.5 0.5 0.05 0.05\n")
            
            if dart_count >= 2 and parse_position(item['dart2_segment'], item['dart2_ring']):
                # Same placeholder for dart 2
                label_file.write(f"0 0.55 0.5 0.05 0.05\n")
            
            if dart_count >= 3 and parse_position(item['dart3_segment'], item['dart3_ring']):
                # Same placeholder for dart 3
                label_file.write(f"0 0.6 0.5 0.05 0.05\n")

def create_yaml_config(total_images, train_count):
    """Create YAML configuration file for training"""
    yaml_path = os.path.join(OUTPUT_DIR, "dataset.yaml")
    
    with open(yaml_path, 'w') as yaml_file:
        yaml_file.write(f"""# Dart Detection Dataset
path: {os.path.abspath(OUTPUT_DIR)}
train: images/train
val: images/val

# Classes
nc: 1  # Number of classes
names: ['dart']  # Class names
""")

if __name__ == "__main__":
    convert_to_yolo_format()
    print("YOLO dataset preparation complete!")