import React, { useRef, useState, useEffect } from "react";
import { ImageIcon, SendHorizonalIcon } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { addMessage, fetchMessages, resetMessages } from "../features/messages/messagesSlice";

const ChatBox = () => {
  const messages = useSelector((state) => state.messages.messages);
  const connections = useSelector((state) => state.connections.connections);
  const { userId } = useParams();
  const { getToken, userId: currentUserId } = useAuth();
  const dispatch = useDispatch();

  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null);

  const messageEndRef = useRef(null);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  const fetchUserMessages = async () => {
    try {
      const token = await getToken();
      dispatch(fetchMessages({ token, userId }));
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Send message
  const sendMessage = async () => {
    try {
      if (!text && !image) return;

      const token = await getToken();
      const formData = new FormData();
      formData.append("to_user_id", userId);
      formData.append("text", text);
      if (image) formData.append("image", image);

      const { data } = await api.post("/api/messages/send", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setText("");
        setImage(null);

        // Convert IDs to string for consistency
        const messageData = {
          ...data.message,
          from_user_id: data.message.from_user_id._id || data.message.from_user_id,
          to_user_id: data.message.to_user_id._id || data.message.to_user_id,
        };

        dispatch(addMessage(messageData));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Load messages & reset on unmount
  useEffect(() => {
    fetchUserMessages();
    return () => dispatch(resetMessages());
  }, [userId]);

  // Find selected user
  useEffect(() => {
    if (connections.length > 0) {
      const selected = connections.find((c) => c._id === userId);
      setUser(selected);
    }
  }, [connections, userId]);

  if (!user) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 md:px-10 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        <img src={user.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div>
          <p className="font-medium text-gray-800">{user.full_name}</p>
          <p className="text-sm text-gray-500">@{user.username}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-5 md:px-10 overflow-y-auto">
        <div className="flex flex-col space-y-4 max-w-4xl mx-auto">
          {messages
            .slice()
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message, index) => {
              const isSentByCurrent = message.from_user_id === currentUserId;
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isSentByCurrent ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`p-3 text-sm max-w-sm bg-white text-gray-700 rounded-lg shadow ${
                      isSentByCurrent ? "rounded-br-none" : "rounded-bl-none"
                    }`}
                  >
                    {message.message_type === "image" && (
                      <img
                        src={message.media_url}
                        alt=""
                        className="w-full max-w-sm rounded-lg mb-1"
                      />
                    )}
                    <p>{message.text}</p>
                  </div>
                </div>
              );
            })}
          <div ref={messageEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-3 max-w-xl mx-auto p-2 bg-gray-100 rounded-full">
          <input
            type="text"
            className="flex-1 outline-none bg-transparent text-gray-700"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          {/* Image Upload */}
          <label className="cursor-pointer">
            {image ? (
              <img
                src={URL.createObjectURL(image)}
                alt=""
                className="h-8 w-8 rounded object-cover"
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>

          <button
            onClick={sendMessage}
            className="p-2 bg-gradient-to-br from-indigo-450 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full active:scale-95 transition"
          >
            <SendHorizonalIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
