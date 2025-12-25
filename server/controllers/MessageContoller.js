import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// ---------------- ACTIVE CONNECTIONS ----------------
const connections = {};

// =================== HELPER FUNCTIONS ===================

// Send SSE event to a specific user
const sendToUser = (userId, data) => {
  const conn = connections[userId];
  if (conn) conn.write(`data: ${JSON.stringify(data)}\n\n`);
};

// Upload image to ImageKit
const uploadImage = async (file) => {
  const buffer = fs.readFileSync(file.path);

  const uploaded = await imagekit.upload({
    file: buffer,
    fileName: file.originalname,
  });

  fs.unlinkSync(file.path);

  return imagekit.url({ path: uploaded.filePath });
};

// =================== SSE CONTROLLER ===================
export const seeController = async (req, res) => {
  try {
    const { userId } = await req.auth();
    if (!userId) return res.status(401).end();

    // SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    connections[userId] = res;

    // Notify frontend
    sendToUser(userId, { connected: true });

    console.log("🟢 SSE Connected:", userId);

    req.on("close", () => {
      delete connections[userId];
      console.log("🔴 SSE Disconnected:", userId);
    });
  } catch (err) {
    console.error("SSE Error:", err);
    res.status(500).end();
  }
};

// =================== SEND MESSAGE ===================
export const sendMessage = async (req, res) => {
  try {
    const from_user_id = req.userId;
    const { to_user_id, text } = req.body;
    const file = req.file;

    let media_url = "";
    let message_type = file ? "image" : "text";

    // Upload image if exists
    if (file) media_url = await uploadImage(file);

    const message = await Message.create({
      from_user_id,
      to_user_id,
      message_type,
      text,
      media_url,
    });

    // Send SSE to both sender and receiver
    sendToUser(from_user_id, message);
    sendToUser(to_user_id, message);

    console.log("📤 Message Sent:", from_user_id, "→", to_user_id);

    res.json({ success: true, message });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== GET RECENT CHATS ===================
export const getRecentMessages = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const recentChats = [];
    const added = new Set();

    for (const msg of messages) {
      const otherUserId =
        msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;

      if (added.has(otherUserId)) continue;
      added.add(otherUserId);

      const userObj = await User.findById(otherUserId).select(
        "_id full_name profile_picture"
      );

      recentChats.push({
        userId: otherUserId,
        user: userObj,
        lastMessage: msg,
      });
    }

    res.json({ success: true, recentChats });
  } catch (error) {
    console.error("❌ Recent Messages Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =================== GET CHAT MESSAGES ===================
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark messages as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Chat Fetch Error:", error);
    res.json({ success: false, message: error.message });
  }
};
