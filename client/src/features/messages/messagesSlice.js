import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Initial state
const initialState = {
  messages: [],       // always an array
  status: 'idle',     // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Async thunk to fetch messages
export const fetchMessages = createAsyncThunk(
  'messages/fetchMessages',
  async ({ token, userId }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        '/api/messages/get',
        { to_user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        return data.messages; // only return messages array
      } else {
        return rejectWithValue(data.message || 'Failed to fetch messages');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    resetMessages: (state) => {
      state.messages = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.messages = action.payload;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setMessages, addMessage, resetMessages } = messagesSlice.actions;
export default messagesSlice.reducer;
