#!/usr/bin/env python3
"""
Simple script to capture an image from a Reolink camera using direct API calls.
"""

import requests
import urllib3
from datetime import datetime

# Suppress insecure request warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def capture_image(ip, username, password, port=443, use_https=True):
    """
    Connect to a Reolink camera and capture an image using direct API calls.
    
    Args:
        ip: IP address of the camera
        username: Camera login username
        password: Camera login password
        port: Camera port (default 443)
        use_https: Whether to use HTTPS (default True)
    """
    protocol = "https" if use_https else "http"
    base_url = f"{protocol}://{ip}:{port}"
    
    print(f"Connecting to camera at {base_url}...")
    
    # Create a session with SSL verification disabled
    session = requests.Session()
    session.verify = False
    
    try:
        # Try to get a snapshot directly
        snapshot_url = f"{base_url}/cgi-bin/api.cgi?cmd=Snap&channel=0&user={username}&password={password}"
        print(f"Requesting snapshot from: {snapshot_url}")
        
        response = session.get(snapshot_url, timeout=10)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            print(f"Response status: {response.status_code}, Content-Type: {content_type}")
            
            if content_type.startswith('image/'):
                # Generate filename with timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"reolink_capture_{timestamp}.jpg"
                
                # Save the image
                with open(filename, "wb") as f:
                    f.write(response.content)
                
                print(f"Image saved as {filename}")
                return True
            else:
                print("Response was not an image. Response content:")
                print(response.text[:200] + "..." if len(response.text) > 200 else response.text)
        else:
            print(f"Error: Status code {response.status_code}")
            print(response.text[:200] + "..." if len(response.text) > 200 else response.text)
            
        return False
        
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Capture an image from a Reolink camera")
    parser.add_argument("ip", help="Camera IP address")
    parser.add_argument("username", help="Camera login username") 
    parser.add_argument("password", help="Camera login password")
    parser.add_argument("--port", type=int, default=443, help="Camera port (default: 443)")
    parser.add_argument("--http", action="store_true", help="Use HTTP instead of HTTPS")
    
    args = parser.parse_args()
    
    capture_image(args.ip, args.username, args.password, args.port, not args.http)