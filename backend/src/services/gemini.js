import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini API client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Gemini API client:', error);
  }
} else {
  console.warn('GEMINI_API_KEY is not defined. Using AI mock service fallback.');
}

/**
 * Helper to query Gemini with automatic model failover/fallback.
 * If gemini-1.5-flash returns a 503 (spikes in demand) or 404, it immediately retries using gemini-1.5-pro.
 */
async function generateContentWithFallback(prompt) {
  if (!genAI) throw new Error('Gemini API client not initialized');
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Querying Gemini model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      console.log(`✓ Successful response from ${modelName}`);
      return text;
    } catch (error) {
      console.warn(`⚠ Model ${modelName} failed:`, error.message || error);
      lastError = error;
    }
  }
  throw lastError || new Error('All generative models failed');
}

/**
 * AI Feature 1: Emergency Priority Detection
 * Classifies blood requests as Normal, High, or Critical.
 */
async function classifyEmergency(description) {
  if (!genAI) {
    return mockClassifyEmergency(description);
  }

  try {
    const prompt = `
      You are an emergency medical triage AI. Analyze this blood request description and determine the urgency of blood need.
      Description: "${description}"

      Classify into one of three priority levels: "Normal", "High", or "Critical".
      Assign an emergency score between 0 and 100.
      Provide a brief, single-sentence medical reason for your decision.

      Your response MUST be a valid JSON object with the following exact keys:
      {
        "priority": "Normal" | "High" | "Critical",
        "score": number,
        "reason": "string explaining the medical necessity"
      }
      Do not include any markdown formatting wrappers (like \`\`\`json) or extra text. Just return the raw JSON object.
    `;

    const text = await generateContentWithFallback(prompt);
    
    // Clean potential markdown tags from LLM response
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini classifyEmergency error:', error);
    return mockClassifyEmergency(description);
  }
}

/**
 * AI Feature 2: Smart Request Generator
 * Formulates professional appeal text for donors.
 */
async function generateSmartRequest(bloodGroup, units, emergencyLevel, details) {
  if (!genAI) {
    return mockGenerateSmartRequest(bloodGroup, units, emergencyLevel, details);
  }

  try {
    const prompt = `
      You are a professional outreach coordinator for a blood donor platform.
      Write an engaging, clear, and urgent (if emergency requires) social/app message requesting blood donors.
      
      Details:
      - Blood Group Needed: ${bloodGroup}
      - Quantity Needed: ${units} units
      - Urgency Level: ${emergencyLevel}
      - Additional Context: ${details || 'None provided'}

      Guidelines:
      - Keep it under 150 words.
      - Sound encouraging, human, and professional.
      - Include a call to action asking eligible donors to respond quickly via the BloodLink app.
      - Do not include headers, hashtags or signatures, just the direct request post.
    `;

    return await generateContentWithFallback(prompt);
  } catch (error) {
    console.error('Gemini generateSmartRequest error:', error);
    return mockGenerateSmartRequest(bloodGroup, units, emergencyLevel, details);
  }
}

/**
 * AI Feature 4: Blood Donation FAQ Assistant Chatbot
 */
async function answerFAQ(userQuestion, chatHistory = []) {
  if (!genAI) {
    return mockAnswerFAQ(userQuestion);
  }

  try {
    // Build context with history
    let contextPrompt = `
      You are "BloodLink Bot", an intelligent AI medical assistant for a blood donation platform.
      Your goal is to answer FAQs about blood donation eligibility, safety, preparation, and recovery.
      
      Rules:
      1. Provide accurate, helpful, and concise answers based on medical standards (Red Cross, WHO).
      2. Keep replies under 3-4 sentences.
      3. CRITICAL: Always include a friendly disclaimer in your reply indicating:
         "Disclaimer: This is for informational purposes only. Please consult a medical professional or our staff at the donation site for official medical clearance."
      4. If the question is NOT related to blood donation, health, eligibility, or the BloodLink platform, politely refuse to answer.
      
      Recent conversation history:
    `;

    chatHistory.slice(-5).forEach(msg => {
      contextPrompt += `\nUser: ${msg.question}\nAssistant: ${msg.answer}`;
    });

    contextPrompt += `\nUser: ${userQuestion}\nAssistant:`;

    return await generateContentWithFallback(contextPrompt);
  } catch (error) {
    console.error('Gemini answerFAQ error:', error);
    return mockAnswerFAQ(userQuestion);
  }
}

