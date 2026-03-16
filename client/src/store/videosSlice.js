import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchVideos = createAsyncThunk(
  'videos/fetchList',
  async (params = {}) => {
    const { data } = await api.get('/videos', { params });
    return { key: params._key || 'default', videos: data.videos || [], pages: data.pages || 1 };
  }
);

export const fetchVideo = createAsyncThunk(
  'videos/fetchOne',
  async (id) => {
    const { data } = await api.get(`/videos/${id}`);
    return data.video;
  }
);

const videosSlice = createSlice({
  name: 'videos',
  initialState: {
    lists: {},
    current: null,
    currentLoading: true,
  },
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.currentLoading = true;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state, { meta }) => {
        const key = meta.arg._key || 'default';
        if (!state.lists[key]) state.lists[key] = { items: [], loading: true, pages: 1 };
        else state.lists[key].loading = true;
      })
      .addCase(fetchVideos.fulfilled, (state, { payload }) => {
        state.lists[payload.key] = { items: payload.videos, loading: false, pages: payload.pages };
      })
      .addCase(fetchVideos.rejected, (state, { meta }) => {
        const key = meta.arg._key || 'default';
        if (state.lists[key]) state.lists[key].loading = false;
      })
      .addCase(fetchVideo.pending, (state) => {
        state.currentLoading = true;
      })
      .addCase(fetchVideo.fulfilled, (state, { payload }) => {
        state.current = payload;
        state.currentLoading = false;
      })
      .addCase(fetchVideo.rejected, (state) => {
        state.current = null;
        state.currentLoading = false;
      });
  },
});

export const { clearCurrent } = videosSlice.actions;

const DEFAULT_LIST = { items: [], loading: true, pages: 1 };

const selectorCache = new Map();
export const selectVideoList = (key) => {
  if (!selectorCache.has(key)) {
    selectorCache.set(key, (state) => state.videos.lists[key] || DEFAULT_LIST);
  }
  return selectorCache.get(key);
};

export const selectCurrentVideo = (state) => state.videos.current;
export const selectCurrentVideoLoading = (state) => state.videos.currentLoading;

export default videosSlice.reducer;
