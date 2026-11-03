import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI client dynamically
let genAI = null;
function getGenAI() {
  if (genAI) return genAI;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      genAI = new GoogleGenerativeAI(apiKey);
      console.log('Gemini API client initialized successfully.');
      return genAI;
    } catch (error) {
      console.error('Failed to initialize Gemini API client:', error);
    }
  } else {
    console.warn('GEMINI_API_KEY is not defined in process.env. Using AI mock service fallback.');
  }
  return null;
}

/**
 * Helper to query Gemini with automatic model failover/fallback.
 */
async function generateContentWithFallback(prompt) {
  const client = getGenAI();
  if (!client) throw new Error('Gemini API client not initialized');
  
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-flash-latest',
    'gemini-3.8-flash'
  ];
  let lastError = null;

  for (const modelName of models) {
    try {
      console.log(`Querying Gemini model: ${modelName}...`);
      const model = client.getGenerativeModel({ model: modelName });
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
  if (!getGenAI()) {
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
    
    // Extract JSON from potential markdown tags or free text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error('Gemini classifyEmergency error:', error);
    return mockClassifyEmergency(description);
  }
}

/**
 * Helper to extract blood group, units, and urgency level from clinical details text.
 */
function extractBloodInfo(details, defaultGroup, defaultUnits, defaultUrgency) {
  let bloodGroup = defaultGroup || 'O+';
  let units = Number(defaultUnits) || 1;
  let emergencyLevel = defaultUrgency || 'Normal';

  if (details && typeof details === 'string') {
    // 1. Detect blood group (e.g. B-, AB+, O negative, A positive)
    const bgMatch = details.match(/\b(AB|A|B|O)\s*([+-])(?!\w)|\b(AB|A|B|O)\s+(positive|negative)\b/i);
    if (bgMatch) {
      const type = (bgMatch[1] || bgMatch[3]).toUpperCase();
      const sign = (bgMatch[2] || bgMatch[4]).toLowerCase().startsWith('pos') || bgMatch[2] === '+' ? '+' : '-';
      bloodGroup = `${type}${sign}`;
    }

    // 2. Detect units (e.g. 3 units, 4 bags, two units)
    const unitMatch = details.match(/(\d+)\s*(unit|units|bag|bags|pints?|bottles?)/i);
    if (unitMatch) {
      units = parseInt(unitMatch[1], 10);
    } else {
      const wm = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const wMatch = details.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten)\s*(unit|units|bag|bags|pints?)/i);
      if (wMatch) {
        units = wm[wMatch[1].toLowerCase()] || units;
      }
    }

    // 3. Detect urgency
    const lower = details.toLowerCase();
    if (lower.includes('critical') || lower.includes('emergency') || lower.includes('icu') || lower.includes('trauma') || lower.includes('immediately') || lower.includes('bleeding')) {
      emergencyLevel = 'Critical';
    } else if (lower.includes('urgent') || lower.includes('high') || lower.includes('surgery') || lower.includes('soon') || lower.includes('transfusion')) {
      emergencyLevel = 'High';
    }
  }

  return { bloodGroup, units, emergencyLevel };
}

/**
 * AI Feature 2: Smart Request Generator
 * Formulates professional appeal text for donors.
 */
async function generateSmartRequest(bloodGroup, units, emergencyLevel, details) {
  const resolved = extractBloodInfo(details, bloodGroup, units, emergencyLevel);
  const client = getGenAI();
  if (!client) {
    return mockGenerateSmartRequest(resolved.bloodGroup, resolved.units, resolved.emergencyLevel, details);
  }

  try {
    const prompt = `
      You are a professional outreach coordinator for a blood donor platform.
      Write an engaging, clear, and urgent (if emergency requires) social/app message requesting blood donors.
      
      Target Requirements:
      - Blood Group Needed: ${resolved.bloodGroup}
      - Quantity Needed: ${resolved.units} unit(s)
      - Urgency Level: ${resolved.emergencyLevel}
      - Clinical Details Provided: "${details || 'Urgent requirement at our medical center'}"

      Guidelines:
      - You MUST explicitly request ${resolved.units} unit(s) of ${resolved.bloodGroup} blood in the message.
      - Keep it under 150 words.
      - Sound encouraging, human, and professional.
      - Include a call to action asking eligible donors to respond quickly via the BloodLink app.
      - Do not include headers, hashtags or signatures, just the direct request post.
    `;

    const text = await generateContentWithFallback(prompt);
    return {
      suggestion: text,
      detectedBloodGroup: resolved.bloodGroup,
      detectedUnits: resolved.units,
      detectedEmergencyLevel: resolved.emergencyLevel
    };
  } catch (error) {
    console.error('Gemini generateSmartRequest error:', error);
    return mockGenerateSmartRequest(resolved.bloodGroup, resolved.units, resolved.emergencyLevel, details);
  }
}

