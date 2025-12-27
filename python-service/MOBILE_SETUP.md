# Using Python Malaria Detection Service on Mobile

This guide explains how to use the Python malaria detection service on your mobile phone.

## Option 1: Access Through Next.js Web App (Recommended)

The easiest way is to use the web app on your mobile browser, which connects to the Python service automatically.

### Setup Steps:

1. **Start the Python Service:**
   ```bash
   cd python-service
   python app.py
   ```
   The service will run on `http://localhost:5007`

2. **Start the Next.js App:**
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:3000`

3. **Access on Mobile:**
   - Find your computer's local IP address:
     - **Windows:** Open CMD and run `ipconfig`, look for "IPv4 Address"
     - **Mac/Linux:** Run `ifconfig` or `ip addr`, look for your local network IP
   - On your mobile phone (connected to same WiFi), open browser and go to:
     ```
     http://YOUR_COMPUTER_IP:3000
     ```
     Example: `http://192.168.1.100:3000`

4. **Use Malaria Detection:**
   - Navigate to the Malaria Detection page
   - Upload a blood smear image
   - The app will automatically send it to the Python service

## Option 2: Direct API Access from Mobile App

If you're building a native mobile app (Flutter, React Native, etc.), you can call the Python service directly.

### Make Python Service Accessible on Network:

1. **Update Flask to accept connections from any IP:**
   The service already runs on `0.0.0.0:5007`, which allows network access.

2. **Find your computer's IP address** (same as above)

3. **Call the API from mobile:**

   **Example (Flutter/Dart):**
   ```dart
   import 'package:http/http.dart' as http;
   import 'dart:io';

   Future<Map<String, dynamic>> predictMalaria(File imageFile) async {
     // Replace with your computer's IP address
     final url = Uri.parse('http://192.168.1.100:5007/predict');
     
     var request = http.MultipartRequest('POST', url);
     request.files.add(
       await http.MultipartFile.fromPath('image', imageFile.path)
     );
     
     var response = await request.send();
     var responseBody = await response.stream.bytesToString();
     
     return jsonDecode(responseBody);
   }
   ```

   **Example (React Native/JavaScript):**
   ```javascript
   const predictMalaria = async (imageUri) => {
     const formData = new FormData();
     formData.append('image', {
       uri: imageUri,
       type: 'image/jpeg',
       name: 'malaria_test.jpg',
     });

     const response = await fetch('http://192.168.1.100:5007/predict', {
       method: 'POST',
       body: formData,
       headers: {
         'Content-Type': 'multipart/form-data',
       },
     });

     return await response.json();
   };
   ```

   **Example (Android/Kotlin):**
   ```kotlin
   import okhttp3.*
   import okhttp3.MediaType.Companion.toMediaType
   import okhttp3.RequestBody.Companion.asRequestBody
   import java.io.File

   suspend fun predictMalaria(imageFile: File): String {
       val client = OkHttpClient()
       val requestBody = MultipartBody.Builder()
           .setType(MultipartBody.FORM)
           .addFormDataPart(
               "image",
               imageFile.name,
               imageFile.asRequestBody("image/*".toMediaType())
           )
           .build()

       val request = Request.Builder()
           .url("http://192.168.1.100:5007/predict")
           .post(requestBody)
           .build()

       val response = client.newCall(request).execute()
       return response.body?.string() ?: ""
   }
   ```

   **Example (iOS/Swift):**
   ```swift
   import Foundation

   func predictMalaria(imageData: Data, completion: @escaping (Result<[String: Any], Error>) -> Void) {
       let url = URL(string: "http://192.168.1.100:5007/predict")!
       var request = URLRequest(url: url)
       request.httpMethod = "POST"
       
       let boundary = UUID().uuidString
       request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
       
       var body = Data()
       body.append("--\(boundary)\r\n".data(using: .utf8)!)
       body.append("Content-Disposition: form-data; name=\"image\"; filename=\"image.jpg\"\r\n".data(using: .utf8)!)
       body.append("Content-Type: image/jpeg\r\n\r\n".data(using: .utf8)!)
       body.append(imageData)
       body.append("\r\n--\(boundary)--\r\n".data(using: .utf8)!)
       
       request.httpBody = body
       
       URLSession.shared.dataTask(with: request) { data, response, error in
           if let error = error {
               completion(.failure(error))
               return
           }
           guard let data = data,
                 let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
               completion(.failure(NSError(domain: "ParseError", code: -1)))
               return
           }
           completion(.success(json))
       }.resume()
   }
   ```

## Option 3: Deploy Python Service to Cloud

For production use, deploy the Python service to a cloud provider:

### Deploy to Heroku:
```bash
# Install Heroku CLI, then:
cd python-service
heroku create your-malaria-service
git init
git add .
git commit -m "Initial commit"
git push heroku main
```

### Deploy to Railway:
1. Create account at railway.app
2. Connect your GitHub repo
3. Set Python as runtime
4. Railway will auto-detect and deploy

### Deploy to DigitalOcean/AWS/GCP:
- Use Docker or directly deploy Flask app
- Update `PYTHON_SERVICE_URL` in Next.js to point to deployed URL

## API Response Format

The `/predict` endpoint returns:

```json
{
  "prediction": "Parasitized" | "Uninfected",
  "confidence": 0.95,
  "message": "Malaria parasites have been detected...",
  "recommendations": [
    "Seek immediate medical attention",
    "Get a proper laboratory test for confirmation",
    ...
  ]
}
```

## Health Check

Check if service is running:
```bash
curl http://YOUR_IP:5007/health
```

Response:
```json
{
  "status": "ready",
  "model": "malaria-detection"
}
```

## Troubleshooting

1. **Can't connect from mobile:**
   - Ensure mobile and computer are on same WiFi network
   - Check firewall settings (allow port 5007)
   - Verify IP address is correct

2. **Service not starting:**
   - Check if port 5007 is already in use
   - Ensure all dependencies are installed: `pip install -r requirements.txt`
   - Verify model file exists: `../lib/model/malaria_model1.h5`

3. **Model loading errors:**
   - Ensure TensorFlow is installed: `pip install tensorflow>=2.15.0`
   - Check model file path is correct

## Security Notes

⚠️ **Important:** The current setup allows any device on your network to access the service. For production:

1. Add authentication to the Flask service
2. Use HTTPS instead of HTTP
3. Implement rate limiting
4. Add input validation and sanitization

## Example: Adding Authentication

Update `python-service/app.py`:

```python
from functools import wraps
from flask import request, jsonify

API_KEY = os.environ.get('API_KEY', 'your-secret-key')

def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if api_key != API_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return decorated_function

@app.route('/predict', methods=['POST'])
@require_api_key
def predict():
    # ... existing code
```

Then include API key in mobile requests:
```dart
request.headers['X-API-Key'] = 'your-secret-key';
```




