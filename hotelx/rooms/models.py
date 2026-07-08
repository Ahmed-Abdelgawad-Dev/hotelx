from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.text import slugify
from imagekit.models import ImageSpecField, ProcessedImageField
from imagekit.processors import ResizeToFit, Transpose


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
        processors=[Transpose(), ResizeToFit(1920, 1080)],
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

    # Thumbnail spec — generated on-demand, cached automatically
    thumbnail = ImageSpecField(
        source="image",
        processors=[Transpose(), ResizeToFit(400, 300)],
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
        if self.is_main:
            RoomCategoryImage.objects.filter(
                room_category=self.room_category, is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)
