# Python Medical Model Service

This is a Flask microservice that handles medical model inference for both **Malaria** and **Pneumonia** detection using Keras `.h5` model files.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd python-service
   pip install -r requirements.txt
   ```

2. **Convert Pneumonia Model (if needed):**
   
   The pneumonia model is currently in TensorFlow.js format. To use it in the Python service, convert it to Keras format:
   
   ```bash
   python convert_tfjs_to_keras.py
   ```
   
   This will convert `../lib/model/pnumoniaDetectorModel/` to `../lib/model/pneumonia_model.h5`
   
   **Note:** If you already have a `.h5` version of the pneumonia model, place it at `../lib/model/pneumonia_model.h5`

3. **Run the service:**
   ```bash
   python app.py
   ```

   The service will start on `http://localhost:5007`

## API Endpoints

### Health Check
- `GET /health` - Check service status and available models
  - Returns: `{ status, models: [], malaria_model: bool, pneumonia_model: bool }`

### Malaria Detection
- `POST /predict` - Malaria prediction (backward compatibility)
- `POST /malaria-predict` - Malaria detection endpoint
  - Form data: `image` (file)
  - Returns: `{ prediction, confidence, message, recommendations }`

### Pneumonia Detection
- `POST /pneumonia-predict` - Pneumonia detection endpoint
  - Form data: `image` (file)
  - Returns: `{ prediction, confidence, message, recommendations }`

## Model Files

The service expects model files at:
- **Malaria:** `../lib/model/malaria_model1.h5`
- **Pneumonia:** `../lib/model/pneumonia_model.h5` (converted from TFJS format)

## Integration with Next.js

The Next.js API routes automatically call this Python service:
- `app/api/malaria-predict/route.ts` → `/malaria-predict`
- `app/api/pneumonia-predict/route.ts` → `/pneumonia-predict`

## Troubleshooting

### Pneumonia Model Not Loading

If you see "Pneumonia model not loaded":
1. Ensure the TFJS model exists at `../lib/model/pnumoniaDetectorModel/`
2. Run the conversion script: `python convert_tfjs_to_keras.py`
3. Verify `../lib/model/pneumonia_model.h5` was created
4. Restart the Python service

### Model Output Format

The pneumonia model output format may vary. The service handles:
- Single sigmoid value (binary classification)
- Two-class output `[prob_normal, prob_pneumonia]` or `[prob_pneumonia, prob_normal]`

If predictions seem incorrect, check your model's output format and adjust the parsing logic in `predict_pneumonia()`.


