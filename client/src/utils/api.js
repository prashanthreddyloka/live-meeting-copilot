const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

export const diagnosePlant = async (imageBase64, mimeType) => {
  try {
    const res = await fetch(`${BASE_URL}/api/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, mimeType })
    });
    if (!res.ok) throw new Error('Diagnosis failed');
    return res.json();
  } catch (error) {
    throw new Error('Diagnosis failed');
  }
};

export const explorePlant = async (prompt) => {
  try {
    const res = await fetch(`${BASE_URL}/api/explore-plant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });
    if (!res.ok) throw new Error('Plant search failed');
    return res.json();
  } catch (error) {
    throw new Error('Plant search failed');
  }
};

export const chatWithPlantAssistant = async (prompt, history) => {
  try {
    const res = await fetch(`${BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, history })
    });
    if (!res.ok) throw new Error('Chat failed');
    return res.json();
  } catch (error) {
    throw new Error('Chat failed');
  }
};
