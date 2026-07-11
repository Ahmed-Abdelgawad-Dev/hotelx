import logging
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFit, Transpose

from hotelx.core.helpers import (
    IMAGE_LABEL_CONFIGS,
    ROOM_IMAGE_LABELS,
    get_label_config,
    image_modify,
)

logger = logging.getLogger(__name__)


class RoomCategory(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="e.g., Deluxe , Standard Room",
    )
    slug = models.SlugField(
        max_length=120,
        unique=True,
        blank=True,
        help_text="URL-friendly identifier. Auto-generated from name if left blank.",
    )
    total_rooms = models.PositiveIntegerField(
        default=1,
        help_text="Number of physical rooms of this category in the hotel",
    )
    description = models.TextField(blank=True, null=True)
    price_per_night = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Default/rack rate per night before meal plan or seasonal adjustments",
    )
    max_capacity = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=3,
        help_text="Total maximum number of guests",
    )
    max_adults = models.IntegerField(
        validators=[MinValueValidator(1)],
        default=2,
        help_text="Maximum number of adults",
    )
    max_children = models.IntegerField(
        validators=[MinValueValidator(0)],
        default=0,
        help_text="Maximum number of children",
    )
    amenities = models.TextField(
        blank=True,
        null=True,
        help_text="Comma-separated list of amenities (e.g., WiFi, TV, Air Conditioning)",
    )
    is_available = models.BooleanField(
        default=True,
        help_text="Uncheck to temporarily disable bookings for this category",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Room Category"
        verbose_name_plural = "Room Categories"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class RoomCategoryImage(models.Model):
    room_category = models.ForeignKey(
        RoomCategory,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = ProcessedImageField(
        upload_to="room_categories/",
        format="WEBP",
        options={"quality": 85},
    )
    is_main = models.BooleanField(
        default=False,
        help_text="Designate this image as the main/hero image for the room category",
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Descriptive text for accessibility and SEO",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Label field to determine image processing based on IMAGE_LABEL_CONFIGS
    label = models.CharField(
        max_length=50,
        choices=[
            (label, config["description"])
            for label, config in ROOM_IMAGE_LABELS.items()
        ],
        default="room_category",
        help_text="Image label determines processing based on best practices",
    )

    # Thumbnail spec — generated on-demand, cached automatically
    # Dimensions are read from the central IMAGE_LABEL_CONFIGS
    _thumbnail_cfg = IMAGE_LABEL_CONFIGS["thumbnail"]
    thumbnail = ImageSpecField(
        source="image",
        processors=[
            Transpose(),
            ResizeToFit(_thumbnail_cfg["width"], _thumbnail_cfg["height"]),
        ],
        format="WEBP",
        options={"quality": 75},
    )

    class Meta:
        verbose_name = "Room Category Image"
        verbose_name_plural = "Room Category Images"
        ordering = ["-is_main", "uploaded_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["room_category", "is_main"],
                condition=models.Q(is_main=True),
                name="unique_main_image_per_room_category",
            )
        ]

    def __str__(self) -> str:
        return f"Image for {self.room_category.name} ({'Main' if self.is_main else 'Secondary'})"

    def save(self, *args, **kwargs) -> None:
        """
        Save the room category image, processing it according to its label configuration.

        - If ``is_main`` is True, the effective label becomes "hero" so the image gets
          Full HD sharpened treatment.
        - The uploaded image is opened with Pillow, resized, and filtered according to
          the matching ``IMAGE_LABEL_CONFIGS`` entry, then stored as WEBP.
        - Only one image per room category may have ``is_main=True``.
        """
        # --- Enforce single main image ---
        if self.is_main:
            RoomCategoryImage.objects.filter(
                room_category=self.room_category, is_main=True
            ).exclude(pk=self.pk).update(is_main=False)

        # --- Process the image according to its label ---
        # (Only process on first upload — skip re-processing on subsequent saves)
        if self.pk is None and self.image:
            effective_label = "hero" if self.is_main else self.label
            config = get_label_config(effective_label)

            if config:
                try:
                    processed_img = image_modify(
                        self.image,
                        config["width"],
                        config["height"],
                        label=effective_label,
                    )

                    # Save the processed PIL image back into the ImageField as WEBP
                    buffer = BytesIO()
                    processed_img.save(buffer, format="WEBP", quality=85)

                    slug = self.room_category.slug or "room"
                    file_name = f"{slug}_{effective_label}.webp"
                    self.image.save(
                        file_name,
                        ContentFile(buffer.getvalue()),
                        save=False,
                    )
                except Exception as e:
                    logger.error(
                        "Failed to process image for label '%s': %s",
                        effective_label,
                        e,
                    )

        super().save(*args, **kwargs)
