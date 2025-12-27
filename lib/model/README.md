# Model Integration Guide

## Malaria Detection Model

This directory contains:

- `malaria_model1.h5` - original Keras checkpoint (kept for archival purposes)
- `tfjs-malar-model/` - TensorFlow.js converted model used in production

### Inference Pipeline

1. Users upload blood smear images from the UI.
2. `app/api/malaria-predict/route.ts`:
   - Normalizes and resizes the image with `sharp` (RGB 224×224).
   - Loads the TFJS model via `lib/ai/malaria-model.ts`.
   - Runs inference using `@tensorflow/tfjs` on the server.
3. The API returns prediction metadata (label, confidence, guidance).

### Model Input Requirements

- **Image Size:** 224x224 pixels
- **Color Channels:** Grayscale or RGB (adjust preprocessing accordingly)
- **Normalization:** Pixel values should be normalized to [0, 1]

### Model Output Format

The model should return:
- Probability scores for each class (Parasitized, Uninfected)
- Or a binary classification result

### Updating the Model

1. Export a new TFJS model:
   ```python
   tfjs.converters.save_keras_model(model, 'lib/model/tfjs-malar-model')
   ```
2. Replace the contents of `lib/model/tfjs-malar-model/` with the new `model.json` and shard files.
3. Restart the Next.js server to reload the weights.

No additional code changes are required unless the model’s input size or output ordering changes.



