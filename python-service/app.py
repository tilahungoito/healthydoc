from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
import os

app = Flask(__name__)
CORS(app)

# Get the base directory (parent of python-service)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'lib', 'model')

print(f"Base directory: {BASE_DIR}")
print(f"Model directory: {MODEL_DIR}")

# Load models once at startup
malaria_model = None
pneumonia_model = None

# Load Malaria Model
try:
    malaria_model_path = os.path.join(MODEL_DIR, 'malaria_model1.h5')
    if os.path.exists(malaria_model_path):
        print(f"Loading malaria model from {malaria_model_path}...")
        malaria_model = tf.keras.models.load_model(malaria_model_path)
        print("✓ Malaria model loaded successfully!")
    else:
        print(f"Warning: Malaria model not found at {malaria_model_path}")
except Exception as e:
    print(f"Error loading malaria model: {str(e)}")
    import traceback
    traceback.print_exc()

# Load Pneumonia Model
try:
    # Try to load .h5 version - check both best_model.h5 and pneumonia_model.h5
    pneumonia_model_paths = [
        os.path.join(MODEL_DIR, 'best_model.h5'),        # Primary: best_model.h5 (pneumonia model)
        os.path.join(MODEL_DIR, 'pneumonia_model.h5'),   # Fallback: pneumonia_model.h5
    ]
    
    pneumonia_model_loaded = False
    pneumonia_h5_path = None
    
    for model_path in pneumonia_model_paths:
        if os.path.exists(model_path):
            pneumonia_h5_path = model_path
            print(f"Loading pneumonia model from {pneumonia_h5_path}...")
            try:
                pneumonia_model = tf.keras.models.load_model(pneumonia_h5_path)
                print("✓ Pneumonia model loaded successfully!")
                pneumonia_model_loaded = True
                break
            except Exception as load_error:
                print(f"Error loading model from {pneumonia_h5_path}: {str(load_error)}")
                import traceback
                traceback.print_exc()
                continue
    
    if not pneumonia_model_loaded:
        # Check if TFJS model exists and try to convert it automatically
        tfjs_model_paths = [
            os.path.join(MODEL_DIR, 'tfjspnumoniaDetectorModel'),  # Actual folder name
            os.path.join(MODEL_DIR, 'pnumoniaDetectorModel'),      # Alternative name
        ]
        
        tfjs_model_found = None
        for tfjs_path in tfjs_model_paths:
            model_json_path = os.path.join(tfjs_path, 'model.json')
            if os.path.exists(tfjs_path) and os.path.exists(model_json_path):
                tfjs_model_found = tfjs_path
                print(f"Found TFJS model at: {tfjs_model_found}")
                break
        
        if tfjs_model_found:
            print(f"⚠ Pneumonia TFJS model found at {tfjs_model_found}")
            print("   Attempting automatic conversion to .h5 format...")
            
            try:
                # Try to import tensorflowjs for conversion
                import tensorflowjs as tfjs
                
                # Use best_model.h5 as output (primary pneumonia model name)
                output_path = os.path.join(MODEL_DIR, 'best_model.h5')
                # Ensure output directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                print("   Converting TFJS model to Keras format (this may take a few minutes)...")
                print(f"   Source: {tfjs_model_found}")
                print(f"   Target: {output_path}")
                
                model = tfjs.converters.load_keras_model(tfjs_model_found)
                
                print(f"   Saving converted model to {output_path}...")
                model.save(output_path)
                
                print("   ✓ Conversion successful! Loading converted model...")
                pneumonia_model = tf.keras.models.load_model(output_path)
                print("✓ Pneumonia model loaded successfully after conversion!")
                pneumonia_model_loaded = True
                
            except ImportError as import_err:
                print("   ❌ tensorflowjs not installed. Cannot auto-convert.")
                print(f"   Error: {str(import_err)}")
                print("   Install it with: pip install tensorflowjs")
                print("   Or run manually: cd python-service && python convert_tfjs_to_keras.py")
            except Exception as conv_error:
                print(f"   ❌ Auto-conversion failed: {str(conv_error)}")
                print(f"   Error type: {type(conv_error).__name__}")
                import traceback
                traceback.print_exc()
                print("   Please run manually: cd python-service && python convert_tfjs_to_keras.py")
        
        if not pneumonia_model_loaded:
            print(f"\n{'='*60}")
            print(f"⚠ PNEUMONIA MODEL NOT AVAILABLE")
            print(f"{'='*60}")
            print(f"Checked model files:")
            for path in pneumonia_model_paths:
                exists = os.path.exists(path)
                print(f"  - {path}: {'✓ EXISTS' if exists else '✗ NOT FOUND'}")
            
            if tfjs_model_found:
                print(f"\n✓ TFJS model found at: {tfjs_model_found}")
                print(f"  Model JSON exists: {os.path.exists(os.path.join(tfjs_model_found, 'model.json'))}")
                print("\n❌ Conversion failed or tensorflowjs is not installed.")
                print("\nTo fix:")
                print("  1. Install tensorflowjs: pip install tensorflowjs")
                print("  2. Restart this Python service")
                print("  OR manually convert:")
                print(f"     cd python-service")
                print(f"     python convert_tfjs_to_keras.py")
            else:
                print(f"\n❌ No TFJS model found.")
                print(f"Searched in: {MODEL_DIR}")
                print(f"Checked paths:")
                for path in tfjs_model_paths:
                    exists = os.path.exists(path)
                    print(f"  - {path}: {'✓ EXISTS' if exists else '✗ NOT FOUND'}")
            print(f"{'='*60}\n")
