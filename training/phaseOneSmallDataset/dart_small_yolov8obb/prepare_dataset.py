#!/usr/bin/env python3
"""
Script to prepare the dataset for YOLO training by:
1. Creating train/val split (80/20)
2. Copying images and labels to the appropriate directories
"""

import os
import shutil
import random
from pathlib import Path
from glob import glob
import re

# Set seed for reproducibility
random.seed(42)

# Paths
DATA_DIR = Path(__file__).parent
LABELS_DIR = DATA_DIR / "labels"
ORIG_IMAGES_DIR = Path("/Users/rommel/code/work/chatmeter/ProjectDartboard/training/phaseOneSmallDataset/images")
TRAIN_DIR = DATA_DIR / "images/train"
VAL_DIR = DATA_DIR / "images/val"
TRAIN_LABELS_DIR = TRAIN_DIR / "labels"
VAL_LABELS_DIR = VAL_DIR / "labels"

# Create directories if they don't exist
os.makedirs(TRAIN_DIR, exist_ok=True)
os.makedirs(VAL_DIR, exist_ok=True)
os.makedirs(TRAIN_LABELS_DIR, exist_ok=True)
os.makedirs(VAL_LABELS_DIR, exist_ok=True)

# Get all label files
label_files = list(LABELS_DIR.glob("*.txt"))
print(f"Found {len(label_files)} label files")

# Extract original image filenames from label files
image_filenames = []
for label_file in label_files:
    # Extract the full image filename from the label filename
    # Label filename format: <uuid>-<image_filename>.txt
    match = re.search(r'-(.*?)\.txt$', label_file.name)
    if match:
        image_filename = match.group(1) + ".jpeg"
        image_filenames.append(image_filename)

print(f"Matched {len(image_filenames)} image filenames")

# Create train/val split (80/20)
random.shuffle(image_filenames)
split_idx = int(len(image_filenames) * 0.8)
train_images = image_filenames[:split_idx]
val_images = image_filenames[split_idx:]

print(f"Train images: {len(train_images)}")
print(f"Val images: {len(val_images)}")

# Copy train images and their label files
for img_filename in train_images:
    # Copy image
    src_img = ORIG_IMAGES_DIR / img_filename
    dst_img = TRAIN_DIR / img_filename
    
    if src_img.exists():
        shutil.copy2(src_img, dst_img)
        print(f"Copied {img_filename} to train set")
    else:
        print(f"Warning: Image {img_filename} not found")
        continue
    
    # Find and copy corresponding label file
    label_found = False
    for label_file in label_files:
        if img_filename.replace('.jpeg', '') in label_file.name:
            dst_label = TRAIN_LABELS_DIR / (img_filename.replace('.jpeg', '.txt'))
            shutil.copy2(label_file, dst_label)
            label_found = True
            break
    
    if not label_found:
        print(f"Warning: Label for {img_filename} not found")

# Copy val images and their label files
for img_filename in val_images:
    # Copy image
    src_img = ORIG_IMAGES_DIR / img_filename
    dst_img = VAL_DIR / img_filename
    
    if src_img.exists():
        shutil.copy2(src_img, dst_img)
        print(f"Copied {img_filename} to val set")
    else:
        print(f"Warning: Image {img_filename} not found")
        continue
    
    # Find and copy corresponding label file
    label_found = False
    for label_file in label_files:
        if img_filename.replace('.jpeg', '') in label_file.name:
            dst_label = VAL_LABELS_DIR / (img_filename.replace('.jpeg', '.txt'))
            shutil.copy2(label_file, dst_label)
            label_found = True
            break
    
    if not label_found:
        print(f"Warning: Label for {img_filename} not found")

print("Dataset preparation complete!")