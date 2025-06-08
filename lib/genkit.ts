// This file is kept for compatibility but we're now using direct Gemini API calls
// as per the documentation requirements
import { genkit } from "genkit"
import { googleAI } from "@genkit-ai/googleai"

// Initialize Genkit with Google AI plugin
export const ai = genkit({
  plugins: [googleAI()],
})
