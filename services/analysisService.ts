
import { GoogleGenAI, Type } from '@google/genai';
import { TranscriptionItem, AnalysisResult } from '../types';

export const analyzeSession = async (transcripts: TranscriptionItem[], duration: string): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const conversationText = transcripts
    .map(t => `${t.speaker.toUpperCase()}: ${t.text}`)
    .join('\n');

  let criteriaCount = 4;
  let specificCriteria = "Clarity, Empathy, Objection Handling, Product Knowledge";
  
  if (duration === '5 MIN') {
    criteriaCount = 4;
    specificCriteria = "Time Management, Efficiency, Core Qualification, Conciseness";
  } else if (duration === '10 MIN') {
    criteriaCount = 7;
    specificCriteria = "Listening, Discovery Skills, Pain Point Identification, Qualification, Objection Handling, Empathy, Product Knowledge";
  } else if (duration === '15 MIN') {
    criteriaCount = 10;
    specificCriteria = "Strategic Thinking, Business Acumen, Relationship Building, Full Discovery, Value Messaging, Competitor Differentiation, ROI Expectation Management, Active Listening, Objection Depth, Relationship Development";
  } else {
    criteriaCount = 10;
    specificCriteria = "Comprehensive Assessment across all Sales dimensions";
  }

  const prompt = `
    You are an expert sales coach for Wolters Kluwer (WK). WK sells high-end Legal, Tax, and Compliance solutions.
    Analyze the following negotiation/sales roleplay transcript for a call with duration: ${duration}.
    
    Provide exactly ${criteriaCount} quantitative scores (0-100) for the following criteria: ${specificCriteria}.
    Also provide an overall score.
    
    TRANSCRIPT:
    ${conversationText}
    
    Feedback should include relevant quotes from the transcript.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: {
            type: Type.OBJECT,
            properties: {
              overall: { type: Type.NUMBER },
              breakdown: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                  },
                  required: ['label', 'score']
                }
              }
            },
            required: ['overall', 'breakdown']
          },
          feedback: {
            type: Type.OBJECT,
            properties: {
              strengths: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    point: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  },
                  required: ['point']
                } 
              },
              improvements: { 
                type: Type.ARRAY, 
                items: { 
                  type: Type.OBJECT,
                  properties: {
                    point: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  },
                  required: ['point']
                } 
              },
              summary: { type: Type.STRING }
            },
            required: ['strengths', 'improvements', 'summary']
          }
        },
        required: ['scores', 'feedback']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No analysis generated");
  
  return JSON.parse(text) as AnalysisResult;
};
