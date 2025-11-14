import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios";

export const fetchPosts = createAsyncThunk(
  "posts/fetchPosts",
  async (token) => {
    const { data } = await api.get("/api/posts/feed", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return data.success ? data.posts : [];
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState: { posts: [], loading: false },
  reducers: {
    addPostToFeed: (state, action) => {
      state.posts = [action.payload, ...state.posts];
    },
    updatePostInFeed: (state, action) => {
      state.posts = state.posts.map((post) =>
        post._id === action.payload._id ? action.payload : post
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPosts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchPosts.fulfilled, (state, action) => {
      state.posts = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchPosts.rejected, (state) => {
      state.loading = false;
    });
  },
});

export const { addPostToFeed, updatePostInFeed } = postsSlice.actions;
export default postsSlice.reducer;
