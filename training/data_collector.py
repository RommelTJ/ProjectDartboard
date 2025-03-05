#!/usr/bin/env python3
"""
Data collector for DartVision training dataset.

This script captures images from the Reolink camera and allows you to easily
label them for training a dart detection model for Cricket scoring.
"""

import sys
import os
import csv
import requests
import urllib3
import time
from datetime import datetime
import uuid
import argparse

# Suppress insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Ensure the images directory exists
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

# CSV file for dataset
CSV_FILE = os.path.join(os.path.dirname(__file__), "dart_dataset.csv")

def capture_image(ip, username, password, port=443, use_https=True):
    """
    Capture an image from the Reolink camera.
    
    Returns:
        bytes: The image data or None if capture failed
    """
    protocol = "https" if use_https else "http"
    base_url = f"{protocol}://{ip}:{port}"
    
    # Create a session with SSL verification disabled
    session = requests.Session()
    session.verify = False
    
    try:
        # Try to get a snapshot directly
        snapshot_url = f"{base_url}/cgi-bin/api.cgi?cmd=Snap&channel=0&user={username}&password={password}"
        response = session.get(snapshot_url, timeout=10)
        
        if response.status_code == 200 and response.headers.get('content-type', '').startswith('image/'):
            return response.content
        else:
            print(f"Error: Failed to capture image (Status {response.status_code})")
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def initialize_csv():
    """Initialize the CSV file with headers if it doesn't exist."""
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                'image_id',           # Unique identifier for the image
                'filename',           # Path to the saved image
                'timestamp',          # When the image was captured
                'dart_count',         # Number of darts on the board (0-3)
                'board_state',        # 'empty', 'partial', 'full'
                'dart1_segment',      # Segment for first dart (e.g., '20', '19', 'bull')
                'dart1_ring',         # Ring for first dart ('single', 'double', 'triple', 'inner_bull', 'outer_bull')
                'dart2_segment',      # Segment for second dart
                'dart2_ring',         # Ring for second dart
                'dart3_segment',      # Segment for third dart
                'dart3_ring',         # Ring for third dart
                'notes'               # Any additional notes about this image
            ])
            print(f"Created new dataset file: {CSV_FILE}")

def save_image_data(image_data, dart_count, segments, rings, notes=""):
    """
    Save the image and its metadata to the dataset.
    
    Args:
        image_data: The binary image data
        dart_count: Number of darts visible (0-3)
        segments: List of segments hit ['20', '19', 'miss', etc.]
        rings: List of rings hit ['single', 'double', 'triple', etc.]
        notes: Any additional notes
    
    Returns:
        str: The filename of the saved image
    """
    if not image_data:
        return None
    
    # Generate a unique ID and filename
    image_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"dart_{timestamp}_{image_id[:8]}.jpg"
    full_path = os.path.join(IMAGES_DIR, filename)
    
    # Save the image
    with open(full_path, "wb") as f:
        f.write(image_data)
    
    # Determine board state
    if dart_count == 0:
        board_state = 'empty'
    elif dart_count == 3:
        board_state = 'full'
    else:
        board_state = 'partial'
    
    # Ensure segments and rings are padded to length 3
    segments = (segments + [''] * 3)[:3]
    rings = (rings + [''] * 3)[:3]
    
    # Save to CSV
    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            image_id,
            filename,
            timestamp,
            dart_count,
            board_state,
            segments[0],
            rings[0],
            segments[1],
            rings[1],
            segments[2],
            rings[2],
            notes
        ])
    
    print(f"Saved image as {filename} with {dart_count} darts")
    return filename

def run_collection_session(ip, username, password, port=443, use_https=True):
    """
    Run an interactive data collection session.
    """
    print("\n=== DartVision Data Collection Session ===")
    print("Instructions:")
    print("- Press ENTER to capture the current board state")
    print("- Enter number of darts, segments, and rings when prompted")
    print("- Type 'q' to quit the session")
    print("- For Cricket, focus on segments: 20, 19, 18, 17, 16, 15, bull")
    print("\nStarting collection...\n")
    
    # Initialize CSV if needed
    initialize_csv()
    
    try:
        while True:
            cmd = input("\nPress ENTER to capture image (or 'q' to quit): ").strip().lower()
            
            if cmd == 'q':
                break
                
            # Capture image
            print("Capturing image...")
            image_data = capture_image(ip, username, password, port, use_https)
            
            if not image_data:
                print("Failed to capture image. Try again.")
                continue
                
            # Get dart information
            try:
                dart_count = int(input("Number of darts on board (0-3): ").strip())
                if dart_count < 0 or dart_count > 3:
                    print("Invalid dart count. Must be between 0-3.")
                    continue
            except ValueError:
                print("Invalid input. Please enter a number.")
                continue
                
            segments = []
            rings = []
            
            # Get info for each dart
            for i in range(dart_count):
                print(f"\nDart {i+1} information:")
                segment = input(f"Segment (20, 19, 18, 17, 16, 15, bull, miss): ").strip().lower()
                
                if segment == 'miss':
                    segments.append('miss')
                    rings.append('miss')
                    continue
                    
                segments.append(segment)
                
                if segment == 'bull':
                    ring = input(f"Ring (inner_bull, outer_bull): ").strip().lower()
                else:
                    ring = input(f"Ring (single, double, triple): ").strip().lower()
                rings.append(ring)
                
            notes = input("Additional notes (optional): ").strip()
            
            # Save the data
            filename = save_image_data(image_data, dart_count, segments, rings, notes)
            
            if filename:
                print(f"Successfully added to dataset: {filename}")
            else:
                print("Failed to save image data.")
                
    except KeyboardInterrupt:
        print("\nSession terminated by user.")
    
    print(f"\nSession complete. Dataset saved to {CSV_FILE}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect dart board images for training")
    parser.add_argument("ip", help="Camera IP address")
    parser.add_argument("username", help="Camera login username")
    parser.add_argument("password", help="Camera login password")
    parser.add_argument("--port", type=int, default=443, help="Camera port (default: 443)")
    parser.add_argument("--http", action="store_true", help="Use HTTP instead of HTTPS")
    
    args = parser.parse_args()
    
    run_collection_session(args.ip, args.username, args.password, args.port, not args.http)