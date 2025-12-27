# Quick Start: Using Malaria Detection on Mobile

## Fastest Way (Web Browser on Phone)

1. **On your computer, start both services:**

   ```bash
   # Terminal 1: Start Python service
   cd python-service
   python app.py
   ```

   ```bash
   # Terminal 2: Start Next.js app
   npm run dev
   ```

2. **Find your computer's IP address:**
   - Windows: Open CMD → `ipconfig` → Look for "IPv4 Address"
   - Mac/Linux: Open Terminal → `ifconfig` or `ip addr` → Look for local IP (usually 192.168.x.x)

3. **On your phone (same WiFi network):**
   - Open browser
   - Go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`
   - Navigate to Malaria Detection page
   - Upload blood smear image

## For Native Mobile Apps

### Step 1: Make Python service accessible

The service already runs on `0.0.0.0:5007` which allows network access. Just start it:

```bash
cd python-service
python app.py
```

### Step 2: Get your computer's IP

Same as above - find your local network IP address.

### Step 3: Call the API

**Endpoint:** `http://YOUR_IP:5007/predict`

**Method:** POST

**Body:** multipart/form-data with field `image` (file)

**Example using curl:**
```bash
curl -X POST http://192.168.1.100:5007/predict \
  -F "image=@/path/to/blood_smear.jpg"
```

**Response:**
```json
{
  "prediction": "Parasitized",
  "confidence": 0.95,
  "message": "Malaria parasites have been detected...",
  "recommendations": [
    "Seek immediate medical attention",
    "Get a proper laboratory test for confirmation"
  ]
}
```

## Troubleshooting

- **Can't connect?** Make sure phone and computer are on same WiFi
- **Service not found?** Check firewall allows port 5007
- **Model error?** Ensure `../lib/model/malaria_model1.h5` exists

For detailed mobile integration code examples, see `MOBILE_SETUP.md`.




