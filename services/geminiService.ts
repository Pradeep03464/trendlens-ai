import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TrendAnalysisResult } from "../types";
import { ApiError, InvalidInputError, RateLimitError, ServerError } from "../utils/errors";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper for retrying API calls with exponential backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const callGeminiWithRetry = async <T>(apiCall: () => Promise<T>, onRetry?: (attempt: number) => void): Promise<T> => {
  const MAX_RETRIES = 3; // Initial call + 2 retries
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await apiCall();
    } catch (e) {
      lastError = e as Error;
      const errorMessage = lastError.message?.toLowerCase() || '';
      
      const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('resource_exhausted');
      const isServerError = errorMessage.includes('500') || errorMessage.includes('503') || errorMessage.includes('service unavailable');
      const isInvalidInputError = errorMessage.includes('400') || errorMessage.includes('invalid argument');

      // Do not retry on bad requests (e.g., invalid image format)
      if (isInvalidInputError) {
        throw new InvalidInputError('There was an issue with one of the uploaded images. Please try using a different, clear image in a common format (PNG, JPG, WEBP).');
      }

      if ((isRateLimitError || isServerError) && attempt < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s
          onRetry?.(attempt); // Update UI before waiting
          console.warn(`Retriable error detected. Retrying in ${delay / 1000}s... (Attempt ${attempt}/${MAX_RETRIES - 1})`);
          await sleep(delay);
          continue; // Continue to the next attempt
      }
      
      // After max retries or for non-retriable errors, throw a specific error type
      if (isRateLimitError) throw new RateLimitError();
      if (isServerError) throw new ServerError();
      
      // Fallback for other errors
      throw new ApiError(lastError.message);
    }
  }
  // This line should be unreachable due to the throws inside the loop
  throw lastError || new ApiError('An unknown error occurred after multiple retries.');
};

// Helper function to create an image part for the API
const createImagePart = (imageData: string) => {
    const { mimeType, data } = JSON.parse(imageData);
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

export const generateStyledImage = async (
    modelImage: string,
    clothingImage: string,
    onRetry?: (attempt: number) => void
): Promise<string> => {
    return callGeminiWithRetry(async () => {
        const modelImagePart = createImagePart(modelImage);
        const clothingImagePart = createImagePart(clothingImage);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    modelImagePart,
                    clothingImagePart,
                    {
                        text: 'As an expert fashion photoshoot art director, generate a new, photorealistic image of the model from the first image wearing the clothing item from the second image. The final output should be a high-quality, professional-looking photo suitable for an e-commerce website or a fashion lookbook. Position the model in a natural pose. The background should be a clean, minimalist studio setting (e.g., light gray, off-white) to emphasize the outfit. Pay close attention to realistic details: ensure the clothing drapes and fits the model\'s body naturally, the lighting is soft and flattering (like from a large softbox), and the textures of the fabric are accurately rendered. The final image should ONLY contain the styled model and the background, with no extra text or artifacts.',
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart?.inlineData) {
            return JSON.stringify({
                mimeType: firstPart.inlineData.mimeType,
                data: firstPart.inlineData.data
            });
        }

        throw new Error('Could not generate styled image. The API did not return an image.');
    }, onRetry);
};

export const analyzeTrend = async (
    generatedImage: string,
    onRetry?: (attempt: number) => void
): Promise<TrendAnalysisResult> => {
    return callGeminiWithRetry(async () => {
        const imagePart = createImagePart(generatedImage);

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: {
                parts: [
                    imagePart,
                    {
                        text: 'You are a professional fashion trend forecaster. Analyze this image. Based on current global fashion trends (e.g., color palettes, silhouettes, fabrics, Y2K revival, minimalist aesthetics, streetwear influences), provide a trend score from 0 to 100. Also, provide a brief, insightful analysis (2-3 sentences) explaining the score. Highlight trendy elements and suggest potential improvements for marketability.',
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: {
                            type: Type.INTEGER,
                            description: 'The trend score from 0 to 100.',
                        },
                        analysis: {
                            type: Type.STRING,
                            description: 'A brief analysis of the fashion trend.',
                        },
                    },
                    required: ['score', 'analysis'],
                },
            },
        });

        try {
            const jsonText = response.text.trim();
            const result = JSON.parse(jsonText) as TrendAnalysisResult;
            return result;
        } catch (e) {
            console.error("Failed to parse JSON response:", response.text);
            throw new Error("Failed to analyze trend. The API returned an invalid format.");
        }
    }, onRetry);
};