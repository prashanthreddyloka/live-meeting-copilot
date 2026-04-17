const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const getApiUrl = (path: string): string => {
  const baseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL ?? '');

  if (!baseUrl) {
    return path;
  }

  return `${baseUrl}${path}`;
};
