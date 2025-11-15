import { AIClient } from './client';
import { HealthAnalysis, UserProfile, Symptom, Condition } from '@/types';
import { getSymptomsDatabase } from '@/lib/data/loader';

export class HealthAnalyzer {
  private aiClient: AIClient;
  private symptomsDatabase: any;

  constructor() {
    this.aiClient = new AIClient();
    this.loadSymptomsDatabase();
  }

  private loadSymptomsDatabase() {
    const data = getSymptomsDatabase();
    this.symptomsDatabase = data || {
      symptoms: [],
      conditions: [],
      urgency_indicators: { high: [], medium: [], low: [] },
    };
  }

  async analyzeUserInput(
    userInput: string,
    additionalContext?: UserProfile,
    language: string = 'en'
  ): Promise<HealthAnalysis> {
    try {
      const symptoms = this.extractSymptoms(userInput);
      const analysis = await this.aiClient.analyzeSymptoms(
        symptoms,
        userInput,
        language
      );

      const enhancedAnalysis = this.enhanceAnalysis(analysis, symptoms);

      return {
        ...enhancedAnalysis,
        timestamp: new Date().toISOString(),
        user_input: userInput,
        extracted_symptoms: symptoms,
        additional_context: additionalContext,
      };
    } catch (error) {
      console.error('Error analyzing user input:', error);
      return {
        urgency_level: 'medium',
        possible_conditions: [],
        recommended_actions: ['Consult a healthcare professional'],
        general_advice: 'Unable to analyze your symptoms at this time. Please try again or consult a healthcare professional.',
        disclaimer: 'Please consult a healthcare professional for proper diagnosis',
        timestamp: new Date().toISOString(),
        user_input: userInput,
        extracted_symptoms: [],
        additional_context: additionalContext,
      };
    }
  }

  private extractSymptoms(userInput: string): string[] {
    const symptoms: string[] = [];
    const userInputLower = userInput.toLowerCase();

    const symptomsList = this.symptomsDatabase?.symptoms || [];
    for (const symptomData of symptomsList) {
      const symptomName = symptomData.name.replace(/_/g, ' ');
      if (userInputLower.includes(symptomName)) {
        symptoms.push(symptomData.name);
      }
    }

    return symptoms;
  }

  private enhanceAnalysis(
    aiAnalysis: HealthAnalysis,
    symptoms: string[]
  ): HealthAnalysis {
    const possibleConditions: Condition[] = [];
    const conditionsList = this.symptomsDatabase?.conditions || [];

    for (const conditionData of conditionsList) {
      const conditionSymptoms = conditionData.symptoms || [];
      const matchingSymptoms = conditionSymptoms.filter((s) =>
        symptoms.includes(s)
      );

      if (matchingSymptoms.length >= 2) {
        const confidence = matchingSymptoms.length / conditionSymptoms.length;
        possibleConditions.push({
          name: conditionData.name,
          confidence,
          matching_symptoms: matchingSymptoms,
          severity: conditionData.severity as any,
        });
      }
    }

    possibleConditions.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    return {
      ...aiAnalysis,
      possible_conditions: [
        ...(aiAnalysis.possible_conditions || []),
        ...possibleConditions.slice(0, 3),
      ],
    };
  }

  getUrgencyLevel(analysis: HealthAnalysis): 'low' | 'medium' | 'high' {
    const urgencyIndicators = this.symptomsDatabase?.urgency_indicators || {
      high: [],
      medium: [],
      low: [],
    };
    const symptoms = analysis.extracted_symptoms || [];

    const symptomString = symptoms.join(' ').toLowerCase();

    for (const [level, indicators] of Object.entries(urgencyIndicators)) {
      const indicatorList = Array.isArray(indicators) ? indicators : [];
      if (indicatorList.some((indicator: string) => symptomString.includes(indicator))) {
        return level as 'low' | 'medium' | 'high';
      }
    }

    return analysis.urgency_level || 'medium';
  }
}

