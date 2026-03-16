import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const CACHE_TTL = 10 * 60 * 1000;
let cachedData = null;
let cacheExpiry = 0;

export function useAIRecommendations() {
  const [recommendations, setRecommendations] = useState(cachedData || []);
  const [loading, setLoading] = useState(!cachedData || Date.now() > cacheExpiry);
  const [error, setError] = useState(null);
  const fetched = useRef(false);

  const fetchRecommendations = useCallback(async (force = false) => {
    if (!force && cachedData && Date.now() < cacheExpiry) {
      setRecommendations(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get('/ai/recommendations');
      const videos = data.videos || data.recommendations || [];
      cachedData = videos;
      cacheExpiry = Date.now() + CACHE_TTL;
      setRecommendations(videos);
    } catch (err) {
      console.warn('AI recommendations failed, falling back to trending:', err.message);
      setError(err.message);

      try {
        const { data } = await api.get('/videos', { params: { sort: '-views', limit: 8 } });
        const fallback = data.videos || [];
        cachedData = fallback;
        cacheExpiry = Date.now() + CACHE_TTL;
        setRecommendations(fallback);
      } catch {
        setRecommendations([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRecommendations = useCallback(() => {
    cachedData = null;
    cacheExpiry = 0;
    fetched.current = false;
    fetchRecommendations(true);
  }, [fetchRecommendations]);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, refreshRecommendations };
}
