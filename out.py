import cv2
import os

# Folder where frames are stored
frame_folder = "output_frames"

# Output video name
output_video = "final_video.mp4"

# FPS (same as original video ideally)
fps = 60

# Get sorted list of images
images = sorted([
    img for img in os.listdir(frame_folder)
    if img.endswith(".jpg")
])

# Read first image to get size
first_frame = cv2.imread(os.path.join(frame_folder, images[0]))
height, width, _ = first_frame.shape

# Define video writer
out = cv2.VideoWriter(
    output_video,
    cv2.VideoWriter_fourcc(*"mp4v"),
    fps,
    (width, height)
)

# Write frames to video
for image in images:
    img_path = os.path.join(frame_folder, image)
    frame = cv2.imread(img_path)
    out.write(frame)

out.release()

print(f"✅ Video created: {output_video}")