import os
import sys
import logging
from gradio_client import Client
import time
import random
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trellis_debug.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

class TrellisProcessor:
    def __init__(self, token):
        self.token = token
        self.client = self._create_client()
        
    def _create_client(self):
        """Create an authenticated client"""
        try:
            return Client(
                "lukketsvane/TRELLIS",
                hf_token=self.token
            )
        except Exception as e:
            logging.error(f"Failed to create authenticated client: {str(e)}")
            raise

    def _api_call_with_retry(self, api_name, max_retries=5, initial_delay=4, **kwargs):
        """Enhanced retry mechanism with proper error handling"""
        last_exception = None
        
        for attempt in range(max_retries):
            try:
                if attempt > 0:
                    delay = min(initial_delay * (2 ** attempt) + random.uniform(1, 3), 60)
                    logging.info(f"Attempt {attempt + 1}/{max_retries}: Waiting {delay:.1f}s before retry...")
                    time.sleep(delay)
                
                # Make the API call
                result = self.client.predict(
                    api_name=api_name,
                    **kwargs
                )
                
                # Add delay after successful call
                time.sleep(5)
                return result
                
            except Exception as e:
                last_exception = e
                error_msg = str(e)
                logging.warning(f"Attempt {attempt + 1} failed: {error_msg}")
                
                if "upstream Gradio app has raised an exception" in error_msg:
                    # Add longer delay for upstream errors
                    wait_time = random.uniform(20, 30)
                    logging.info(f"Upstream error - waiting {wait_time}s before retry...")
                    time.sleep(wait_time)
                    
                    # Try to recreate client
                    try:
                        self.client = self._create_client()
                    except:
                        pass
                
                if attempt == max_retries - 1:
                    raise Exception(f"All {max_retries} attempts failed. Last error: {error_msg}")

    def process_single_image(self, image_path):
        """Process single image with enhanced error handling"""
        image_file = os.path.basename(image_path)
        logging.info(f"Processing: {image_file}")
        
        try:
            # Step 1: Preprocess image
            logging.info("1. Preprocessing image...")
            preprocess_result = self._api_call_with_retry(
                "/preprocess_image",
                image=image_path
            )
            logging.debug("Preprocessing complete")
            
            # Add delay between steps
            time.sleep(10)
            
            # Step 2: Generate 3D asset
            logging.info("2. Generating 3D asset...")
            generation_result = self._api_call_with_retry(
                "/image_to_3d",
                trial_id=os.path.splitext(image_file)[0],
                seed=0,
                randomize_seed=True,
                ss_guidance_strength=7.5,
                ss_sampling_steps=12,
                slat_guidance_strength=3,
                slat_sampling_steps=12
            )
            logging.debug("3D generation complete")
            
            # Add delay between steps
            time.sleep(10)
            
            # Step 3: First button activation
            logging.info("3. Activating first button...")
            self._api_call_with_retry("/activate_button")
            
            # Step 4: First GLB extraction
            logging.info("4. First GLB extraction...")
            glb_result = self._api_call_with_retry(
                "/extract_glb",
                mesh_simplify=0.9,
                texture_size=512
            )
            
            # Add delay between steps
            time.sleep(10)
            
            # Step 5: Second button activation
            logging.info("5. Second button activation...")
            self._api_call_with_retry("/activate_button_1")
            
            # Step 6: Second GLB extraction
            logging.info("6. Second GLB extraction...")
            glb_result = self._api_call_with_retry(
                "/extract_glb",
                mesh_simplify=0.9,
                texture_size=512
            )
            
            # Final step
            logging.info("7. Final button activation...")
            final_result = self._api_call_with_retry("/activate_button_1")
            
            return True, None
            
        except Exception as e:
            error_msg = str(e)
            logging.error(f"Failed to process {image_file}: {error_msg}")
            return False, error_msg

def process_images_to_glb(input_dir, token):
    processor = TrellisProcessor(token)
    
    # Find images
    image_extensions = ('.png', '.jpg', '.jpeg', '.webp')
    image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(image_extensions)]
    
    if not image_files:
        logging.warning("No images found to process")
        return [], []
    
    logging.info(f"Found {len(image_files)} images to process")
    successful = []
    failed = []
    
    for idx, image_file in enumerate(image_files, 1):
        try:
            # Add substantial delay between files
            if idx > 1:
                wait_time = random.uniform(150, 210)  # Increased delay
                logging.info(f"Waiting {wait_time:.1f}s before next file...")
                time.sleep(wait_time)
            
            input_path = os.path.join(input_dir, image_file)
            success, error = processor.process_single_image(input_path)
            
            if success:
                successful.append(image_file)
                logging.info(f"Successfully processed {image_file}")
            else:
                failed.append((image_file, error))
                logging.error(f"Failed to process {image_file}: {error}")
                time.sleep(45)  # Longer delay after failure
                
        except KeyboardInterrupt:
            logging.info("\nProcessing interrupted by user")
            break
        except Exception as e:
            logging.error(f"Unexpected error processing {image_file}: {str(e)}")
            failed.append((image_file, str(e)))
            time.sleep(45)
    
    return successful, failed

if __name__ == "__main__":
    HF_TOKEN = "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"
    input_directory = os.getcwd()
    
    try:
        logging.info("Starting batch processing...")
        successful, failed = process_images_to_glb(input_directory, HF_TOKEN)
        logging.info("Batch processing complete!")
        
        # Print final summary
        logging.info("\n=== Processing Summary ===")
        logging.info(f"Successfully processed: {len(successful)}/{len(successful) + len(failed)}")
        if successful:
            logging.info("\nSuccessful files:")
            for file in successful:
                logging.info(f"✓ {file}")
        if failed:
            logging.info("\nFailed files:")
            for file, error in failed:
                logging.info(f"✗ {file}: {error}")
                
    except KeyboardInterrupt:
        logging.info("\nProcess terminated by user")
    except Exception as e:
        logging.error(f"Process failed with error: {str(e)}")