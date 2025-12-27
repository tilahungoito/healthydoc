import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// Python service URL (update if running on different host/port)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5007';

interface PredictionResult {
  prediction: 'Pneumonia' | 'Normal';
  confidence: number;
  message: string;
  recommendations: string[];
}

export async function POST(request: NextRequest) {
  try {
    // First, check if pneumonia model is available
    try {
      const healthCheck = await fetch(`${PYTHON_SERVICE_URL}/health`);
      if (healthCheck.ok) {
        const healthData = await healthCheck.json();
        if (!healthData.pneumonia_model) {
          return NextResponse.json(
            { 
              error: 'Pneumonia model not available',
              message: 'The pneumonia model is not loaded in the Python service.',
              hint: healthData.pneumonia_model === false 
                ? 'Model conversion may have failed. Check Python service logs. Install tensorflowjs: pip install tensorflowjs, then restart the service.'
                : 'Please restart the Python service to trigger automatic model conversion.'
            },
            { status: 503 }
          );
        }
      }
    } catch (healthError) {
      // Health check failed, but continue anyway - might be a network issue
      console.warn('Health check failed, proceeding anyway:', healthError);
    }

    // Verify authentication (supports both Better Auth and Firebase)
    const authResult = await verifyAuth(request);
    
    const incomingFormData = await request.formData();
    const imageFile = incomingFormData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file.' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Forward image to Python service (primary method - uses actual model)
    const forwardFormData = new FormData();
    forwardFormData.append('image', imageFile);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(`${PYTHON_SERVICE_URL}/pneumonia-predict`, {
      method: 'POST',
      body: forwardFormData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to analyze image' }));
      
      // If model is not loaded, provide helpful error message
      if (response.status === 503) {
        return NextResponse.json(
          { 
            error: 'Pneumonia model not available',
            message: errorData.message || 'The pneumonia model is not loaded in the Python service.',
            hint: 'The Python service will automatically convert the TFJS model on startup. If this error persists, ensure tensorflowjs is installed: pip install tensorflowjs. Then restart the Python service: cd python-service && python app.py'
          },
          { status: 503 }
        );
      }
      
      throw new Error(errorData.error || `Python service error: ${response.statusText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in pneumonia prediction:', error);
    
    // Handle timeout or connection errors
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'Request timeout',
          message: 'The Python service took too long to respond. Please ensure the service is running and the model is loaded.',
          hint: 'Start the Python service: cd python-service && python app.py'
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Please ensure the Python service is running on port 5007 and the pneumonia model is loaded.'
      },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint to check service status
export async function GET() {
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        status: 'ready',
        service: 'python',
        ...data,
      });
    }
    throw new Error('Python service not responding');
  } catch (error) {
    return NextResponse.json(
      {
        status: 'not_available',
        message: 'Python pneumonia prediction service is not running.',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Start the Python service: cd python-service && python app.py. Ensure pneumonia_model.h5 exists in ../lib/model/',
      },
      { status: 503 }
    );
  }
}

