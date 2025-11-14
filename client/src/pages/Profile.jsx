import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useSelector } from "react-redux";
import moment from "moment";
import toast from "react-hot-toast";
import api from "../api/axios";
import Loading from "../components/Loading";
import UserProfileInfo from "../components/UserProfileInfo";
import PostCard from "../components/PostCard";
import ProfileModel from "../components/ProfileModel";

const Profile = () => {
  const currentUser = useSelector((state) => state.user.value);
  const { getToken, isLoaded } = useAuth();
  const { profileId } = useParams();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [showEdit, setShowEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch user profile and posts
  const fetchUser = async (id) => {
  setLoading(true);
  try {
    const token = await getToken();

    const { data } = await api.post(
      `/api/user/profiles`,
      { profileId: id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (data.success) {
      setUser(data.profile);
      setPosts(data.posts || []);
    } else {
      toast.error(data.message);
      setUser(null);
    }
  } catch (error) {
    toast.error("Failed to load profile.");
    setUser(null);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  if (!isLoaded || !getToken) return;
  console.log("Profile ID from URL:", profileId);
  console.log("Current user from Redux:", currentUser);

  const idToFetch = profileId || currentUser?._id;
  console.log("Final ID used to fetch:", idToFetch);

  if (idToFetch) {
    fetchUser(idToFetch);
  }
}, [profileId, currentUser, isLoaded]);


  if (loading) return <Loading />;
  if (!user)
    return (
      <p className="text-center mt-10 text-gray-600">
        User not found or unable to load profile.
      </p>
    );

  return (
    <div className="relative h-full overflow-y-auto bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {/* Cover Photo */}
          <div className="h-40 md:h-56 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200">
            {user.cover_photo && (
              <img
                src={user.cover_photo}
                className="w-full h-full object-cover"
                alt="cover"
              />
            )}
          </div>

          {/* User Info + Edit */}
          <UserProfileInfo
            user={user}
            posts={posts}
            profileId={profileId}
            setShowEdit={setShowEdit}
          />
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow p-1 flex max-w-md mx-auto">
            {["posts", "media", "likes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Posts Section */}
          {activeTab === "posts" && (
            <div className="mt-6 flex flex-col items-center gap-6">
              {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
              ) : (
                <p className="text-gray-500 mt-4">No posts yet.</p>
              )}
            </div>
          )}

          {/* Media Section */}
          {activeTab === "media" && (
            <div className="flex flex-wrap mt-6 gap-3 justify-center">
              {posts
                .filter((post) => post.image_urls?.length > 0)
                .map((post) =>
                  post.image_urls.map((image, index) => (
                    <Link
                      target="_blank"
                      to={image}
                      key={index}
                      className="relative group"
                    >
                      <img
                        src={image}
                        className="w-60 aspect-video object-cover rounded-lg"
                        alt="post media"
                      />
                      <p className="absolute bottom-0 right-0 text-xs p-1 px-3 backdrop-blur-xl text-white opacity-0 group-hover:opacity-100 transition duration-300">
                        Posted {moment(post.createdAt).fromNow()}
                      </p>
                    </Link>
                  ))
                )}
            </div>
          )}

          {/* Likes Section */}
          {activeTab === "likes" && (
            <p className="text-center text-gray-500 mt-6">
              Liked posts will appear here.
            </p>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEdit && <ProfileModel setShowEdit={setShowEdit} />}
    </div>
  );
};

export default Profile;
