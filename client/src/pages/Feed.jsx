import React, { useEffect, useState } from "react";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import StoriesBar from "../components/StoriesBar";
import PostCard from "../components/PostCard";
import RecentMessages from "../components/RecentMessages";
import { useAuth } from "@clerk/clerk-react";
import api from "../api/axios";
import { toast } from "react-hot-toast";

const Feed = () => {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await api.get("/api/post/feed", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data.success) {
        setFeeds(data.posts);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeeds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="h-full overflow-y-scroll no-scroller py-10 xl:pr-5 flex items-start justify-center xl:gap-8">
      {/* Left center section */}
      <div className="space-y-6">
        <StoriesBar />
        <div className="p-4 space-y-6">
          {feeds.length > 0 ? (
            feeds.map((post) => <PostCard key={post._id} post={post} />)
          ) : (
            <p className="text-center text-gray-500">No posts available</p>
          )}
        </div>
      </div>

      {/* Right sidebar */}
      <div className="max-xl:hidden sticky top-1">
        <div className="max-w-xs bg-white text-xs p-4 rounded-md flex flex-col gap-2 shadow">
          <h3 className="text-slate-800 font-semibold">Sponsored</h3>
          <img
            src={assets.sponsored_img}
            className="w-full h-32 object-cover rounded-md"
            alt="Sponsored"
          />
          <p className="text-slate-600 font-medium">Email Marketing</p>
          <p className="text-slate-400">
            SuperCharge Your PC with God of Thunder Charger
          </p>
        </div>

        <RecentMessages />
      </div>
    </div>
  );
};

export default Feed;