/**
 * AI Feature 4: Blood Donation FAQ Assistant Chatbot
 */
async function answerFAQ(userQuestion, chatHistory = []) {
  if (!getGenAI()) {
    return mockAnswerFAQ(userQuestion);
  }

  try {
    // Build context with history
    let contextPrompt = `
      You are "BloodLink Bot", an intelligent AI medical assistant for the BloodLink blood donation platform.
      Your goal is to answer FAQs about blood donation eligibility, safety, preparation, recovery, and platform features.
      
      Rules:
      1. Provide accurate, helpful, and concise answers based on medical standards (Red Cross, WHO).
      2. Keep replies under 3-4 sentences.
      3. CRITICAL: Always include a friendly disclaimer in your reply indicating:
         "Disclaimer: This is for informational purposes only. Please consult a medical professional or our staff at the donation site for official medical clearance."
      4. If the question is NOT related to blood donation, health, eligibility, or the BloodLink platform, politely refuse to answer.
      
      Recent conversation history:
    `;

    if (Array.isArray(chatHistory)) {
      chatHistory.slice(-5).forEach(msg => {
        if (msg.question && msg.answer) {
          contextPrompt += `\nUser: ${msg.question}\nAssistant: ${msg.answer}`;
        }
      });
    }

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
  const resolved = extractBloodInfo(details, bloodGroup, units, emergencyLevel);
  let message = `🩸 BLOOD REQUEST: We are urgently seeking ${resolved.units} unit${resolved.units > 1 ? 's' : ''} of ${resolved.bloodGroup} blood at our facility. `;
  
  if (resolved.emergencyLevel === 'Critical') {
    message += `This is a CRITICAL EMERGENCY. A patient is in immediate life-threatening need. If you are nearby and eligible with ${resolved.bloodGroup} blood, please donate immediately. `;
  } else if (resolved.emergencyLevel === 'High') {
    message += `This is an urgent clinical requirement. We appreciate assistance from any eligible ${resolved.bloodGroup} donors as soon as possible. `;
  } else {
    message += `Healthy, eligible donors with blood group ${resolved.bloodGroup} are requested to schedule a donation appointment. `;
  }

  if (details) {
    message += `Details: "${details}". `;
  }

  message += `Your small act can save a life today. Please apply now through BloodLink!`;
  return {
    suggestion: message,
    detectedBloodGroup: resolved.bloodGroup,
    detectedUnits: resolved.units,
    detectedEmergencyLevel: resolved.emergencyLevel
  };
}

function mockAnswerFAQ(question) {
  const text = question.toLowerCase();
  let answer = "I'd be happy to help you with that blood donation question! ";

  if (text.includes('weight') || text.includes('kg') || text.includes('lbs') || text.includes('heavy') || text.includes('light')) {
    answer += "Donors must weigh at least 110 lbs (50 kg) to safely donate blood. This ensures your body has sufficient circulating blood volume to tolerate donating a standard unit.";
  } else if (text.includes('age') || text.includes('old') || text.includes('young') || text.includes('years old')) {
    answer += "You typically must be at least 17 years old (or 16 with parental consent depending on state/jurisdiction). In many countries there is no upper age limit as long as you are healthy.";
  } else if (text.includes('alcohol') || text.includes('beer') || text.includes('drink')) {
    answer += "Drinking alcohol does not permanently disqualify you, but you should avoid consuming alcohol for at least 24 hours prior to donating and make sure you are well-hydrated with water.";
  } else if (text.includes('iron') || text.includes('hemoglobin') || text.includes('anemia')) {
    answer += "Your hemoglobin level will be checked prior to donation. A minimum level (typically 12.5 g/dL for women and 13.0 g/dL for men) is required to ensure you can donate safely.";
  } else if (text.includes('cold') || text.includes('fever') || text.includes('sick') || text.includes('flu') || text.includes('covid')) {
    answer += "You should be completely free of cold, flu, or fever symptoms for at least 48 to 72 hours before attempting to donate blood.";
  } else if (text.includes('days') || text.includes('how often') || text.includes('60 days') || text.includes('frequency')) {
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
    answer += "Blood donation is safe, simple, and saves lives! Eligible donors must be in good general health, meet age and weight guidelines, and pass a brief physical screen.";
  }

  answer += "\n\nDisclaimer: This is for informational purposes only. Please consult a medical professional or our staff at the donation site for official medical clearance.";
  return answer;
}

export {
  classifyEmergency,
  generateSmartRequest,
  answerFAQ
};
