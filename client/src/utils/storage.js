const KEY = 'pa_history';

export const saveToHistory = (diagnosis, imageDataUrl) => {
  const history = getHistory();
  history.unshift({
    ...diagnosis,
    imageDataUrl,
    savedAt: new Date().toISOString()
  });
  localStorage.setItem(KEY, JSON.stringify(history.slice(0, 50)));
};

export const getHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};

export const clearHistory = () => localStorage.removeItem(KEY);
