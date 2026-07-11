from django.core.files.uploadedfile import UploadedFile
from PIL import Image, ImageFilter
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

# Image label configurations with best practice dimensions and processing
IMAGE_LABEL_CONFIGS = {
    # Hero/Main images - highest quality, optimized for web display
    "hero": {
        "width": 1920,
        "height": 1080,
        "resize_method": "thumbnail",
        "filter": ImageFilter.SHARPEN,
        "description": "Full HD hero images with sharpening for web display",
    },
    "main": {
        "width": 1920,
        "height": 1080,
        "resize_method": "thumbnail",
        "filter": ImageFilter.SHARPEN,
        "description": "Full HD main content images with sharpening",
    },
    "featured": {
        "width": 1920,
        "height": 1080,
        "resize_method": "thumbnail",
        "filter": ImageFilter.SHARPEN,
        "description": "Featured images with Full HD resolution and sharpening",
    },
    # Thumbnail - smaller size, good compression
    "thumbnail": {
        "width": 400,
        "height": 300,
        "resize_method": "resize",
        "filter": ImageFilter.GaussianBlur(radius=0.5),
        "description": "Preview thumbnails with subtle blur effect",
    },
    # Gallery image - balanced quality and size
    "gallery": {
        "width": 800,
        "height": 600,
        "resize_method": "resize",
        "filter": ImageFilter.EDGE_ENHANCE,
        "description": "Gallery images with balanced quality and edge enhancement",
    },
    # Room category image - standard format
    "room_category": {
        "width": 400,
        "height": 400,
        "resize_method": "resize",
        "filter": ImageFilter.EMBOSS,
        "description": "Room category icons with emboss effect",
    },
    # About section image - informative content
    "about": {
        "width": 800,
        "height": 600,
        "resize_method": "resize",
        "filter": ImageFilter.EDGE_ENHANCE,
        "description": "About section images with edge enhancement",
    },
    # Reviews/testimonial image - profile picture
    "reviews": {
        "width": 200,
        "height": 200,
        "resize_method": "resize",
        "filter": ImageFilter.GaussianBlur(radius=0.3),
        "description": "Testimonial/profile images with subtle blur",
    },
    # Team member image - professional headshot
    "team": {
        "width": 300,
        "height": 300,
        "resize_method": "resize",
        "filter": ImageFilter.SHARPEN,
        "description": "Team member photos with professional sharpening",
    },
    # Why choose us feature image - icon-style
    "why_choose_us": {
        "width": 400,
        "height": 300,
        "resize_method": "resize",
        "filter": ImageFilter.EMBOSS,
        "description": "Feature images with emboss effect",
    },
    # Contact section image - informative content
    "contact": {
        "width": 800,
        "height": 600,
        "resize_method": "resize",
        "filter": ImageFilter.EDGE_ENHANCE,
        "description": "Contact section images with edge enhancement",
    },
    # FAQ section image - informative content
    "faq": {
        "width": 400,
        "height": 300,
        "resize_method": "resize",
        "filter": ImageFilter.EDGE_ENHANCE,
        "description": "FAQ section images with edge enhancement",
    },
    # Newsletter signup image - promotional
    "newsletter": {
        "width": 600,
        "height": 400,
        "resize_method": "resize",
        "filter": ImageFilter.SHARPEN,
        "description": "Newsletter promotional images with sharpening",
    },
    # Footer logo/image - compact
    "footer": {
        "width": 200,
        "height": 100,
        "resize_method": "resize",
        "filter": None,
        "description": "Footer logos with compact dimensions",
    },
    # Navigation icon/image - small
    "nav": {
        "width": 24,
        "height": 24,
        "resize_method": "resize",
        "filter": None,
        "description": "Navigation icons with small dimensions",
    },
    # Home page image - banner
    "home": {
        "width": 1920,
        "height": 1080,
        "resize_method": "thumbnail",
        "filter": ImageFilter.SHARPEN,
        "description": "Home page banners with Full HD resolution and sharpening",
    },
    # Team section image - group photo
    "team_section": {
        "width": 800,
        "height": 600,
        "resize_method": "resize",
        "filter": ImageFilter.EDGE_ENHANCE,
        "description": "Team section images with edge enhancement",
    },
}


def get_label_config(label):
    """
    Retrieve the image processing configuration for a given label.

    Args:
        label: String label for the image type (e.g., 'hero', 'thumbnail', 'gallery', 'room_category')

    Returns:
        Dict with configuration keys (width, height, resize_method, filter, description)
        or None if label is not found.
    """
    if not label:
        return None
    label = label.lower().strip()
    return IMAGE_LABEL_CONFIGS.get(label)


ROOM_IMAGE_LABELS = {
    key: config
    for key, config in IMAGE_LABEL_CONFIGS.items()
    if key
    in {
        "hero",
        "main",
        "featured",
        "thumbnail",
        "gallery",
        "room_category",
    }
}
"""
Subset of IMAGE_LABEL_CONFIGS relevant to room category images.
Keeps the dropdown focused and prevents irrelevant choices.
"""


def image_modify(image, width, height, label=None):
    """
    Modify an uploaded image based on its label to match best practices for the intended use.

    Args:
        image: Either an UploadedFile object or a PIL Image object
        width: Target width for the modified image
        height: Target height for the modified image
        label: Optional label indicating the purpose of the image (e.g., 'hero', 'thumbnail', 'gallery', 'room_category')

    Returns:
        PIL Image object with modifications applied based on label

    Raises:
        ValueError: If image is invalid or unsupported
        TypeError: If image type is not supported
    """
    try:
        # Handle different input types
        if isinstance(image, UploadedFile):
            # Read uploaded file content
            image_data = image.read()
            img = Image.open(BytesIO(image_data))
        elif hasattr(image, "read"):
            # Handle file-like objects
            img = Image.open(image)
        elif isinstance(image, Image.Image):
            # Already a PIL Image object
            img = image
        else:
            raise TypeError(f"Unsupported image type: {type(image)}")

        # Convert to RGB if necessary (for formats like PNG with transparency)
        if img.mode != "RGB":
            img = img.convert("RGB")

        # Apply label-specific modifications using configuration dictionary
        if label:
            label = label.lower().strip()

            # Get configuration for the label
            config = IMAGE_LABEL_CONFIGS.get(label)

            if config:
                target_width = config["width"]
                target_height = config["height"]
                resize_method = config["resize_method"]
                filter_type = config["filter"]

                # Apply resize based on method
                if resize_method == "thumbnail":
                    img.thumbnail(
                        (target_width, target_height), Image.Resampling.LANCZOS
                    )
                else:  # resize
                    img = img.resize(
                        (target_width, target_height), Image.Resampling.LANCZOS
                    )

                # Apply filter if specified
                if filter_type:
                    img = img.filter(filter_type)
            else:
                # Unknown label - use provided dimensions
                logger.warning(
                    f"Unknown label '{label}' for image modification. Using provided dimensions."
                )
                img = img.resize((width, height), Image.Resampling.LANCZOS)
        else:
            # No label provided - use provided dimensions
            logger.warning(
                "No label provided for image modification. Using provided dimensions."
            )
            img = img.resize((width, height), Image.Resampling.LANCZOS)

        return img

    except Exception as e:
        logger.error(f"Error modifying image: {str(e)}")
        raise ValueError(f"Failed to modify image: {str(e)}")
