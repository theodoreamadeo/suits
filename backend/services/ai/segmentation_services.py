import cv2
import mediapipe as mp
import numpy as np
import time
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import os
from datetime import datetime
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
model_path = os.path.join(base_dir, "backend", "models", "face_landmarker.task")

# MediaPipe setup
BaseOptions = mp.tasks.BaseOptions
FaceLandmarker = mp.tasks.vision.FaceLandmarker
FaceLandmarkerOptions = mp.tasks.vision.FaceLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Create face landmarker options
options = FaceLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=True)

# Define the triangulation for the face mesh
def get_triangulation():
    mp_face_mesh = mp.solutions.face_mesh
    return mp_face_mesh.FACEMESH_TESSELATION

# Define facial feature connections for highlighting
def get_facial_features():
    left_eye = [(33, 7), (7, 163), (163, 144), (144, 145), 
                (145, 153), (153, 154), (154, 155), (155, 133), 
                (33, 133)]
    
    right_eye = [(362, 382), (382, 381), (381, 380), (380, 374), 
                 (374, 373), (373, 390), (390, 249), (249, 263), 
                 (263, 362)]
    
    left_eyebrow = [(70, 63), (63, 105), (105, 66), (66, 107), 
                     (107, 55), (55, 65), (65, 52), (52, 53), 
                     (53, 46)]
    
    right_eyebrow = [(336, 296), (296, 334), (334, 293), (293, 300), 
                      (300, 276), (276, 283), (283, 282), (282, 295), 
                      (295, 285)]
    
    return {
        "left_eye": left_eye,
        "right_eye": right_eye,
        "left_eyebrow": left_eyebrow,
        "right_eyebrow": right_eyebrow
    }

# Draw the face mesh with triangulation
def draw_mesh(frame, landmarks, triangulation, facial_features=None):
    height, width, _ = frame.shape
    
    # Create a transparent overlay for the mesh
    mesh_overlay = np.zeros_like(frame, dtype=np.uint8)
    
    # Convert landmarks to pixel coordinates
    points = []
    for landmark in landmarks:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        points.append((x, y))
    
    # Draw triangulation (main mesh)
    for connection in triangulation:
        # Check if these indices exist in our landmarks
        if connection[0] < len(points) and connection[1] < len(points):
            pt1 = points[connection[0]]
            pt2 = points[connection[1]]
            cv2.line(mesh_overlay, pt1, pt2, (255, 255, 255), 1)
    
    # Draw colored facial features
    if facial_features:
        # Left eye (red)
        for connection in facial_features["left_eye"]:
            if connection[0] < len(points) and connection[1] < len(points):
                pt1 = points[connection[0]]
                pt2 = points[connection[1]]
                cv2.line(mesh_overlay, pt1, pt2, (0, 0, 255), 2)
        
        # Right eye (green)
        for connection in facial_features["right_eye"]:
            if connection[0] < len(points) and connection[1] < len(points):
                pt1 = points[connection[0]]
                pt2 = points[connection[1]]
                cv2.line(mesh_overlay, pt1, pt2, (0, 255, 0), 2)
        
        # Left eyebrow (red)
        for connection in facial_features["left_eyebrow"]:
            if connection[0] < len(points) and connection[1] < len(points):
                pt1 = points[connection[0]]
                pt2 = points[connection[1]]
                cv2.line(mesh_overlay, pt1, pt2, (0, 0, 255), 2)
        
        # Right eyebrow (green)
        for connection in facial_features["right_eyebrow"]:
            if connection[0] < len(points) and connection[1] < len(points):
                pt1 = points[connection[0]]
                pt2 = points[connection[1]]
                cv2.line(mesh_overlay, pt1, pt2, (0, 255, 0), 2)
    
    # Blend the mesh overlay with the original frame
    alpha = 0.8 # Transparency level
    mesh_visualization = cv2.addWeighted(frame, alpha, mesh_overlay, 1-alpha, 0)
    
    return mesh_visualization

# Create a face mask from landmarks (your existing code)
def create_face_mask(frame, face_landmarks):
    height, width, _ = frame.shape
    mask = np.zeros((height, width), dtype=np.uint8)
    
    # Extract face oval points
    face_oval_points = []

    # Convert the landmarks to pixel coordinates
    for landmark in face_landmarks:
        x = int(landmark.x * width)
        y = int(landmark.y * height)
        face_oval_points.append((x, y))
    
    # Get indices for face oval - using common face outline points
    face_oval_indices = [
        10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
        397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
        172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
    ]
    
    # Extract face oval points
    oval_points = [face_oval_points[i] for i in face_oval_indices if i < len(face_oval_points)]
    
    if len(oval_points) > 0:
        # Convert points to numpy array
        oval_points_array = np.array(oval_points, dtype=np.int32)
        
        # Fill the polygon to create a mask
        cv2.fillPoly(mask, [oval_points_array], 255)
    
    return mask

