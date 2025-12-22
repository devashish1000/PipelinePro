
import { GoogleGenAI, Type } from '@google/genai';
import { TranscriptionItem, AnalysisResult } from '../types';

export const analyzeSession = async (transcripts: TranscriptionItem[], duration: string): Promise<AnalysisResult> => {
  if (!transcripts || transcripts.length === 0) {
    throw new Error("Cannot analyze an empty conversation.");
  }

  // Ensure key is selected before continuing
  const hasKey = await (window as any).aistudio.hasSelectedApiKey();
  if (!hasKey) {
    await (window as any).aistudio.openSelectKey();
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Format transcript with clear speaker labels
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
    You are an expert sales performance coach for Wolters Kluwer (WK). 
    Your goal is to provide a high-level executive review of a Sales Representative's performance during a simulation.
    
    TRANSCRIPT DATA:
    ${conversationText}
    
    CRITICAL ROLE IDENTIFICATION:
    1. The Sales Representative is labeled as "USER". They are the one being coached.
    2. The Customer/Prospect is labeled as "MODEL". This is the AI.
    
    EVALUATION TASK:
    Analyze ONLY the performance of the Sales Representative (USER).
    Ignore the MODEL's performance, but use the MODEL's responses to judge how well the USER handled the conversation.
    
    Provide exactly ${criteriaCount} quantitative scores (0-100) for: ${specificCriteria}.
    Provide an overall score.
    
    In the feedback, provide 3 strengths and 3 growth areas. 
    Use DIRECT QUOTES from the USER messages as evidence for your feedback.
    
    If the transcript is too short or contains no USER responses, respond with 0 scores and explain why in the summary.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
    if (!text) throw new Error("AI failed to generate a response.");
    
    return JSON.parse(text) as AnalysisResult;
  } catch (err: any) {
    console.error("[AnalysisService] AI call failed:", err);
    if (err.message?.toLowerCase().includes("requested entity was not found")) {
       await (window as any).aistudio.openSelectKey();
    }
    throw err;
  }
};
