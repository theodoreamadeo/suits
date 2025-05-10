import os 
import logging
import stone
import json
from datetime import datetime
import tempfile

# Configure logging
logging.basicConfig(level = logging.INFO, format = '%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SkinToneAnalyzer:
    def __init__(self, save_directory: str = None):
        if save_directory is None :
            # Get the directory of the current file 
            current_directory = os.path.dirname(os.path.abspath(__file__))
            base_directory = os.path.dirname(os.path.dirname(os.path.dirname(current_directory)))
            self.save_directory = os.path.join(base_directory, "analyzed_faces")
        else:
            self.save_directory = save_directory
        
        os.makedirs(self.save_directory, exist_ok=True)
        logger.info(f"SkinToneAnalyzer initialized with save directory: {self.save_directory}")
        
    def analyze_image (self, image_path):
        logger.info (f"Analyzing image: {image_path}")

        # Check the existance of the image file
        if not os.path.exists(image_path):
            logger.error (f"Image file does not exist: {image_path}")
            return {"error": "Image file does not exist"}
        
        try:
            # Process the image using stone library
            logger.info (f"Processing image with stone library: {image_path}")
            result = stone.process (image_path, image_type = 'color', return_report_image = False)

            # Log sucess
            logger.info (f"Image processed successfully: {image_path}")

            # Save the result to a JSON file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            json_filename = os.path.join(self.save_directory, f"skin_analysis_{timestamp}.json")
            with open(json_filename, 'w') as json_file:
                json.dump(result, json_file, indent=2)
            logger.info (f"Result saved to: {json_filename}")

            return result
        
        except Exception as e:
            logger.error (f"Error in Stone analysis: {str(e)}")
            return {
                "error": f"Error in skin tone analysis: {str(e)}"
            }
    
    def analyze_uploaded_image (self, image_file):
        try:
            # Create a temporary file to save the image
            with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                temp_image_path = temp_file.name
                temp_file.write(image_file)
                

            logger.info (f"Temporary image saved at: {temp_image_path}")

            try:
                # Analyze the temporary file 
                result = self.analyze_image(temp_image_path)
                return result
            finally:
                # Clean up the temporary file
                try:
                    os.unlink(temp_image_path)
                    logger.info (f"Deleted temporary file: {temp_image_path}")
                except Exception as e:
                    logger.warning (f"Failed to delete temporary file: {e}")
            
        except Exception as e:
            logger.error (f"Error processing uploaded image: {e}")
            return {
                "error": f"Error processing uploaded image: {str(e)}"
            }