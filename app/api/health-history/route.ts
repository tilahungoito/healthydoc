import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { PrismaClient } from '@/lib/generated/prisma/client';
import { AIClient } from '@/lib/ai/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

interface HealthRecord {
  id: string;
  symptoms: string;
  userInput: string;
  aiResult: any;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication (supports both Better Auth for web and Firebase for mobile)
    const authResult = await verifyAuth(request);

    if (!authResult.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to view your health history' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;

    // Fetch user's health records ordered by date (most recent first)
    const healthRecords = await prisma.healthRecord.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 records for analysis
    });

    if (healthRecords.length === 0) {
      return NextResponse.json({
        records: [],
        analysis: {
          summary: "You don't have any health records yet. Start by analyzing your symptoms to build your health history.",
          patterns: [],
          timeline: [],
          insights: [],
          recommendations: [],
        },
      });
    }

    // Prepare data for AI analysis
    const recordsForAnalysis = healthRecords.map((record) => ({
      date: record.createdAt.toISOString(),
      symptoms: record.symptoms,
      userInput: record.userInput,
      aiResult: record.aiResult,
    }));

    // Generate RAG-style analysis using AI
    const aiClient = new AIClient();
    const analysisPrompt = `Analyze the following health history records and provide comprehensive insights:

${JSON.stringify(recordsForAnalysis, null, 2)}

Please analyze this health history and provide:
1. A brief summary of the health journey
2. Patterns you notice (e.g., recurring symptoms, progression over time)
3. Timeline of key health events
4. Insights about potential connections between different health inquiries
5. Recommendations based on the patterns observed

Format your response as JSON with this structure:
{
  "summary": "Brief overview of the health journey",
  "patterns": [
    {
      "type": "recurring_symptoms" | "progression" | "seasonal" | "chronological",
      "description": "Description of the pattern",
      "examples": ["example 1", "example 2"]
    }
  ],
  "timeline": [
    {
      "period": "Date range or time period",
      "events": "What happened during this period",
      "symptoms": ["symptom 1", "symptom 2"]
    }
  ],
  "insights": [
    {
      "title": "Insight title",
      "description": "Detailed insight about connections or patterns",
      "evidence": "Evidence from the records supporting this insight"
    }
  ],
  "recommendations": [
    {
      "category": "monitoring" | "prevention" | "lifestyle" | "medical_attention",
      "priority": "high" | "medium" | "low",
      "recommendation": "Specific recommendation",
      "reasoning": "Why this recommendation is relevant"
    }
  ]
}`;

    let analysis;
    try {
      const aiResponse = await aiClient.generateResponse(analysisPrompt);
      
      // Try to parse JSON from AI response
      const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) || 
                        aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        // Fallback: create a structured response from the text
        analysis = {
          summary: aiResponse.substring(0, 200) + '...',
          patterns: [],
          timeline: [],
          insights: [{ title: 'Analysis', description: aiResponse }],
          recommendations: [],
        };
      }
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      // Fallback analysis based on simple patterns
      analysis = generateFallbackAnalysis(healthRecords);
    }

    return NextResponse.json({
      records: healthRecords.map((record) => ({
        id: record.id,
        symptoms: record.symptoms,
        userInput: record.userInput,
        createdAt: record.createdAt.toISOString(),
        aiResult: record.aiResult,
      })),
      analysis,
      stats: {
        totalRecords: healthRecords.length,
        oldestRecord: healthRecords[healthRecords.length - 1]?.createdAt.toISOString(),
        newestRecord: healthRecords[0]?.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching health history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health history' },
      { status: 500 }
    );
  }
}

function generateFallbackAnalysis(records: HealthRecord[]) {
  // Extract common symptoms
  const symptomCounts: Record<string, number> = {};
  records.forEach((record) => {
    const symptoms = record.symptoms.toLowerCase().split(/[,\s]+/);
    symptoms.forEach((symptom) => {
      if (symptom.length > 2) {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      }
    });
  });

  const commonSymptoms = Object.entries(symptomCounts)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([symptom]) => symptom);

  const daysBetween = records.length > 1
    ? Math.round(
        (new Date(records[0].createdAt).getTime() -
          new Date(records[records.length - 1].createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return {
    summary: `You have ${records.length} health records spanning ${daysBetween} days. ${
      commonSymptoms.length > 0
        ? `Common symptoms include: ${commonSymptoms.join(', ')}.`
        : 'Your symptoms appear to be varied.'
    }`,
    patterns: commonSymptoms.length > 0
      ? [
          {
            type: 'recurring_symptoms',
            description: `These symptoms have appeared multiple times: ${commonSymptoms.join(', ')}`,
            examples: commonSymptoms,
          },
        ]
      : [],
    timeline: records.length > 0
      ? [
          {
            period: `${records[records.length - 1].createdAt.toLocaleDateString()} to ${records[0].createdAt.toLocaleDateString()}`,
            events: `${records.length} health inquiries recorded`,
            symptoms: commonSymptoms,
          },
        ]
      : [],
    insights: [
      {
        title: 'Health Monitoring',
        description: `You've been tracking ${records.length} health inquiry${records.length > 1 ? 'ies' : 'y'} over time. ${
          commonSymptoms.length > 0
            ? `Some symptoms like ${commonSymptoms[0]} have appeared multiple times, which may warrant closer monitoring.`
            : 'Your health inquiries cover a variety of symptoms.'
        }`,
        evidence: `${records.length} records analyzed`,
      },
    ],
    recommendations: [
      {
        category: 'monitoring',
        priority: 'medium',
        recommendation: 'Continue tracking your symptoms and note any patterns or changes over time.',
        reasoning: 'Regular tracking helps identify trends and potential health concerns early.',
      },
    ],
  };
}

