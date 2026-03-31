import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CLIENT_URL = process.env.CLIENT_URL;

const allowedOrigins = ['http://localhost:3000', CLIENT_URL].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  })
);

app.use(express.json({ limit: '10mb' }));

const diagnosisPrompt =
  'You are an expert plant pathologist with 20 years of experience diagnosing plant diseases. Analyze the plant photo carefully and return ONLY a raw valid JSON object with no markdown, no backticks, no explanation, just the JSON:\n{\n  "plantName": "string",\n  "commonName": "string",\n  "diagnosis": "string",\n  "diagnosisType": "one of [Overwatering, Underwatering, Root Rot, Fungal Infection, Bacterial Infection, Pest Infestation, Nutrient Deficiency, Sunburn, Cold Damage, Natural Aging, Healthy]",\n  "confidence": "number 0-100",\n  "severity": "one of [healthy, mild, moderate, critical]",\n  "symptoms": ["array of 3-5 strings"],\n  "rootCause": "string of 2-3 sentences explaining why this happened",\n  "survivalChance": "number 0-100",\n  "timeToRecover": "string like 2-3 weeks",\n  "warningIfIgnored": "string of 1 sentence",\n  "revivalSteps": [{ "step": 1, "title": "string", "description": "string", "timing": "string", "urgent": true }],\n  "preventionTips": ["array of 3 strings"],\n  "careSchedule": { "watering": "string", "sunlight": "string", "humidity": "string", "fertilizing": "string" }\n}';

const sanitizeJsonText = (text) => text.replace(/```json|```/gi, '').trim();
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const parseJsonResponse = (text) => JSON.parse(sanitizeJsonText(text));

const normalizeDiagnosis = (raw) => ({
  plantName: raw.plantName || 'Unknown Plant',
  commonName: raw.commonName || raw.plantName || 'Unknown Plant',
  diagnosis: raw.diagnosis || 'A diagnosis summary was not provided.',
  diagnosisType: raw.diagnosisType || 'Healthy',
  confidence: clamp(Number(raw.confidence) || 0, 0, 100),
  severity: ['healthy', 'mild', 'moderate', 'critical'].includes(raw.severity) ? raw.severity : 'mild',
  symptoms: Array.isArray(raw.symptoms) ? raw.symptoms.slice(0, 5) : [],
  rootCause: raw.rootCause || 'A root cause explanation was not provided.',
  survivalChance: clamp(Number(raw.survivalChance) || 0, 0, 100),
  timeToRecover: raw.timeToRecover || 'Unknown',
  warningIfIgnored: raw.warningIfIgnored || 'Monitor the plant closely.',
  revivalSteps: Array.isArray(raw.revivalSteps)
    ? raw.revivalSteps.slice(0, 6).map((step, index) => ({
        step: Number(step.step) || index + 1,
        title: step.title || `Step ${index + 1}`,
        description: step.description || 'Follow careful plant care steps.',
        timing: step.timing || 'This week',
        urgent: Boolean(step.urgent)
      }))
    : [],
  preventionTips: Array.isArray(raw.preventionTips) ? raw.preventionTips.slice(0, 3) : [],
  careSchedule: {
    watering: raw.careSchedule?.watering || 'Water when the top layer of soil feels dry.',
    sunlight: raw.careSchedule?.sunlight || 'Bright indirect light.',
    humidity: raw.careSchedule?.humidity || 'Average household humidity.',
    fertilizing: raw.careSchedule?.fertilizing || 'Feed lightly during the growing season.'
  }
});

const getWikipediaSummary = async (title) => {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'PlantAutopsy/1.0' }
  });

  if (!response.ok) {
    throw new Error('Wikipedia lookup failed');
  }

  return response.json();
};

const searchWikipediaPlant = async (query) => {
  const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
    `${query} plant`
  )}&format=json&origin=*`;
  const response = await fetch(searchUrl, {
    headers: { 'User-Agent': 'PlantAutopsy/1.0' }
  });

  if (!response.ok) {
    throw new Error('Wikipedia search failed');
  }

  const data = await response.json();
  const topMatch = data?.query?.search?.[0]?.title || query;
  return getWikipediaSummary(topMatch);
};

const safeWikipediaLookup = async (query) => {
  try {
    if (!query || !query.trim()) {
      return null;
    }
    return await searchWikipediaPlant(query.trim());
  } catch (error) {
    return null;
  }
};

const callGemini = async (parts) => {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || 'Gemini request failed');
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.post('/api/diagnose', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: 'Diagnosis failed. Please try again.' });
    }

    const responseText = await callGemini([
      { text: diagnosisPrompt },
      { inlineData: { mimeType, data: imageBase64 } }
    ]);

    const parsed = parseJsonResponse(responseText);
    return res.json(normalizeDiagnosis(parsed));
  } catch (error) {
    return res.status(500).json({ error: 'Diagnosis failed. Please try again.' });
  }
});

app.post('/api/explore-plant', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;

    if ((!prompt || !prompt.trim()) && (!imageBase64 || !mimeType)) {
      return res.status(400).json({ error: 'Plant search failed. Please try again.' });
    }

    const identifyParts = [
      {
        text: `Return only raw valid JSON:
{
  "identifiedPlantName": "string",
  "commonName": "string",
  "headline": "string",
  "userQuestionSummary": "string",
  "history": "string with 1-2 paragraphs",
  "interestingFacts": ["3 short facts"],
  "careBasics": {
    "water": "string",
    "light": "string",
    "soil": "string",
    "climate": "string"
  },
  "answerConfidence": "number 0-100"
}