except Exception as e:
    print(f"❌ Error loading pneumonia model: {str(e)}")
    import traceback
    traceback.print_exc()

IMAGE_SIZE = 224
CHANNELS = 3

def preprocess_image(image_bytes, enhance_contrast=True):
    """Preprocess image for model input with enhanced handling for medical images"""
    # Open image
    img = Image.open(io.BytesIO(image_bytes))
    
    # Convert to grayscale first (medical X-rays are typically grayscale)
    if img.mode != 'L':
        img = img.convert('L')
    
    # Convert to numpy array for processing
    img_array = np.array(img, dtype=np.float32)
    
    # Apply contrast enhancement for medical images
    if enhance_contrast:
        # Histogram equalization-like enhancement
        # Normalize to 0-255 range first
        if img_array.max() > 255:
            img_array = (img_array - img_array.min()) / (img_array.max() - img_array.min() + 1e-7) * 255
        
        # Apply CLAHE-like contrast enhancement (simplified)
        # Clip extreme values (remove outliers)
        p2, p98 = np.percentile(img_array, (2, 98))
        img_array = np.clip(img_array, p2, p98)
        
        # Normalize to 0-255
        if img_array.max() > img_array.min():
            img_array = (img_array - img_array.min()) / (img_array.max() - img_array.min()) * 255
    
    # Convert back to PIL Image for resizing
    img = Image.fromarray(img_array.astype(np.uint8))
    
    # Resize to model input size with high-quality resampling
    img = img.resize((IMAGE_SIZE, IMAGE_SIZE), Image.Resampling.LANCZOS)
    
    # Convert to RGB (3 channels) as model expects
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Convert to numpy array and normalize to [0, 1]
    img_array = np.array(img, dtype=np.float32) / 255.0
    
    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)
    
    return img_array

def preprocess_image_pneumonia(image_bytes):
    """Specialized preprocessing for pneumonia detection - handles hospital X-rays better"""
    return preprocess_image(image_bytes, enhance_contrast=True)

