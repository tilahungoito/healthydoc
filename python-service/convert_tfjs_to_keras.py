"""
Script to convert TensorFlow.js model to Keras .h5 format
This converts the pneumonia detection model from TFJS to Keras format for use in Python service.

Usage:
    python convert_tfjs_to_keras.py

Requirements:
    pip install tensorflowjs tensorflow
"""

import os
import sys

def convert_tfjs_to_keras():
    """Convert TFJS model to Keras .h5 format"""
    
    # Paths - try both possible folder names
    tfjs_model_dirs = [
        '../lib/model/tfjspnumoniaDetectorModel',  # Actual folder name
        '../lib/model/pnumoniaDetectorModel',     # Alternative name
    ]
    
    tfjs_model_dir = None
    for path in tfjs_model_dirs:
        if os.path.exists(path):
            tfjs_model_dir = path
            break
    
    output_path = '../lib/model/pneumonia_model.h5'
    
    if not tfjs_model_dir:
        print(f"Error: TFJS model directory not found.")
        print(f"Tried: {tfjs_model_dirs[0]}")
        print(f"Tried: {tfjs_model_dirs[1]}")
        return False
    
    if not os.path.exists(os.path.join(tfjs_model_dir, 'model.json')):
        print(f"Error: model.json not found in {tfjs_model_dir}")
        return False
    
    try:
        import tensorflowjs as tfjs
        import tensorflow as tf
        
        print(f"Found TFJS model at: {tfjs_model_dir}")
        print(f"Converting TFJS model to Keras format...")
        print("This may take a few minutes...")
        
        # Convert TFJS model to Keras
        model = tfjs.converters.load_keras_model(tfjs_model_dir)
        
        # Save as .h5
        print(f"Saving Keras model to {output_path}...")
        model.save(output_path)
        
        print(f"✓ Successfully converted model to {output_path}")
        print("You can now use the pneumonia model in the Python service!")
        
        return True
        
    except ImportError:
        print("Error: tensorflowjs not installed")
        print("Install it with: pip install tensorflowjs")
        return False
    except Exception as e:
        print(f"Error during conversion: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = convert_tfjs_to_keras()
    sys.exit(0 if success else 1)

