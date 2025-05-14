import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision
import cv2
import numpy as np
import math
import time
import logging
from typing import Dict, List, Tuple, Optional, Union

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BodyMeasurement:
    def __init__(self):
        
        # Initialize the variables
        self.pose_start_time = None  # Time when the pose is first detected
        self.measurement_results = {}  # Dictionary to store measurements
        self.pose_stable = False  # Flag to check if pose is stable
        self.movement_threshold = 100  # Higher value means more tolerance for movement
        self.previous_landmarks = None  # To compare previous and current landmarks for movement
        self.scale_factor = 0.2546766862  # To be set after calibration
        
        # Initialize status messages
        self.status_message = "Waiting for pose detection"

        # Initialize MediaPipe Pose
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=1, 
            smooth_landmarks=True,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.7
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles

        # Custom drawing specifications for better visibility
        self.drawing_spec = self.mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2)

        # Initialize measurement history for temporal filtering
        self.measurement_history = {
            'shoulder_width': [],
            'torso_length': [],
            'hip_width': [],
            'left_leg_length': [],
            'right_leg_length': [],
            'chest_width': [],
            'waist_width': []
        }
        self.history_length = 10  # Number of frames to average
        
        # Size chart for clothing sizes (in centimeters)
        self.size_chart = {
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
    
    def draw_measurement_line(self, 
                             frame: np.ndarray, 
                             pt1: Tuple[int, int], 
                             pt2: Tuple[int, int], 
                             label: str, 
                             color: Tuple[int, int, int] = (0, 255, 0)) -> None:
            
        cv2.line(frame, pt1, pt2, color, 2)
        mid_point = ((pt1[0] + pt2[0]) // 2, (pt1[1] + pt2[1]) // 2)
        cv2.putText(frame, label, mid_point, cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

    def draw_status_text(self, frame: np.ndarray) -> None:

        # Draw status message
        cv2.putText(frame, self.status_message, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        
        # Draw calibration status
        cv2.putText(frame, self.calibration_status, (10, 60), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        
        # Draw countdown if pose is stable
        if self.pose_start_time:
            time_elapsed = time.time() - self.pose_start_time
            if time_elapsed < self.stable_pose_seconds:
                countdown = self.stable_pose_seconds - int(time_elapsed)
                cv2.putText(frame, f"Hold pose: {countdown}", (10, 90), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            else:
                cv2.putText(frame, "Measurements captured!", (10, 90), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

    def update_measurement_history(self, measurements: Dict[str, float]) -> None:

        for key, value in measurements.items():
            if key in self.measurement_history:
                self.measurement_history[key].append(value)
                
                # Only keep the last 'history_length' measurements
                if len(self.measurement_history[key]) > self.history_length:
                    self.measurement_history[key] = self.measurement_history[key][-self.history_length:]

    def get_smoothed_measurements(self) -> Dict[str, float]:

        smoothed = {}
        for key, values in self.measurement_history.items():
            if values:
                smoothed[key] = sum(values) / len(values)
        
        return smoothed

    def apply_scale_factor(self, measurements: Dict[str, float]) -> Dict[str, float]:

        if not self.scale_factor:
            return measurements
            
        return {key: value * self.scale_factor for key, value in measurements.items()}

    def check_pose_stability(self, lmList: List[Tuple[int, int]]) -> bool:

        if self.previous_landmarks is None or len(self.previous_landmarks) != len(lmList):
            self.previous_landmarks = lmList
            return False
            
        # Calculate movement as sum of landmark displacements
        # We focus on torso landmarks (11-29) for stability
        try:
            movement = sum(math.dist(lmList[i][:2], self.previous_landmarks[i][:2]) 
                           for i in range(11, min(29, len(lmList))))
            
            # Update previous landmarks
            self.previous_landmarks = lmList
            
            # Check stability
            is_stable = movement < self.movement_threshold
            
            # Update status message
            if is_stable:
                self.status_message = "Pose stable"
            else:
                self.status_message = f"Movement detected: {movement:.1f} (threshold: {self.movement_threshold})"
                
            return is_stable
        except Exception as e:
            logger.error(f"Error checking pose stability: {str(e)}")
            self.status_message = "Error checking stability"
            return False

    def process_frame(self, frame: np.ndarray) -> Optional[Dict[str, Union[float, str, Dict]]]:

        try:
            # Flip the frame to avoid mirror effect
            frame = cv2.flip(frame, 1)

            # Convert frame to RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(frame_rgb)

            # Draw status text
            self.draw_status_text(frame)

            # Check if pose detection failed
            if not results.pose_landmarks:
                self.status_message = "No pose detected"
                self.pose_start_time = None
                return None

            # Extract landmarks
            lmList = []
            h, w, c = frame.shape
            for id, lm in enumerate(results.pose_landmarks.landmark):
                cx, cy = int(lm.x * w), int(lm.y * h)
                lmList.append((cx, cy))
            
            # Draw landmarks
            self.mp_drawing.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.drawing_spec
            )

            # Get coordinates of key landmarks
            try:
                left_shoulder = lmList[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value][:2]
                right_shoulder = lmList[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value][:2]
                left_hip = lmList[self.mp_pose.PoseLandmark.LEFT_HIP.value][:2]
                right_hip = lmList[self.mp_pose.PoseLandmark.RIGHT_HIP.value][:2]
                left_ankle = lmList[self.mp_pose.PoseLandmark.LEFT_ANKLE.value][:2]
                right_ankle = lmList[self.mp_pose.PoseLandmark.RIGHT_ANKLE.value][:2]
                left_knee = lmList[self.mp_pose.PoseLandmark.LEFT_KNEE.value][:2]
                right_knee = lmList[self.mp_pose.PoseLandmark.RIGHT_KNEE.value][:2]
                
            except Exception as e:
                logger.error(f"Error extracting landmarks: {str(e)}")
                self.status_message = "Error extracting landmarks"
                return None

            # Calculate distances between key landmarks
            current_measurements = {
                'shoulder_width': math.dist(left_shoulder, right_shoulder),
                'torso_length': math.dist(left_shoulder, left_hip),
                'hip_width': math.dist(left_hip, right_hip),
                'left_leg_length': math.dist(left_hip, left_ankle),
                'right_leg_length': math.dist(right_hip, right_ankle),
            }

            # Update measurement history for temporal filtering
            self.update_measurement_history(current_measurements)
            
            # Calculate smoothed measurements
            smoothed_measurements = self.get_smoothed_measurements()
            
            # Apply scale factor if calibrated
            display_measurements = self.apply_scale_factor(smoothed_measurements)
            
            # Determine unit for display
            unit = 'cm' if self.scale_factor else 'px'
            
            # Draw measurement lines with labels
            measurement_lines = [
                (left_shoulder, right_shoulder, f"Shoulders: {display_measurements.get('shoulder_width', 0):.1f} {unit}", (255, 0, 0)),
                (left_shoulder, left_hip, f"Torso: {display_measurements.get('torso_length', 0):.1f} {unit}", (0, 255, 0)),
                (left_hip, right_hip, f"Hips: {display_measurements.get('hip_width', 0):.1f} {unit}", (0, 0, 255)),
                (left_hip, left_ankle, f"L-Leg: {display_measurements.get('left_leg_length', 0):.1f} {unit}", (255, 255, 0)),
                (right_hip, right_ankle, f"R-Leg: {display_measurements.get('right_leg_length', 0):.1f} {unit}", (0, 255, 255))
            ]
            
            for pt1, pt2, label, color in measurement_lines:
                self.draw_measurement_line(frame, pt1, pt2, label, color)

            # Draw anatomical reference lines
            mid_shoulder = ((left_shoulder[0] + right_shoulder[0]) // 2, (left_shoulder[1] + right_shoulder[1]) // 2)
            mid_hip = ((left_hip[0] + right_hip[0]) // 2, (left_hip[1] + right_hip[1]) // 2)
            cv2.line(frame, mid_shoulder, mid_hip, (255, 255, 0), 2)  # Midline
            cv2.putText(frame, 'Center Line', (mid_shoulder[0]+5, mid_shoulder[1]-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)

            # Check for pose stability
            is_stable = self.check_pose_stability(lmList)
            
            # Update pose timing
            if is_stable:
                if self.pose_start_time is None:
                    self.pose_start_time = time.time()
            else:
                self.pose_start_time = None
            
            # Check if we've had a stable pose long enough to record measurements
            if self.pose_start_time and (time.time() - self.pose_start_time >= self.stable_pose_seconds):
                # Create result dictionary with measurements and metadata
                result = {
                    **display_measurements,
                    'unit': unit,
                    'timestamp': time.time(),
                    'is_calibrated': self.scale_factor is not None
                }
                
                # Add size categories if calibrated in centimeters
                if self.scale_factor is not None:
                    result['size_categories'] = self.determine_size_category(display_measurements)
                
                # Store measurements for later use
                self.measurement_results = result
                
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            self.status_message = f"Error: {str(e)}"
            return None
    
    def get_latest_measurements(self) -> Dict[str, Union[float, str, Dict]]:

        return self.measurement_results
    
    def determine_size_category(self, measurements: Dict[str, float]) -> Dict[str, str]:

        # Helper function to get size from chart
        def get_size(measurement: float, chart: Dict[str, Tuple[float, float]]) -> str:
            for size, (min_val, max_val) in chart.items():
                if min_val <= measurement < max_val:
                    return size
            return "Unknown"
        
        # Determine size categories for each measurement
        shoulder_size = get_size(measurements.get('shoulder_width', 0), self.size_chart["shoulders"])
        torso_size = get_size(measurements.get('torso_length', 0), self.size_chart["torso"])
        leg_size = get_size(measurements.get('left_leg_length', 0), self.size_chart["legs"])
        
        # Calculate an overall size recommendation
        size_values = {"XS": 1, "S": 2, "M": 3, "L": 4, "XL": 5, "XXL": 6, "XXXL": 7, "Unknown": 0}
        
        valid_sizes = [size for size in [shoulder_size, torso_size, leg_size] if size != "Unknown"]
        if valid_sizes:
            # Convert sizes to numeric values
            size_nums = [size_values[size] for size in valid_sizes]
            
            # Calculate average size value and convert back to string
            avg_size_num = sum(size_nums) / len(size_nums)
            size_names = list(size_values.keys())
            size_values_rev = {v: k for k, v in size_values.items()}
            
            # Find closest size
            closest_size_num = min(size_values.values(), key=lambda x: abs(x - avg_size_num) if x > 0 else float('inf'))
            overall_size = size_values_rev[closest_size_num]
        else:
            overall_size = "Unknown"
        
        return {
            'shoulder_size': shoulder_size,
            'torso_size': torso_size,
            'leg_size': leg_size,
            'overall_size': overall_size
        }