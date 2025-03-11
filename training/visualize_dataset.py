#!/usr/bin/env python3
"""
Visualize YOLO dataset to verify annotations
"""
import os
import random
import cv2
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

def plot_one_box(x, img, color=None, label=None, line_thickness=3):
    """Plot one bounding box on image"""
    tl = line_thickness or round(0.002 * (img.shape[0] + img.shape[1]) / 2) + 1  # line/font thickness
    color = color or [random.randint(0, 255) for _ in range(3)]
    c1, c2 = (int(x[0]), int(x[1])), (int(x[2]), int(x[3]))
    cv2.rectangle(img, c1, c2, color, thickness=tl, lineType=cv2.LINE_AA)
    if label:
        tf = max(tl - 1, 1)  # font thickness
        t_size = cv2.getTextSize(label, 0, fontScale=tl / 3, thickness=tf)[0]
        c2 = c1[0] + t_size[0], c1[1] - t_size[1] - 3
        cv2.rectangle(img, c1, c2, color, -1, cv2.LINE_AA)  # filled
        cv2.putText(img, label, (c1[0], c1[1] - 2), 0, tl / 3, [225, 255, 255], thickness=tf, lineType=cv2.LINE_AA)

def visualize_dataset(dataset_dir="yolo_dataset", num_samples=5, classes=['dart']):
    """Visualize random samples from the dataset with their labels"""
    # Get all image paths from training and validation sets
    train_images = list(Path(f"{dataset_dir}/images/train").glob("*.jpeg"))
    val_images = list(Path(f"{dataset_dir}/images/val").glob("*.jpeg"))
    all_images = train_images + val_images
    
    # Select random samples
    if len(all_images) < num_samples:
        num_samples = len(all_images)
    
    samples = random.sample(all_images, num_samples)
    
    # Create subplot grid
    fig, axs = plt.subplots(num_samples, 1, figsize=(12, num_samples * 6))
    if num_samples == 1:
        axs = [axs]
    
    for i, img_path in enumerate(samples):
        # Get the corresponding label path
        dataset_type = "train" if img_path.parents[1].name == "train" else "val"
        label_path = Path(f"{dataset_dir}/labels/{dataset_type}/{img_path.stem}.txt")
        
        # Read image
        img = cv2.imread(str(img_path))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        height, width = img.shape[:2]
        
        # Check if label file exists
        if label_path.exists():
            with open(label_path, 'r') as f:
                labels = f.readlines()
            
            # Plot each bounding box
            for label in labels:
                parts = label.strip().split()
                cls_id = int(parts[0])
                x_center, y_center, w, h = map(float, parts[1:])
                
                # Convert normalized coordinates to pixel values
                x1 = int((x_center - w/2) * width)
                y1 = int((y_center - h/2) * height)
                x2 = int((x_center + w/2) * width)
                y2 = int((y_center + h/2) * height)
                
                # Draw bounding box
                img_copy = img.copy()
                plot_one_box([x1, y1, x2, y2], img_copy, label=classes[cls_id])
                img = img_copy
        
        # Display image
        axs[i].imshow(img)
        axs[i].set_title(f"{img_path.name} - {dataset_type} set")
        axs[i].axis('off')
    
    plt.tight_layout()
    plt.savefig(f"{dataset_dir}/visualization.png")
    plt.show()
    print(f"Visualization saved to {dataset_dir}/visualization.png")

if __name__ == "__main__":
    visualize_dataset()