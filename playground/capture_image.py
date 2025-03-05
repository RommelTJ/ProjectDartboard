#!/usr/bin/env python3
"""
Simple script to capture an image from a Reolink camera using reolinkapi.
"""

from reolinkapi import Camera
import os
import urllib3
from datetime import datetime
import warnings
import requests
import time

# Suppress only the specific InsecureRequestWarning from urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def capture_image(ip, username, password, port=80, use_https=False, verbose=False):
    """
    Connect to a Reolink camera and capture an image.
    
    Args:
        ip: IP address of the camera
        username: Camera login username
        password: Camera login password
        port: Camera port (default 80)
        use_https: Whether to use HTTPS (default False)
        verbose: Print detailed logs (default False)
    """
    protocol = "https" if use_https else "http"
    url = f"{protocol}://{ip}:{port}"
    
    if verbose:
        print(f"Connecting to camera at {url}...")
    
    try:
        # Create camera object with verify=False to ignore SSL certificate errors
        camera = Camera(ip, port, use_https=use_https)
        
        # Set the connection timeout
        camera.session.timeout = 10
        
        # Retry login a few times if needed
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if verbose:
                    print(f"Login attempt {attempt+1}/{max_retries}...")
                
                # Login with verify=False to ignore SSL certificate errors
                login_success = camera.login(username, password)
                
                if login_success:
                    if verbose:
                        print("Login successful!")
                    break
                else:
                    if verbose:
                        print("Login failed. Retrying...")
                    time.sleep(2)
            except Exception as e:
                if verbose:
                    print(f"Login error: {e}")
                if attempt < max_retries - 1:
                    if verbose:
                        print("Retrying...")
                    time.sleep(2)
                else:
                    raise
        
        # Check if we're logged in
        if not camera.logged_in:
            print("Failed to log in after multiple attempts")
            return
            
        # Test if we can get basic info from the camera
        if verbose:
            print("Getting device info...")
            try:
                info = camera.get_device_info()
                print(f"Connected to camera model: {info.get('name', 'Unknown')}")
            except Exception as e:
                print(f"Warning: Could not get device info: {e}")
        
        # Capture image
        if verbose:
            print("Capturing image...")
        
        image = camera.get_snap()
        
        if image:
            # Generate filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"reolink_capture_{timestamp}.jpg"
            
            # Save the image
            with open(filename, "wb") as f:
                f.write(image)
            
            print(f"Image saved as {filename}")
        else:
            print("Failed to capture image")
            
        # Logout
        if verbose:
            print("Logging out...")
        camera.logout()
        
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to camera at {url}")
        print("Please check the IP address, port, and ensure the camera is on the network")
    except Exception as e:
        print(f"Error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Verify the camera's IP address and port")
        print("2. Make sure the username and password are correct")
        print("3. Try with --https if using HTTPS")
        print("4. Check if the camera is accessible on your network")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Capture an image from a Reolink camera")
    parser.add_argument("ip", help="Camera IP address")
    parser.add_argument("username", help="Camera login username")
    parser.add_argument("password", help="Camera login password")
    parser.add_argument("--port", type=int, default=80, help="Camera port (default: 80)")
    parser.add_argument("--https", action="store_true", help="Use HTTPS instead of HTTP")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    capture_image(args.ip, args.username, args.password, args.port, args.https, args.verbose)