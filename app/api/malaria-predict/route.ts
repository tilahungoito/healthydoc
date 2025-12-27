import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';

// Python service URL (update if running on different host/port)
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5007';

interface PredictionResult {
  prediction: 'Parasitized' | 'Uninfected';
  confidence: number;
  message: string;
  recommendations: string[];
}


export async function POST(request: NextRequest) {
  try {
    // Verify authentication (supports both Better Auth and Firebase)
    // Note: This endpoint allows unauthenticated access, but you can require auth if needed
    const authResult = await verifyAuth(request);
    
    // Optional: Require authentication for malaria prediction
    // if (!authResult.userId) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }
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

    // Forward image to Python service
    const forwardFormData = new FormData();
    forwardFormData.append('image', imageFile);

    const response = await fetch(`${PYTHON_SERVICE_URL}/predict`, {
      method: 'POST',
      body: forwardFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Python service error: ${errorText}`);
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in malaria prediction:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
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
        message: 'Python malaria prediction service is not running.',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Start the Python service: cd python-service && python app.py',
      },
      { status: 503 }
    );
  }
}


