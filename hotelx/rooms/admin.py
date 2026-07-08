from django.contrib import admin

# Register your models here.
from .models import RoomCategory, RoomCategoryImage


# admin.site.register(RoomCategory)
# admin.site.register(RoomCategoryImage)
class RoomCategoryImageInline(admin.TabularInline):
    model = RoomCategoryImage
    extra = 1


@admin.register(RoomCategory)
class RoomCategoryAdmin(admin.ModelAdmin):
    inlines = [RoomCategoryImageInline]
