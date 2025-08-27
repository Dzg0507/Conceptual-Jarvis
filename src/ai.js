require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

/**
 * Converts a base64 encoded image to a FilePart.
 * @param {string} base64 - The base64 encoded image string.
 * @returns {object} The FilePart object for the Gemini API.
 */
function fileToGenerativePart(base64, mimeType) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

/**
 * Sends a prompt and an image to the Gemini API and returns the response.
 * @param {string} prompt - The user's text prompt.
 * @param {string} imageBase64 - The base64 encoded screenshot.
 * @returns {Promise<string>} The AI's text response.
 */
async function getAIResponse(prompt, imageBase64) {
  const imageParts = [fileToGenerativePart(imageBase64, 'image/png')];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = await result.response;
  const text = response.text();
  return text;
}

module.exports = { getAIResponse };
