import React, { useEffect, useState } from "react";
import { Users, UserPlus, UserCheck, UserRoundPen, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchConnection } from "../features/connections/connectionSlice";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/clerk-react";

const Connections = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const { connections, pendingConnections, followers, following } = useSelector((state) => state.connections);
  const [currentTab, setCurrentTab] = useState("Followers");

  const dataArray = [
    { label: "Followers", value: followers, icon: Users },
    { label: "Following", value: following, icon: UserCheck },
    { label: "Pending", value: pendingConnections, icon: UserRoundPen },
    { label: "Connections", value: connections, icon: UserPlus },
  ];

  useEffect(() => {
    getToken().then((token) => dispatch(fetchConnection(token)));
  }, []);

  const acceptConnections = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post("/api/user/accept", { id: userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnection(token));
      } else toast.error(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const token = await getToken();
      const { data } = await api.post("/api/user/unfollow", { id: userId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        toast.success(data.message);
        dispatch(fetchConnection(token));
      } else toast.error(data.message);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Connections</h1>
        <p className="text-slate-600 mb-8">Manage your network and discover new connections</p>

        <div className="mb-8 flex flex-wrap gap-6">
          {dataArray.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center justify-center gap-1 border h-20 w-40 border-gray-200 bg-white shadow rounded-md">
              <b>{item.value.length}</b>
              <p className="text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="inline-flex flex-wrap items-center border border-gray-200 rounded-md p-1 bg-white shadow-sm mb-6">
          {dataArray.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.label} onClick={() => setCurrentTab(tab.label)}
                className={`cursor-pointer flex items-center px-3 py-1 text-sm rounded-md transition-colors ${currentTab === tab.label ? "bg-white font-medium text-black border border-gray-300" : "text-gray-500 hover:text-black"}`}>
                <Icon className="w-4 h-4" />
                <span className="ml-1">{tab.label}</span>
                <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{tab.value.length}</span>
              </button>
            );
          })}
        </div>

        {/* User list */}
        <div className="flex flex-wrap gap-6">
          {dataArray.find((tab) => tab.label === currentTab).value.map((user) => (
            <div key={user._id} className="w-full max-w-88 flex gap-5 p-6 bg-white shadow rounded-md">
              <img src={user.profile_picture} className="rounded-full w-12 h-12 shadow-md" alt="" />
              <div className="flex-1">
                <p className="font-medium text-slate-500">{user.full_name}</p>
                <p className="text-slate-500">@{user.username}</p>
                <p className="text-sm text-gray-600">{user.bio ? user.bio.slice(0, 30) : "No bio"}...</p>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => navigate(`/profile/${user._id}`)}
                    className="w-full p-2 text-sm rounded bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                    View Profile
                  </button>

                  {currentTab === "Following" && <button onClick={() => handleUnfollow(user._id)} className="w-full p-2 rounded bg-slate-100 hover:bg-slate-200">Unfollow</button>}
                  {currentTab === "Pending" && <button onClick={() => acceptConnections(user._id)} className="w-full p-2 rounded bg-slate-100 hover:bg-slate-200">Accept</button>}
                  {currentTab === "Connections" && <button onClick={() => navigate(`/messages/${user._id}`)} className="w-full p-2 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1"><MessageSquare className="w-4 h-4" />Message</button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Connections;
