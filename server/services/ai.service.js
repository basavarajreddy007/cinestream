import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const getClient = () => new OpenAI({
  apiKey: process.env.OPENROUTER_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:5173',
    'X-Title': 'CineStream OTT',
  },
});

const MODEL = 'openai/gpt-4o-mini';

export const analyzeScript = async (scriptText) => {
  const openai = getClient();
  const prompt = `You are a professional Hollywood script analyst. Analyze the following movie script and return a JSON object with these exact fields:
{
  "genre": ["array of detected genres"],
  "storyQualityScore": <number 1-10>,
  "dialogueQualityScore": <number 1-10>,
  "characterDepthScore": <number 1-10>,
  "plotConsistency": <number 1-10>,
  "estimatedAudienceInterest": <number 1-10>,
  "overallScore": <number 1-10>,
  "improvements": ["list of specific improvement suggestions"],
  "strengths": ["list of script strengths"],
  "summary": "brief 2-3 sentence analysis summary"
}

Script:
${scriptText.substring(0, 4000)}

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return JSON.parse(response.choices[0].message.content.trim());
};

export const writeScript = async ({ genre, theme, characters, setting, storyLength, tone }) => {
  const openai = getClient();
  const prompt = `You are a professional Hollywood screenwriter. Write a complete movie script outline with the following details:
- Genre: ${genre}
- Theme: ${theme}
- Main Characters: ${characters}
- Setting: ${setting}
- Story Length: ${storyLength}
- Tone: ${tone}

Return a JSON object with this exact structure:
{
  "title": "Movie Title",
  "logline": "One sentence summary",
  "storyOutline": "Brief overall story outline",
  "act1": {
    "title": "Act 1: Setup",
    "scenes": ["scene 1 description", "scene 2 description"],
    "keyDialogues": ["Character: dialogue line"]
  },
  "act2": {
    "title": "Act 2: Confrontation",
    "scenes": ["scene descriptions"],
    "keyDialogues": ["dialogue lines"]
  },
  "act3": {
    "title": "Act 3: Resolution",
    "scenes": ["scene descriptions"],
    "keyDialogues": ["dialogue lines"]
  },
  "plotTwists": ["twist 1", "twist 2"],
  "ending": "Description of the ending",
  "themes": ["theme 1", "theme 2"]
}

Return ONLY valid JSON, no markdown.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 2000,
  });

  return JSON.parse(response.choices[0].message.content.trim());
};

export const getAIRecommendations = async ({ genres = [], watchedTitles = [], likedTitles = [] }) => {
  const openai = getClient();

  const watchedPart = watchedTitles.length > 0
    ? `\nUser watch history: ${watchedTitles.slice(0, 15).join(', ')}`
    : '';

  const likedPart = likedTitles.length > 0
    ? `\nUser liked videos: ${likedTitles.slice(0, 10).join(', ')}`
    : '';

  const genrePart = genres.length > 0
    ? `\nFavorite genres: ${genres.join(', ')}`
    : '\nFavorite genres: Action, Drama, Thriller, Sci-Fi, Comedy';

  const prompt = `You are a movie recommendation engine.
Based on the user's preferences below, recommend 8 movies that the user would enjoy.
Pick a diverse mix — include well-known blockbusters, critically acclaimed films, and some hidden gems.
${watchedPart}${likedPart}${genrePart}

Return ONLY a valid JSON array of exactly 8 movie title strings.
Example: ["The Dark Knight","Inception","Interstellar","Parasite","Fight Club","Blade Runner 2049","The Prestige","Arrival"]

Return ONLY valid JSON array, no markdown, no explanation.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.9,
    max_tokens: 300,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};
