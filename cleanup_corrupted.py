#!/usr/bin/env python3
"""
Cleanup corrupted image files
"""
import os

corrupted_files = [
    'src/assets/galleries/events_ceremonies/image1.jpg',
    'src/assets/galleries/events_ceremonies/image2.jpg',
    'src/assets/galleries/events_ceremonies/image3.jpg',
    'src/assets/galleries/students_learning/image1.jpg',
    'src/assets/galleries/students_learning/image2.jpg',
    'src/assets/galleries/students_learning/image3.jpg',
]

for file_path in corrupted_files:
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
            print(f"✓ Removed: {file_path}")
        except Exception as e:
            print(f"✗ Error removing {file_path}: {e}")
    else:
        print(f"- File not found: {file_path}")

print("\nCleanup complete!")