@app.route('/health', methods=['GET'])
def health():
    models_available = []
    if malaria_model is not None:
        models_available.append('malaria-detection')
    if pneumonia_model is not None:
        models_available.append('pneumonia-detection')
    
    return jsonify({
        'status': 'ready',
        'models': models_available,
        'malaria_model': malaria_model is not None,
        'pneumonia_model': pneumonia_model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Malaria prediction endpoint (backward compatibility)"""
    return predict_malaria()

@app.route('/malaria-predict', methods=['POST'])
def predict_malaria():
    """Malaria detection endpoint"""
    try:
        if malaria_model is None:
            return jsonify({'error': 'Malaria model not loaded'}), 503
        
        # Get image from form data
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['image']
        image_bytes = image_file.read()
        
        # Preprocess image
        preprocessed = preprocess_image(image_bytes)
        
        # Run prediction
        prediction = malaria_model.predict(preprocessed, verbose=0)[0]
        
        # Model outputs single value (sigmoid), so: 
        # - prediction[0] is probability of parasitized
        # - 1 - prediction[0] is probability of uninfected
        parasitized_prob = float(prediction[0])
        uninfected_prob = float(1 - prediction[0])
        
        # Determine result
        is_parasitized = parasitized_prob >= 0.5
        confidence = parasitized_prob if is_parasitized else uninfected_prob
        
        result = {
            'prediction': 'Parasitized' if is_parasitized else 'Uninfected',
            'confidence': confidence,
            'message': (
                'Malaria parasites have been detected in the blood smear image. Please consult with a healthcare professional immediately for proper diagnosis and treatment.'
                if is_parasitized
                else 'No malaria parasites detected in the blood smear image. The sample appears to be uninfected. However, this is a preliminary analysis and should be confirmed by a medical professional.'
            ),
            'recommendations': (
                [
                    'Seek immediate medical attention',
                    'Get a proper laboratory test for confirmation',
                    "Follow your healthcare provider's treatment recommendations",
                    'Monitor symptoms closely',
                    'Complete the full course of treatment if prescribed',
                ]
                if is_parasitized
                else [
                    'Continue regular health monitoring',
                    'If experiencing symptoms, consult a healthcare professional',
                    'Consider preventive measures if in a malaria-endemic area',
                    'Keep the image for medical records',
                ]
            ),
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in malaria prediction: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/pneumonia-predict', methods=['POST'])
def predict_pneumonia():
    """Pneumonia detection endpoint"""
    try:
        if pneumonia_model is None:
            return jsonify({
                'error': 'Pneumonia model not loaded',
                'message': 'Please ensure pneumonia_model.h5 exists in ../lib/model/ directory'
            }), 503
        
        # Get image from form data
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
        
        image_file = request.files['image']
        image_bytes = image_file.read()
        
        # Preprocess image with enhanced preprocessing for medical X-rays
        preprocessed = preprocess_image_pneumonia(image_bytes)
        
        # Debug: Print image statistics
        print(f"DEBUG: Preprocessed image shape: {preprocessed.shape}")
        print(f"DEBUG: Preprocessed image min: {preprocessed.min():.4f}, max: {preprocessed.max():.4f}, mean: {preprocessed.mean():.4f}")
        
        # Run prediction
        prediction = pneumonia_model.predict(preprocessed, verbose=0)[0]
        
        # Debug: Print raw prediction output
        print(f"DEBUG: Raw prediction shape: {prediction.shape}")
        print(f"DEBUG: Raw prediction values: {prediction}")
        print(f"DEBUG: Prediction type: {type(prediction)}")
        
        # Model output format may vary - adjust based on your model
        # Common formats:
        # 1. Binary classification: [prob_normal, prob_pneumonia] (most common for pneumonia models)
        # 2. Single sigmoid value (pneumonia probability)
        # 3. [prob_pneumonia, prob_normal] (less common)
        
        # Try to handle different output formats
        if len(prediction.shape) == 0:
            # Single value (sigmoid output) - value is pneumonia probability
            pneumonia_prob = float(prediction)
            normal_prob = 1.0 - pneumonia_prob
            print(f"DEBUG: Single value output - Pneumonia prob: {pneumonia_prob}, Normal prob: {normal_prob}")
        elif len(prediction) == 2:
            # Two-class output - Most pneumonia models use [normal_prob, pneumonia_prob]
            # Check which index has higher value to determine format
            if prediction[0] > prediction[1]:
                # Likely [pneumonia_prob, normal_prob] - first is pneumonia
                pneumonia_prob = float(prediction[0])
                normal_prob = float(prediction[1])
                print(f"DEBUG: Format [pneumonia, normal] - Pneumonia: {pneumonia_prob}, Normal: {normal_prob}")
            else:
                # Likely [normal_prob, pneumonia_prob] - second is pneumonia (most common)
                normal_prob = float(prediction[0])
                pneumonia_prob = float(prediction[1])
                print(f"DEBUG: Format [normal, pneumonia] - Normal: {normal_prob}, Pneumonia: {pneumonia_prob}")
        else:
            # Default: use first value as pneumonia probability
            pneumonia_prob = float(prediction[0])
            normal_prob = 1.0 - pneumonia_prob
            print(f"DEBUG: Default format - Pneumonia prob: {pneumonia_prob}, Normal prob: {normal_prob}")
        
        # Determine result with adaptive threshold
        # Use slightly higher threshold to reduce false positives on hospital images
        # This helps when model was trained on Kaggle data but tested on hospital images
        threshold = 0.6  # Increased from 0.5 to reduce false positives
        has_pneumonia = pneumonia_prob >= threshold
        confidence = pneumonia_prob if has_pneumonia else normal_prob
        
        # Also check if probabilities are too close (uncertain prediction)
        prob_diff = abs(pneumonia_prob - normal_prob)
        is_uncertain = prob_diff < 0.1  # Less than 10% difference = uncertain
        
        print(f"DEBUG: Final decision - Has Pneumonia: {has_pneumonia}, Confidence: {confidence:.4f}")
        print(f"DEBUG: Probability difference: {prob_diff:.4f}, Uncertain: {is_uncertain}")
        
        if is_uncertain:
            print(f"DEBUG: WARNING - Uncertain prediction (probabilities too close)")
        
        # If uncertain, be more conservative
        if is_uncertain and has_pneumonia:
            # If uncertain but leaning towards pneumonia, mark as uncertain
            prediction_label = 'Uncertain - Recommend professional review'
            confidence = 0.5  # Neutral confidence for uncertain cases
        else:
            prediction_label = 'Pneumonia' if has_pneumonia else 'Normal'
        
        result = {
            'prediction': prediction_label,
            'confidence': round(confidence, 4),
            'probabilities': {
                'pneumonia': round(pneumonia_prob, 4),
                'normal': round(normal_prob, 4)
            },
            'uncertain': is_uncertain,
            'threshold_used': threshold,
            'raw_prediction': prediction.tolist() if hasattr(prediction, 'tolist') else str(prediction),
            'message': (
                'Uncertain prediction - The model probabilities are very close, indicating low confidence. Please have this X-ray reviewed by a licensed radiologist for accurate diagnosis.'
                if is_uncertain
                else (
                    'Pneumonia-like patterns have been detected in the chest X-ray image. Please consult with a healthcare professional immediately for proper diagnosis and treatment. This is a preliminary analysis and should be confirmed by a licensed radiologist.'
                    if has_pneumonia
                    else 'No obvious signs of pneumonia detected in the chest X-ray image. The X-ray appears normal. However, this is a preliminary analysis and should be confirmed by a licensed radiologist for accurate diagnosis.'
                )
            ),
            'recommendations': (
                [
                    'Seek immediate medical attention',
                    'Consult with a pulmonologist or radiologist for proper diagnosis',
                    "Follow your healthcare provider's treatment recommendations",
                    'Monitor respiratory symptoms closely',
                    'Complete the full course of treatment if prescribed',
                    'Get follow-up X-rays as recommended by your doctor',
                ]
                if has_pneumonia
                else [
                    'Continue regular health monitoring',
                    'If experiencing respiratory symptoms, consult a healthcare professional',
                    'Consider preventive measures during flu season',
                    'Keep the X-ray for medical records',
                    'Follow up with your healthcare provider if symptoms persist',
                ]
            ),
        }
        
        return jsonify(result)
        
    except Exception as e:
        print(f"Error in pneumonia prediction: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Flask server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5007, debug=False)


