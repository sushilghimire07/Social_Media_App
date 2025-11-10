import fs from "fs";
import User from "../models/User.js";
import Connection from "../models/Connection.js";
import imagekit from "../configs/imageKit.js";
import { inngest } from "../inngest/functions.js";

// -------------------- GET USER DATA --------------------
export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
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
      if (exists) username = tempUser.username;
    }

    const updatedData = { username, bio, location, full_name };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    if (profile?.path) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({ file: buffer, fileName: profile.originalname });
      updatedData.profile_picture = response.url;
    }

    if (cover?.path) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({ file: buffer, fileName: cover.originalname });
      updatedData.cover_photo = response.url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, { new: true });

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

    const filteredUsers = allUsers.filter((u) => u._id.toString() !== userId);
    return res.json({ success: true, filteredUsers });
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
    if (!id) return res.status(400).json({ success: false, message: "User id required" });

    const user = await User.findById(userId);
    if (user.following.includes(id)) return res.json({ success: false, message: "Already following" });

    user.following.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers.push(userId);
    await toUser.save();

    return res.json({ success: true, message: "Followed" });
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
    if (!user.following.includes(id)) return res.json({ success: false, message: "Not following" });

    user.following = user.following.filter((u) => u !== id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.followers = toUser.followers.filter((u) => u !== userId);
    await toUser.save();

    return res.json({ success: true, message: "Unfollowed" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- SEND CONNECTION REQUEST --------------------
export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const requests = await Connection.find({ from_user_id: userId, createdAt: { $gt: last24Hours } });
    if (requests.length >= 20)
      return res.json({ success: false, message: "You have sent more than 20 requests in 24h" });

    const existing = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: id, to_user_id: userId },
      ],
    });

    if (!existing) {
      const newConnection = await Connection.create({ from_user_id: userId, to_user_id: id });

      // Trigger Inngest event for email
      await inngest.send({ name: "app/connection-request", data: { connectionId: newConnection._id } });

      return res.json({ success: true, message: "Connection request sent successfully" });
    } else if (existing.status === "accepted") {
      return res.json({ success: false, message: "Already connected" });
    }

    return res.json({ success: false, message: "Connection request pending" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- ACCEPT CONNECTION REQUEST --------------------
export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body; // from_user_id

    const connection = await Connection.findOne({ from_user_id: id, to_user_id: userId });
    if (!connection) return res.json({ success: false, message: "Connection not found" });

    connection.status = "accepted";
    await connection.save();

    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();

    const toUser = await User.findById(id);
    toUser.connections.push(userId);
    await toUser.save();

    return res.json({ success: true, message: "Connection accepted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// -------------------- GET USER CONNECTIONS --------------------
export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate("connections followers following");

    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate("from_user_id")
    ).map((c) => c.from_user_id);

    res.json({
      success: true,
      connection: user.connections,
      followers: user.followers,
      following: user.following,
      pendingConnections,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
