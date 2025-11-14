import React, { useEffect, useState } from "react";
import { SearchIcon } from "lucide-react";
import Usercard from "../components/Usercard";
import Loading from "../components/Loading";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { fetchUser } from "../features/user/userSlice";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";

const Discover = () => {
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSearch = async (e) => {
    if (e.key === "Enter") {
      if (!input.trim()) return;

      try {
        setLoading(true);
        setUsers([]);

        const token = await getToken();

        const { data } = await api.post(
          "/api/user/discover",
          { input },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success || data.sucess) {
          setUsers(data.users);
        } else {
          toast.error(data.message);
        }

        setInput("");
      } catch (error) {
        toast.error(error.message);
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const token = await getToken();
      dispatch(fetchUser(token));
    })();
  }, [getToken]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Discover</h1>
          <p className="text-slate-600">Discover new topibazz people</p>
        </div>

        {/* Search bar */}
        <div className="mb-8 shadow-md border border-slate-200/60 bg-white/80">
          <div className="p-6">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search people by name, username, bio, location"
                className="pl-10 sm:pl-12 py-2 w-full border border-gray-200 rounded-md max-sm:text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyUp={handleSearch}
              />
            </div>
          </div>
        </div>

        {/* Users list */}
        <div className="flex flex-wrap gap-6">
          {users?.map((user) => (
            <Usercard user={user} key={user._id || user.id} />
          ))}
        </div>

        {loading && <Loading height="60vh" />}
      </div>
    </div>
  );
};

export default Discover;
