import mediapipe as mp
import cv2
import math
import numpy as np
import base64
import time
import logging
from typing import Dict, Any, Tuple, List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BodyMeasurement:
    """Body measurement service using MediaPipe Pose model"""
    
    def __init__(self):
        """Initialize the body measurement service"""
        # Constants for measurements
        self.user_height_cm = None
        self.known_shoulder_width_cm = None
        self.camera_distance_m = None
        self.scale_factor = None
        self.calibrated = False
        
        # MediaPipe setup
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1,
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.drawing_spec = self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2)
        
        # Measurement smoothing
        self.shoulder_width_buffer = []
        self.torso_length_buffer = []
        self.leg_length_buffer = []
        self.MAX_BUFFER_SIZE = 10
        
        logger.info("Body measurement service initialized")
    
    def initialize_calibration(self, user_height_cm: float, shoulder_width_cm: float, camera_distance_m: float = 2.0) -> Dict[str, Any]:
        """Initialize calibration with user measurements"""
        try:
            logger.info(f"Initializing calibration with height: {user_height_cm}cm, shoulder width: {shoulder_width_cm}cm, distance: {camera_distance_m}m")
            self.user_height_cm = user_height_cm
            self.known_shoulder_width_cm = shoulder_width_cm
            self.camera_distance_m = camera_distance_m
            
            # Default scale factor - will be refined during processing
            self.scale_factor = 0.1  # cm/pixel (approximate)
            self.calibrated = True
            
            # Clear measurement buffers
            self.shoulder_width_buffer = []
            self.torso_length_buffer = []
            self.leg_length_buffer = []
            
            return {
                "success": True,
                "message": "Calibration initialized successfully",
                "scaleFactor": self.scale_factor
            }
        except Exception as e:
            logger.error(f"Error initializing calibration: {str(e)}")
            return {
                "success": False,
                "message": f"Calibration initialization failed: {str(e)}"
            }
    
    def moving_average(self, buffer: List[float], new_value: float, max_size: int) -> float:
        """Add a new value to the buffer and return the moving average"""
        buffer.append(new_value)
        if len(buffer) > max_size:
            buffer.pop(0)
        return sum(buffer) / len(buffer)
    
    def draw_measurement_line(self, img: np.ndarray, pt1: Tuple[int, int], pt2: Tuple[int, int], 
                             color: Tuple[int, int, int], label: str, value: float) -> None:
        """Draw a line between two points with a measurement label"""
        cv2.line(img, pt1, pt2, color, 2)
        
        # Calculate midpoint for text placement
        mid_x = int((pt1[0] + pt2[0]) / 2)
        mid_y = int((pt1[1] + pt2[1]) / 2)
        
        # Draw text with background for better visibility
        text = f"{label}: {value:.1f} cm"
        text_size, _ = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        cv2.rectangle(img, 
                     (mid_x - 5, mid_y - text_size[1] - 5),
                     (mid_x + text_size[0] + 5, mid_y + 5),
                     (0, 0, 0), -1)
        cv2.putText(img, text, (mid_x, mid_y), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
    
    def process_frame(self, frame: np.ndarray) -> Dict[str, Any]:
        """Process a video frame for body measurements"""
        try:
            start_time = time.time()
            
            # Check if calibration has been done
            if not self.calibrated:
                return {
                    "hasPose": False,
                    "message": "System not calibrated. Please calibrate first."
                }
            
            # Create a status overlay
            h, w, _ = frame.shape
            status_overlay = np.zeros((80, w, 3), dtype=np.uint8)
            
            # Convert image to RGB
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(frame_rgb)
            
            # Add status overlay to the frame
            frame_with_overlay = np.vstack([status_overlay, frame])
            
            # Add calibration status
            cv2.putText(frame_with_overlay, "CALIBRATED - Measuring at 2m distance", 
                       (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            cv2.putText(frame_with_overlay, f"Scale: 1 pixel = {self.scale_factor:.4f} cm", 
                       (30, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            if not results.pose_landmarks:
                # No pose detected
                return {
                    "hasPose": False,
                    "message": "No pose detected"
                }
            
            # Draw pose landmarks
            self.mp_drawing.draw_landmarks(
                frame_with_overlay[80:], 
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.drawing_spec
            )
            
            landmarks = results.pose_landmarks.landmark
            
            # Extract key points
            # Shoulder positions with visibility check
            l_shoulder = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value]
            r_shoulder = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            
            # Only proceed if shoulders are visible enough
            if l_shoulder.visibility < 0.7 or r_shoulder.visibility < 0.7:
                return {
                    "hasPose": True,
                    "message": "Shoulders not visible clearly. Please adjust position."
                }
            
            # Convert normalized coordinates to pixel values
            x_l_shoulder = int(l_shoulder.x * w)
            y_l_shoulder = int(l_shoulder.y * h) + 80  # Adjust for overlay
            x_r_shoulder = int(r_shoulder.x * w)
            y_r_shoulder = int(r_shoulder.y * h) + 80  # Adjust for overlay
            
            # Calculate shoulder width in pixels (Euclidean distance)
            shoulder_width_px = math.hypot(x_r_shoulder - x_l_shoulder, y_r_shoulder - y_l_shoulder)
            
            # Refine scale factor based on known shoulder width
            refined_scale_factor = self.known_shoulder_width_cm / shoulder_width_px
            
            # Apply smooth transition to scale factor changes
            if abs(refined_scale_factor - self.scale_factor) < 0.05:  # Avoid drastic changes
                self.scale_factor = self.scale_factor * 0.9 + refined_scale_factor * 0.1
            
            # Get other landmarks with adjusted heights
            nose = landmarks[self.mp_pose.PoseLandmark.NOSE.value]
            y_head = int(nose.y * h) + 80
            
            left_hip = landmarks[self.mp_pose.PoseLandmark.LEFT_HIP.value]
            right_hip = landmarks[self.mp_pose.PoseLandmark.RIGHT_HIP.value]
            y_left_hip = int(left_hip.y * h) + 80
            y_right_hip = int(right_hip.y * h) + 80
            y_hip = int((y_left_hip + y_right_hip) / 2)
            x_hip = int((int(left_hip.x * w) + int(right_hip.x * w)) / 2)
            
            left_ankle = landmarks[self.mp_pose.PoseLandmark.LEFT_ANKLE.value]
            right_ankle = landmarks[self.mp_pose.PoseLandmark.RIGHT_ANKLE.value]
            y_left_ankle = int(left_ankle.y * h) + 80
            y_right_ankle = int(right_ankle.y * h) + 80
            y_ankle = int((y_left_ankle + y_right_ankle) / 2)
            x_ankle = int((int(left_ankle.x * w) + int(right_ankle.x * w)) / 2)
            
            # Calculate average shoulder height
            y_shoulder_avg = int((y_l_shoulder + y_r_shoulder) / 2)
            x_shoulder_mid = int((x_l_shoulder + x_r_shoulder) / 2)
            
            # Apply calibrated measurements
            # a. Shoulder Width - use moving average
            shoulder_width_cm = self.moving_average(
                self.shoulder_width_buffer, 
                shoulder_width_px * self.scale_factor, 
                self.MAX_BUFFER_SIZE
            )
            
            # Draw shoulder line
            self.draw_measurement_line(
                frame_with_overlay, 
                (x_l_shoulder, y_l_shoulder), 
                (x_r_shoulder, y_r_shoulder),
                (0, 255, 0),
                "Shoulders",
                shoulder_width_cm
            )
            
            # b. Torso Length (shoulder avg to hip avg)
            torso_length_px = abs(y_hip - y_shoulder_avg)
            torso_length_cm = self.moving_average(
                self.torso_length_buffer, 
                torso_length_px * self.scale_factor, 
                self.MAX_BUFFER_SIZE
            )
            
            # Draw torso line
            self.draw_measurement_line(
                frame_with_overlay, 
                (x_shoulder_mid, y_shoulder_avg), 
                (x_hip, y_hip),
                (255, 255, 0),
                "Torso",
                torso_length_cm
            )
            
            # c. Leg Length (hip to ankle)
            leg_length_px = abs(y_ankle - y_hip)
            leg_length_cm = self.moving_average(
                self.leg_length_buffer, 
                leg_length_px * self.scale_factor, 
                self.MAX_BUFFER_SIZE
            )
            
            # Draw leg line
            self.draw_measurement_line(
                frame_with_overlay, 
                (x_hip, y_hip), 
                (x_ankle, y_ankle),
                (255, 0, 255),
                "Legs",
                leg_length_cm
            )
            
            # Calculate total height
            total_height_cm = leg_length_cm + torso_length_cm + (y_shoulder_avg - y_head) * self.scale_factor
            
            # Display total height
            cv2.putText(frame_with_overlay, f'Estimated Height: {total_height_cm:.1f} cm', 
                       (w - 300, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Draw key reference points
            cv2.circle(frame_with_overlay, (x_l_shoulder, y_l_shoulder), 5, (0, 255, 0), -1)
            cv2.circle(frame_with_overlay, (x_r_shoulder, y_r_shoulder), 5, (0, 255, 0), -1)
            cv2.circle(frame_with_overlay, (x_hip, y_hip), 5, (255, 255, 0), -1)
            cv2.circle(frame_with_overlay, (x_ankle, y_ankle), 5, (255, 0, 255), -1)
            cv2.circle(frame_with_overlay, (x_shoulder_mid, y_head), 5, (0, 0, 255), -1)
            
            # Convert the frame to base64 for visualization
            _, buffer = cv2.imencode('.jpg', frame_with_overlay, [cv2.IMWRITE_JPEG_QUALITY, 85])
            visualization_image = f"data:image/jpeg;base64,{base64.b64encode(buffer).decode('utf-8')}"
            
            # Calculate FPS
            fps = 1.0 / (time.time() - start_time)
            
            # Return measurements and visualization
            return {
                "hasPose": True,
                "shoulderWidth": shoulder_width_cm,
                "torsoLength": torso_length_cm,
                "legLength": leg_length_cm,
                "totalHeight": total_height_cm,
                "scaleFactor": self.scale_factor,
                "visualizationImage": visualization_image,
                "fps": fps
            }
            
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return {
                "hasPose": False,
                "error": str(e)
            }
    
    def determine_size_category(self, measurements: Dict[str, float]) -> Dict[str, str]:
        """Determine size categories based on measurements"""
        # Size chart - these values should be adjusted based on your company's sizing
        size_chart = {
            "shoulders": {
                "XS": (0, 38), "S": (38, 40), "M": (40, 42), 
                "L": (42, 44), "XL": (44, 46), "XXL": (46, 48), "XXXL": (48, 100)
            },
            "torso": {
                "XS": (0, 40), "S": (40, 45), "M": (45, 50), 
                "L": (50, 55), "XL": (55, 60), "XXL": (60, 65), "XXXL": (65, 100)
            },
            "legs": {
                "XS": (0, 70), "S": (70, 75), "M": (75, 80), 
                "L": (80, 85), "XL": (85, 90), "XXL": (90, 95), "XXXL": (95, 150)
            }
        }
        
        # Function to determine size category
        def get_size(measurement: float, chart: Dict[str, Tuple[float, float]]) -> str:
            for size, (min_val, max_val) in chart.items():
                if min_val <= measurement < max_val:
                    return size
            return "Unknown"
        
        shoulder_size = get_size(measurements["shoulderWidth"], size_chart["shoulders"])
        torso_size = get_size(measurements["torsoLength"], size_chart["torso"])
        leg_size = get_size(measurements["legLength"], size_chart["legs"])
        
        # Calculate overall size (weighted average)
        size_values = {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "XXL": 6, "XXXL": 7, "Unknown": 4}
        
        # Weighted calculation (shoulders more important for suits)
        overall_value = (
            size_values[shoulder_size] * 0.5 + 
            size_values[torso_size] * 0.3 + 
            size_values[leg_size] * 0.2
        )
        
        # Round to nearest size
        size_keys = list(size_values.keys())
        overall_size = size_keys[min(int(round(overall_value)) - 1, len(size_keys) - 1)]
        
        return {
            "shoulders": shoulder_size,
            "torso": torso_size,
            "legs": leg_size,
            "overall": overall_size
        }