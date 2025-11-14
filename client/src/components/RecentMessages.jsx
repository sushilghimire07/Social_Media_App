import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import moment from "moment";
import { useUser, useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";

const RecentMessages = () => {
  const [messages, setMessages] = useState([]);
  const { user } = useUser();
  const { getToken } = useAuth();

  // Fetch recent messages from backend
  const fetchRecentMessages = async () => {
    try {
      if (!user) return;

      const token = await getToken();
      const { data } = await api.get("/api/messages/recent", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        // Map recentChats to include user info
        const sortedMessages = data.recentChats
          .map((chat) => ({
            ...chat.lastMessage,
            user: chat.user, // populated user info
          }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setMessages(sortedMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Fetch recent messages error:", error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecentMessages();
      const interval = setInterval(fetchRecentMessages, 30000); // refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <div className="bg-white max-w-xs mt-4 p-4 min-h-20 rounded-md shadow text-xs text-slate-800">
      <h3 className="font-semibold mb-4">Recent Messages</h3>

      <div className="flex flex-col max-h-56 overflow-y-scroll no-scrollbar">
        {messages.map((message, index) => {
          const otherUser = message.user || { full_name: "Unknown", profile_picture: "/default.png" };
          const messageText = message.text || "Media";

          return (
            <Link
              to={`/messages/${otherUser._id}`}
              key={index}
              className="flex items-start gap-2 py-2 hover:bg-slate-100 rounded-md px-1"
            >
              <img
                src={otherUser.profile_picture || "/default.png"}
                alt=""
                className="w-8 h-8 rounded-full"
              />

              <div className="w-full">
                <div className="flex justify-between">
                  <p className="font-medium">{otherUser.full_name}</p>
                  <p className="text-[10px] text-slate-400">
                    {moment(message.createdAt).fromNow()}
                  </p>
                </div>

                <div className="flex justify-between">
                  <p className="text-gray-500 text-[11px] truncate">{messageText}</p>

                  {!message.seen && (
                    <p className="bg-indigo-500 text-white w-4 h-4 flex items-center justify-center rounded-full text-[10px]">
                      1
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default RecentMessages;
