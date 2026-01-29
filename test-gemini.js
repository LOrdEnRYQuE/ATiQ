// Test script for Gemini API key
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use the environment variable
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyAboGZibSMu0wzpph98zeXczJgPh5BdXTs';

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // List available models
    console.log('Available models:');
    const models = await genAI.listModels();
    models.forEach(model => {
      console.log(`- ${model.name}: ${model.displayName}`);
    });
    
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

async function testGeminiAPI() {
  console.log('Testing Gemini API...');
  
  try {
    // Initialize the AI client
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Test with gemini-2.5-flash (latest model)
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
      }
    });
    
    console.log('Sending test request...');
    
    // Simple test prompt
    const result = await model.generateContent('Hello! Can you respond with "API key is working correctly"?');
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Success! Response:', text);
    return true;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('💡 The API key is invalid. Please check:');
      console.log('   1. You copied the correct key from AI Studio');
      console.log('   2. The key has no extra spaces or characters');
      console.log('   3. The key is properly set in your .env.local file');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.log('💡 Permission denied. Please check:');
      console.log('   1. The Gemini API is enabled for your project');
      console.log('   2. You have sufficient quota/credits');
    }
    
    return false;
  }
}

// First list models, then test
listModels().then(() => testGeminiAPI());
