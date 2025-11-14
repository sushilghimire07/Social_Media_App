import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "@clerk/express";

// ---------------- ACTIVE CONNECTIONS ----------------
const connections = {};


// ---------------- SSE CONTROLLER ----------------
export const seeController = async (req, res) => {
  try {
    const { userId } = await req.auth(); 
    if (!userId) return res.status(401).end();

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    connections[userId] = res;

    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

    req.on("close", () => {
      delete connections[userId];
      console.log("🔴 SSE Disconnected:", userId);
    });

    console.log("🟢 SSE Connected:", userId);
    console.log("Active connections:", Object.keys(connections));
  } catch (err) {
    console.error("SSE Error:", err);
    res.status(500).end();
  }
};



// ---------------- SEND MESSAGE ----------------
export const sendMessage = async (req, res) => {
  try {
    const from_user_id = req.auth.userId;  
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    // Image upload
    if (image) {
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });
      media_url = imagekit.url({ path: response.filePath });
      fs.unlinkSync(image.path);
    }

    // Create message in MongoDB
    const message = await Message.create({
      from_user_id,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    // Send message to both sender and receiver
    [from_user_id, to_user_id].forEach((uid) => {
      if (connections[uid]) {
        connections[uid].write(`data: ${JSON.stringify(message)}\n\n`);
      }
    });

    console.log("📤 Sent To:", from_user_id, to_user_id);
    console.log("Active:", Object.keys(connections));

    res.json({ success: true, message });

  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// ---------------- GET CHAT MESSAGES ----------------
export const getChatMessages = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { to_user_id } = req.body;

    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    }).sort({ createdAt: 1 });

    // Mark as seen
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
export const getRecentMessages = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const messages = await Message.find({
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    })
      .sort({ createdAt: -1 })
      .lean(); // convert to plain JS objects

    const recentChats = [];

    for (const msg of messages) {
      const otherUserId = msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;

      // Fetch other user details
      const userObj = await User.findById(otherUserId).select("_id full_name profile_picture");

      if (!recentChats.some((c) => c.userId === otherUserId)) {
        recentChats.push({
          userId: otherUserId,
          user: userObj,
          lastMessage: msg,
        });
      }
    }

    res.json({ success: true, recentChats });
  } catch (error) {
    console.error("❌ Recent Messages Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};