import React, { useEffect, useRef } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useDispatch } from "react-redux";
import toast, { Toaster } from "react-hot-toast";

import { fetchUser } from "./features/user/userSlice";
import { fetchConnection } from "./features/connections/connectionSlice";
import { addMessage } from "./features/messages/messagesSlice";

import Notifications from "./components/Notifications";
import Login from "./pages/Login";
import Feed from "./pages/Feed";
import Messages from "./pages/Messages";
import ChatBox from "./pages/ChatBox";
import Connections from "./pages/Connections";
import Discover from "./pages/Discover";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import Layout from "./pages/Layout";

const App = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const pathnameRef = useRef(pathname);

  // Store current pathname for message routing
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // Fetch user & connections after login
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnection(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);

  // ---------------- SSE REAL-TIME MESSAGE LISTENER ----------------
  useEffect(() => {
    if (!user) return;

    let eventSource;

    const initSSE = async () => {
      try {
        const token = await getToken();

        // IMPORTANT — correct SSE URL
        eventSource = new EventSource(
          `${import.meta.env.VITE_BASEURL}/api/messages/sse/${user.id}?token=${token}`
        );

        eventSource.onopen = () => console.log("✅ SSE connection opened");

        eventSource.onerror = (err) => {
          console.log("❌ SSE error", err);
        };

        eventSource.onmessage = (event) => {
          const message = JSON.parse(event.data);

          const messageData = {
            ...message,
            from_user_id: message.from_user_id?._id || message.from_user_id,
            to_user_id: message.to_user_id?._id || message.to_user_id,
          };

          const currentChatId = pathnameRef.current.split("/messages/")[1];

          if (
            currentChatId &&
            (currentChatId === messageData.from_user_id ||
              currentChatId === messageData.to_user_id)
          ) {
            dispatch(addMessage(messageData));
          } else {
            // Show notification only if not currently inside chat
            toast.custom((t) => <Notifications t={t} message={messageData} />, {
              position: "bottom-right",
            });
          }
        };
      } catch (err) {
        console.error("SSE init error:", err);
      }
    };

    initSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
        console.log("🔴 SSE connection closed");
      }
    };
  }, [user, getToken, dispatch]);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Messages />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
};

export default App;
