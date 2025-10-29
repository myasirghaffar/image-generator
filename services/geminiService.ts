import { GoogleGenAI, Chat, Modality, GenerateContentResponse } from "@google/genai";

const API_KEY = process.env.API_KEY;

// Initialize the AI client only if the API key is provided. This prevents the app from crashing on load.
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

/**
 * Checks if the Gemini API key is configured in the environment.
 * @returns {boolean} True if the API key is set, false otherwise.
 */
export const isApiKeyConfigured = (): boolean => !!ai;

/**
 * Ensures the GoogleGenAI instance is available before making an API call.
 * Throws a specific error if the API key is not configured.
 */
const ensureAi = () => {
  if (!ai) {
    throw new Error("Gemini API key not configured. Please set the API_KEY environment variable.");
  }
  return ai;
};

export const createChat = (): Chat => {
  const aiInstance = ensureAi();
  return aiInstance.chats.create({
    model: 'gemini-2.5-flash',
  });
};

export const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const processImageResponse = (response: GenerateContentResponse): string => {
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  
  if (response.promptFeedback?.blockReason) {
    let reason = `Request blocked due to ${response.promptFeedback.blockReason}.`;
    if (response.promptFeedback.blockReasonMessage) {
      reason += ` ${response.promptFeedback.blockReasonMessage}`;
    }
    throw new Error(reason);
  }

  const finishReason = response.candidates?.[0]?.finishReason;
  if (finishReason && finishReason !== 'STOP') {
    if (finishReason === 'NO_IMAGE') {
      const textResponse = response.text;
      if (textResponse) {
        throw new Error(`Model provided an explanation instead of an image: "${textResponse.trim()}"`);
      }
      throw new Error("The model was unable to generate an image for this prompt. Please try rephrasing your request.");
    }
    throw new Error(`Image generation stopped unexpectedly. Reason: ${finishReason}.`);
  }

  const textResponse = response.text;
  if (textResponse) {
    throw new Error(`Model returned a text explanation instead of an image: "${textResponse.trim()}"`);
  }
  
  throw new Error("No image data found in response. The model may have failed to generate an image for the given prompt.");
};

export const generateImage = async (prompt: string): Promise<string> => {
  const aiInstance = ensureAi();
  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  return processImageResponse(response);
};

export const editImage = async (prompt: string, image: File): Promise<string> => {
  const aiInstance = ensureAi();
  const imagePart = await fileToGenerativePart(image);

  const response = await aiInstance.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        imagePart,
        { text: prompt },
      ],
    },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });

  return processImageResponse(response);
};