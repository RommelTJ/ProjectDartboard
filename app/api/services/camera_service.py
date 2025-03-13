import glob
import os
from datetime import datetime
from typing import Optional, Tuple

import requests
import urllib3

# Suppress insecure request warnings when connecting to camera
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class CameraService:
    """
    Service for interacting with the Reolink camera and managing camera feed images.
    """

    # Directory to store camera feed images
    FEED_DIR = "/app/feed"

    @staticmethod
    def get_camera_config() -> Tuple[str, str, str]:
        """
        Get camera configuration from environment variables.

        Returns:
            Tuple containing (camera_ip, username, password)

        Raises:
            ValueError: If required environment variables are not set
        """
        camera_ip = os.environ.get("CAMERA_IP")
        camera_username = "admin"  # Default username for Reolink cameras
        camera_password = os.environ.get("CAMERA_PASSWORD")

        if not camera_ip or not camera_password:
            raise ValueError("Camera configuration missing. CAMERA_IP and CAMERA_PASSWORD must be set.")

        return camera_ip, camera_username, camera_password

    @classmethod
    def ensure_feed_directory(cls) -> None:
        """Ensure the feed directory exists."""
        os.makedirs(cls.FEED_DIR, exist_ok=True)

    @classmethod
    def take_picture(cls) -> Optional[str]:
        """
        Take a picture using the configured camera and save it to the feed directory.

        Returns:
            str: Path to the saved image file if successful, None otherwise
        """
        try:
            # Ensure feed directory exists
            cls.ensure_feed_directory()

            # Get camera configuration
            ip, username, password = cls.get_camera_config()

            # Try HTTPS first
            image_data = cls._capture_image(ip, username, password, use_https=True)

            # If HTTPS fails, try HTTP
            if image_data is None:
                image_data = cls._capture_image(ip, username, password, use_https=False)

            if image_data:
                # Generate filename with timestamp
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"{timestamp}_dart.jpg"
                file_path = os.path.join(cls.FEED_DIR, filename)

                # Save the image
                with open(file_path, "wb") as f:
                    f.write(image_data)

                return file_path

            return None

        except Exception as e:
            print(f"Error taking picture: {type(e).__name__}: {str(e)}")
            return None

    @staticmethod
    def _capture_image(
        ip: str,
        username: str,
        password: str,
        port: int = 443,
        use_https: bool = True
    ) -> Optional[bytes]:
        """
        Connect to a Reolink camera and capture an image using direct API calls.

        Args:
            ip: IP address of the camera
            username: Camera login username
            password: Camera login password
            port: Camera port (default 443 for HTTPS, 80 for HTTP)
            use_https: Whether to use HTTPS (default True)

        Returns:
            bytes: Image data if successful, None otherwise
        """
        protocol = "https" if use_https else "http"
        port = port if port else (443 if use_https else 80)
        base_url = f"{protocol}://{ip}:{port}"

        # Create a session with SSL verification disabled
        session = requests.Session()
        session.verify = False

        try:
            # Try to get a snapshot directly
            snapshot_url = f"{base_url}/cgi-bin/api.cgi?cmd=Snap&channel=0&user={username}&password={password}"

            response = session.get(snapshot_url, timeout=10)

            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')

                if content_type.startswith('image/'):
                    return response.content
                else:
                    print(f"Response was not an image. Content-Type: {content_type}")
            else:
                print(f"Error: Status code {response.status_code}")

            return None

        except Exception as e:
            print(f"Error: {e}")
            return None

    @classmethod
    def get_latest_picture(cls) -> Optional[str]:
        """
        Get the path to the latest picture in the feed directory.

        Returns:
            str: Path to the latest image file if available, None otherwise
        """
        cls.ensure_feed_directory()

        # List all jpg files in the feed directory
        image_files = glob.glob(os.path.join(cls.FEED_DIR, "*_dart.jpg"))

        if not image_files:
            return None

        # Sort by modification time (newest first)
        latest_image = max(image_files, key=os.path.getmtime)
        return latest_image

    @classmethod
    def delete_all_pictures(cls) -> int:
        """
        Delete all pictures in the feed directory.

        Returns:
            int: Number of files deleted
        """
        cls.ensure_feed_directory()

        # List all jpg files in the feed directory
        image_files = glob.glob(os.path.join(cls.FEED_DIR, "*_dart.jpg"))
        count = 0

        # Delete each file
        for file_path in image_files:
            try:
                os.remove(file_path)
                count += 1
            except Exception as e:
                print(f"Error deleting {file_path}: {e}")

        return count
