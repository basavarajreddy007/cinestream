import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';

const TOKEN_KEY = 'cinestream_token';
const USER_KEY = 'cinestream_user';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const verifyAuth = createAsyncThunk('auth/verify', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return rejectWithValue('No token');
  try {
    const { data } = await api.get('/auth/me');
    return data.user;
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return rejectWithValue('Invalid token');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.post('/auth/logout').catch(() => {});
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    loading: true,
  },
  reducers: {
    loginSuccess(state, { payload }) {
      const { token, user } = payload;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      state.user = user;
      state.loading = false;
    },
    updateProfile(state, { payload }) {
      const updated = { ...state.user, ...payload };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      state.user = updated;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(verifyAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyAuth.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.loading = false;
      })
      .addCase(verifyAuth.rejected, (state) => {
        state.user = null;
        state.loading = false;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { loginSuccess, updateProfile } = authSlice.actions;

export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectIsAdmin = (state) => state.auth.user?.role === 'admin';

export default authSlice.reducer;
