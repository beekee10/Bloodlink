import { answerFAQ } from '../services/gemini.js';

/**
 * Handle AI FAQ chatbot queries.
 */
async function chatFAQ(req, res) {
  const { question, history } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Please provide a question.' });
  }

  try {
    const reply = await answerFAQ(question, history || []);
    res.json({ reply });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to process your chatbot query.' });
  }
}

export {
  chatFAQ
};
