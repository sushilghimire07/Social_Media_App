import React, { useState } from "react";
import { dummyUserData } from "../assets/assets";
import { Pencil } from "lucide-react";

const ProfileModel = ({ setShowEdit }) => {
  const user = dummyUserData;
  const [editForm, setEditForm] = useState({
    username: user.username,
    bio: user.bio,
    location: user.location,
    profile_picture: null,
    full_name: user.full_name,
    cover_photo: null,
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    console.log("Saved profile data:", editForm);
    setShowEdit(false); // Close modal after saving
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 overflow-y-auto flex justify-center items-start pt-10">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg p-6 mb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h1>

        <form className="space-y-6" onSubmit={handleSaveProfile}>
          {/* Profile Picture */}
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium text-gray-700">Profile Picture</p>
            <label className="relative group cursor-pointer">
              <img
                src={
                  editForm.profile_picture
                    ? URL.createObjectURL(editForm.profile_picture)
                    : user.profile_picture
                }
                alt="profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="absolute inset-0 hidden group-hover:flex bg-black/20 rounded-full items-center justify-center">
                <Pencil className="w-5 h-5 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setEditForm({ ...editForm, profile_picture: e.target.files[0] })
                }
              />
            </label>
          </div>

          {/* Cover Photo */}
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm font-medium text-gray-700">Cover Photo</p>
            <label className="relative group cursor-pointer w-full">
              <img
                src={
                  editForm.cover_photo
                    ? URL.createObjectURL(editForm.cover_photo)
                    : user.cover_photo
                }
                alt="cover"
                className="w-full h-48 rounded-lg object-cover bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200"
              />
              <div className="absolute inset-0 hidden group-hover:flex bg-black/20 rounded-lg items-center justify-center">
                <Pencil className="w-6 h-6 text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) =>
                  setEditForm({ ...editForm, cover_photo: e.target.files[0] })
                }
              />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg"
              placeholder="Enter your name"
              value={editForm.full_name}
              onChange={(e) =>
                setEditForm({ ...editForm, full_name: e.target.value })
              }
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg"
              placeholder="Enter your username"
              value={editForm.username}
              onChange={(e) =>
                setEditForm({ ...editForm, username: e.target.value })
              }
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <textarea
              rows={3}
              className="w-full p-3 border border-gray-200 rounded-lg"
              placeholder="Write your bio"
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({ ...editForm, bio: e.target.value })
              }
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-200 rounded-lg"
              placeholder="Enter your location"
              value={editForm.location}
              onChange={(e) =>
                setEditForm({ ...editForm, location: e.target.value })
              }
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-end mt-4">
            <button
              type="button"
              onClick={() => setShowEdit(false)}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-900 transition"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModel;
