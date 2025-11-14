import React from "react";
import { Eye, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const Messages = () => {
  const { connections } = useSelector((state) => state.connections);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-6">

        {/* Title */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Messages</h1>
          <p className="text-gray-600">Talk to your friends and family</p>
        </div>

        {/* Connected Users List */}
        <div className="flex flex-col gap-4">
          {connections.length === 0 && (
            <p className="text-center text-gray-500 mt-6">
              No connections yet.
            </p>
          )}

          {connections.map((user) => (
            <div
              key={user._id}
              className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 p-5 bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow"
            >
              {/* Profile Picture */}
              <img
                src={user.profile_picture || "/default-avatar.png"}
                alt={user.full_name}
                className="w-16 h-16 rounded-full object-cover shadow-sm"
              />

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <p className="font-semibold text-gray-800 text-lg">
                  {user.full_name}
                </p>
                <p className="text-gray-500">@{user.username}</p>
                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                  {user.bio || "No bio available"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-3 md:mt-0">
                <button
                  onClick={() => navigate(`/messages/${user._id}`)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-transform active:scale-95"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>

                <button
                  onClick={() => navigate(`/profile/${user._id}`)}
                  className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-transform active:scale-95"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Messages;
