import fs from "fs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import Post from "../models/Post.js";
import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/index.js";

// -------------------- GET LOGGED-IN USER DATA --------------------
export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select("-password");

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- UPDATE USER DATA --------------------
export const updateUserData = async (req, res) => {
  try {
    const userId = req.userId;
    let { username, bio, location, full_name } = req.body;

    const tempUser = await User.findById(userId);

    if (username && tempUser.username !== username) {
      const exists = await User.findOne({ username });
      if (exists) username = tempUser.username; // avoid duplicate username
    }

    const updatedData = { username, bio, location, full_name };

    const profile = req.files?.profile_picture?.[0];
    const cover = req.files?.cover_photo?.[0];

    if (profile?.path) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });
      updatedData.profile_picture = response.url;
      fs.unlinkSync(profile.path);
    }

    if (cover?.path) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });
      updatedData.cover_photo = response.url;
      fs.unlinkSync(cover.path);
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    return res.json({ success: true, user, message: "Profile updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- DISCOVER USERS --------------------
export const discoverUsers = async (req, res) => {
  try {
    const userId = req.userId;
    const { input } = req.body;

    const allUsers = await User.find({
      $or: [
        { username: new RegExp(input, "i") },
        { email: new RegExp(input, "i") },
        { full_name: new RegExp(input, "i") },
        { location: new RegExp(input, "i") },
      ],
    });

    const filtered = allUsers.filter((u) => u._id.toString() !== userId);

    return res.json({ success: true, users: filtered });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- FOLLOW USER --------------------
export const followUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;

    if (!id) return res.json({ success: false, message: "User id required" });

    const user = await User.findById(userId);
    const target = await User.findById(id);

    if (!target)
      return res.json({ success: false, message: "Target user not found" });

    if (user.following.includes(id))
      return res.json({ success: false, message: "Already following" });

    user.following.push(id);
    target.followers.push(userId);

    await user.save();
    await target.save();

    return res.json({ success: true, message: "Followed" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- SEND CONNECTION REQUEST --------------------
export const sendConnectionRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;

    if (!id)
      return res.json({ success: false, message: "Receiver id required" });

    const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const reqCount = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24 },
    });

    if (reqCount.length >= 20)
      return res.json({
        success: false,
        message: "You have sent more than 20 requests in 24 hours",
      });

    const check = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!check) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (check.status === "accepted") {
      return res.json({ success: false, message: "Already connected" });
    }

    return res.json({
      success: false,
      message: "Connection request pending",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserProfiles = async (req, res) => {
  try {
    const { profileId } = req.body;

    if (!profileId) {
      return res.status(400).json({ success: false, message: "Profile ID missing" });
    }

    const user = await User.findById(profileId)
      .populate("followers", "full_name username profile_picture")
      .populate("following", "full_name username profile_picture")
      .populate("connections", "full_name username profile_picture");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Optional: fetch posts
    const posts = await Post.find({ user: profileId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      profile: user,
      posts,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -------------------- GET USER CONNECTIONS PAGE --------------------
export const getUserConnections = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const connections = await User.find({
      _id: { $in: user.connections },
    });

    const followers = await User.find({
      _id: { $in: user.followers },
    });

    const following = await User.find({
      _id: { $in: user.following },
    });

    const pendingDocs = await Connection.find({
      to_user_id: userId,
      status: "pending",
    });

    const pendingConnections = await User.find({
      _id: { $in: pendingDocs.map((c) => c.from_user_id) },
    });

    return res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// -------------------- ACCEPT CONNECTION REQUEST --------------------
export const acceptConnectionRequest = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;

    // Find the connection request
    const connection = await Connection.findOne({
      from_user_id: id,
      to_user_id: userId,
    });

    if (!connection)
      return res.json({ success: false, message: "Connection not found" });

    connection.status = "accepted";
    await connection.save();

    // Update both users' connections
    const user = await User.findById(userId);
    const other = await User.findById(id);

    if (!user.connections.includes(id)) user.connections.push(id);
    if (!other.connections.includes(userId)) other.connections.push(userId);

    await user.save();
    await other.save();

    return res.json({
      success: true,
      message: "Connection accepted successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};


// -------------------- UNFOLLOW USER --------------------
export const unfollowUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;

    const user = await User.findById(userId);
    const target = await User.findById(id);

    user.following = user.following.filter((u) => u.toString() !== id);
    target.followers = target.followers.filter(
      (u) => u.toString() !== userId
    );

    await user.save();
    await target.save();

    return res.json({
      success: true,
      message: "Unfollowed successfully",
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
