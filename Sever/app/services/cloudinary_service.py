"""
Cloudinary Service
Handles image uploads to Cloudinary CDN
"""
import logging
import cloudinary
import cloudinary.uploader
from flask import current_app

logger = logging.getLogger(__name__)

# Allowed image extensions
ALLOWED_EXTENSIONS = current_app.config.get('ALLOWED_EXTENSIONS')


class CloudinaryService:
    """Service for handling image uploads"""

    @staticmethod
    def configure():
        """
        Configure Cloudinary with credentials from app config
        Should be called during app initialization
        """
        cloudinary.config(
            cloud_name=current_app.config.get('CLOUDINARY_CLOUD_NAME'),
            api_key=current_app.config.get('CLOUDINARY_API_KEY'),
            api_secret=current_app.config.get('CLOUDINARY_API_SECRET'),
            debug=True,
            secure=True
        )
        logger.info("Cloudinary configured")

    @staticmethod
    def allowed_file(filename):
        """
        Check if file extension is allowed

        Args:
            filename: Name of the file

        Returns:
            True if allowed, False otherwise
        """
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @staticmethod
    def upload_image(image_file):
        """
        Upload a single image to Cloudinary

        Args:
            image_file: File object from request.files

        Returns:
            tuple: (success: bool, url: str or error_message: str)
        """
        try:
            # Validate file
            if not image_file:
                return False, "No image file provided"

            if not CloudinaryService.allowed_file(image_file.filename):
                return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"

            # Upload to Cloudinary
            logger.info(f"Uploading {image_file.filename} to Cloudinary...")
            result = cloudinary.uploader.upload(image_file)

            secure_url = result.get('secure_url')
            logger.info(f"Upload successful: {secure_url}")

            return True, secure_url

        except cloudinary.exceptions.Error as e:
            logger.error(f"Cloudinary upload failed: {str(e)}")
            return False, f"Cloudinary error: {str(e)}"
        except Exception as e:
            logger.error(f"Unexpected error during upload: {str(e)}")
            return False, f"Upload failed: {str(e)}"

    @staticmethod
    def upload_images(image_files):
        """
        Upload multiple images to Cloudinary

        Args:
            image_files: List of file objects from request.files.getlist()

        Returns:
            tuple: (success: bool, urls: list or error_message: str)
        """
        if not image_files:
            return False, "No image files provided"

        uploaded_urls = []
        failed_files = []

        for image_file in image_files:
            success, result = CloudinaryService.upload_image(image_file)

            if success:
                uploaded_urls.append(result)
            else:
                failed_files.append(f"{image_file.filename}: {result}")

        # If some succeeded
        if uploaded_urls:
            if failed_files:
                logger.warning(
                    f"Some uploads failed: {', '.join(failed_files)}")
            return True, uploaded_urls

        # All failed
        error_msg = "; ".join(failed_files)
        return False, f"All uploads failed: {error_msg}"

    @staticmethod
    def delete_image(public_id):
        """
        Delete an image from Cloudinary

        Args:
            public_id: Cloudinary public ID of the image

        Returns:
            True if successful, False otherwise
        """
        try:
            result = cloudinary.uploader.destroy(public_id)

            if result.get('result') == 'ok':
                logger.info(f"Image deleted: {public_id}")
                return True
            else:
                logger.warning(f"Image deletion failed: {public_id}")
                return False

        except Exception as e:
            logger.error(f"Error deleting image: {str(e)}")
            return False


# Convenience functions
def upload_image(image_file):
    """Upload single image"""
    return CloudinaryService.upload_image(image_file)


def upload_images(image_files):
    """Upload multiple images"""
    return CloudinaryService.upload_images(image_files)