// ==========================================
// FALLBACK MOCK IMPLEMENTATIONS (For Offline/Missing Key Dev)
// ==========================================

function mockClassifyEmergency(description) {
  const text = description.toLowerCase();
  let priority = 'Normal';
  let score = 30;
  let reason = 'Standard request for stock optimization or planned transfusion.';

  if (text.includes('accident') || text.includes('icu') || text.includes('critical') || text.includes('immediately') || text.includes('surgery') || text.includes('bleeding')) {
    priority = 'Critical';
    score = 95;
    reason = 'Urgent life-threatening emergency (trauma/surgery/ICU admission).';
  } else if (text.includes('urgent') || text.includes('cancer') || text.includes('operation') || text.includes('soon') || text.includes('anemia')) {
    priority = 'High';
    score = 75;
    reason = 'Urgent medical request for planned operation or severe clinical condition.';
  }

  return { priority, score, reason };
}

function mockGenerateSmartRequest(bloodGroup, units, emergencyLevel, details) {
  let message = `🩸 BLOOD REQUEST: We are looking for ${units} units of ${bloodGroup} blood at our facility. `;
  
  if (emergencyLevel === 'Critical') {
    message += `This is an EMERGENCY requirement. A patient is in critical need. If you are nearby and eligible, please donate immediately. `;
  } else if (emergencyLevel === 'High') {
    message += `This is an urgent requirement. We appreciate assistance from any eligible donors as soon as possible. `;
  } else {
    message += `This is a regular requirement. Healthy, eligible donors are requested to schedule an appointment. `;
  }

  if (details) {
    message += `Context: "${details}". `;
  }

  message += `Your small act can save a life. Apply now through BloodLink!`;
  return message;
}

function mockAnswerFAQ(question) {
  const text = question.toLowerCase();
  let answer = "I'd be happy to help you with that blood donation question! ";

  if (text.includes('days') || text.includes('how often') || text.includes('60 days') || text.includes('frequency')) {
    answer += "Generally, you must wait at least 56 days (8 weeks) between whole blood donations. If you donated double red cells, the wait time is 112 days. Donating after 60 days is safe for whole blood.";
  } else if (text.includes('tattoo')) {
    answer += "In most regions, there is a 3-month waiting period to donate blood after getting a tattoo if the studio was not state-regulated. If it was fully regulated and sterile, you might be eligible immediately.";
  } else if (text.includes('diabetic') || text.includes('diabetes')) {
    answer += "Yes! Diabetics can donate blood as long as their blood sugar is well-controlled by diet or oral medications. If you take insulin, you are still eligible in many countries, provided it is stable.";
  } else if (text.includes('who can') || text.includes('eligibility')) {
    answer += "To donate blood, you typically need to be in good general health, at least 17 years old (16 with parental consent in some places), and weigh at least 110 pounds (50 kg).";
  } else if (text.includes('time') || text.includes('how long')) {
    answer += "The entire process from registration to recovery takes about 1 hour. The actual blood draw itself usually takes only 8 to 10 minutes.";
  } else {
    answer += "Blood donation is safe, simple, and saves lives! Eligible donors must be in good health, meet age and weight guidelines, and pass a brief physical screen.";
  }

  answer += "\n\nDisclaimer: This is for informational purposes only. Please consult a medical professional or our staff at the donation site for official medical clearance.";
  return answer;
}

export {
  classifyEmergency,
  generateSmartRequest,
  answerFAQ
};