If the user provided an image, identify the plant as accurately as possible. If the plant cannot be identified with confidence, say so gently but still provide the best likely match.
User prompt: ${prompt?.trim() || 'Identify this plant and explain it simply.'}`
      }
    ];

    if (imageBase64 && mimeType) {
      identifyParts.push({
        inlineData: { mimeType, data: imageBase64 }
      });
    }

    const identifyResponseText = await callGemini(identifyParts);
    const identified = parseJsonResponse(identifyResponseText);
    const plantName =
      identified.identifiedPlantName ||
      identified.commonName ||
      prompt?.trim() ||
      'Unknown plant';
    const wiki = await safeWikipediaLookup(plantName);
    const explorerPrompt = `
Return only raw valid JSON with this shape:
{
  "plantName": "string",
  "headline": "string",
  "history": "string with 2 paragraphs max",
  "interestingFacts": ["3 short facts"],
  "careBasics": {
    "water": "string",
    "light": "string",
    "soil": "string",
    "climate": "string"
  },
  "userPromptReply": "short engaging answer that directly addresses the user's request"
}

Plant the user asked about: ${prompt?.trim() || plantName}
Best identified plant: ${plantName}
Identified common name: ${identified.commonName || ''}
Model summary: ${identified.userQuestionSummary || ''}
Model history: ${identified.history || ''}
Title: ${wiki?.title || plantName}
Description: ${wiki?.description || ''}
Summary: ${wiki?.extract || ''}
`;

    const responseText = await callGemini([{ text: explorerPrompt }]);
    const parsed = parseJsonResponse(responseText);

    return res.json({
      plantName: parsed.plantName || plantName,
      headline: parsed.headline || identified.headline || wiki?.description || 'Plant profile',
      history: parsed.history || identified.history || wiki?.extract || 'No history available.',
      interestingFacts: Array.isArray(parsed.interestingFacts) ? parsed.interestingFacts.slice(0, 3) : [],
      careBasics: {
        water: parsed.careBasics?.water || identified.careBasics?.water || 'Water according to species needs.',
        light: parsed.careBasics?.light || identified.careBasics?.light || 'Match the plant with its preferred light level.',
        soil: parsed.careBasics?.soil || identified.careBasics?.soil || 'Use soil suited to this plant type.',
        climate:
          parsed.careBasics?.climate ||
          identified.careBasics?.climate ||
          'Keep conditions stable and seasonally appropriate.'
      },
      userPromptReply:
        parsed.userPromptReply ||
        `Here is a quick profile for ${plantName}.`,
      imageUrl:
        wiki?.originalimage?.source ||
        wiki?.thumbnail?.source ||
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/512px-Placeholder_view_vector.svg.png',
      wikipediaUrl:
        wiki?.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(plantName)}`
    });
  } catch (error) {
    return res.status(500).json({ error: 'Plant search failed. Please try again.' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Chat failed. Please try again.' });
    }

    const transcript = Array.isArray(history)
      ? history
          .slice(-8)
          .map((message) => `${message.role === 'assistant' ? 'Assistant' : 'User'}: ${message.content}`)
          .join('\n')
      : '';

    const responseText = await callGemini([
      {
        text: `Return only raw valid JSON:
{
  "reply": "string",
  "suggestedFollowUps": ["3 short suggestions"]
}

You are PlantAutopsy's plant care assistant. Be practical, warm, and concise. Help with plant identification, care, troubleshooting, pests, watering, repotting, and light conditions.
Recent chat:
${transcript || 'No previous messages.'}

User message: ${prompt.trim()}`
      }
    ]);

    const parsed = parseJsonResponse(responseText);
    return res.json({
      reply: parsed.reply || 'I could not generate a response just now.',
      suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps) ? parsed.suggestedFollowUps.slice(0, 3) : []
    });
  } catch (error) {
    return res.status(500).json({ error: 'Chat failed. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`PlantAutopsy API listening on port ${PORT}`);
});
