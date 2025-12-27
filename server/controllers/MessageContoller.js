import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

/* =====================================================
   ACTIVE SSE CONNECTIONS
===================================================== */
const connections = new Map();

/* =====================================================
   HELPER FUNCTIONS
===================================================== */

// Send SSE event to specific user
const sendToUser = (userId, payload) => {
  const connection = connections.get(userId);
  if (!connection) return;

  connection.write(`data: ${JSON.stringify(payload)}\n\n`);
};

// Upload image to ImageKit
const uploadImage = async (file) => {
  try {
    const buffer = fs.readFileSync(file.path);

    const uploaded = await imagekit.upload({
      file: buffer,
      fileName: file.originalname,
    });

    return imagekit.url({ path: uploaded.filePath });
  } finally {
    // Always remove temp file
    fs.existsSync(file.path) && fs.unlinkSync(file.path);
  }
};

/* =====================================================
   SSE CONTROLLER
===================================================== */
export const sseController = async (req, res) => {
  try {
    const { userId } = await req.auth();
    if (!userId) return res.status(401).end();

    // SSE Headers
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    });

    connections.set(userId, res);

    sendToUser(userId, { connected: true });
    console.log("🟢 SSE Connected:", userId);

    req.on("close", () => {
      connections.delete(userId);
      console.log("🔴 SSE Disconnected:", userId);
    });
  } catch (error) {
    console.error("SSE Error:", error);
    res.status(500).end();
  }
};

/* =====================================================
   SEND MESSAGE
===================================================== */
export const sendMessage = async (req, res) => {
  try {
    const from_user_id = req.userId;
    const { to_user_id, text } = req.body;
    const file = req.file;

    let media_url = "";
    const message_type = file ? "image" : "text";

    if (file) {
      media_url = await uploadImage(file);
    }

    const message = await Message.create({
      from_user_id,
      to_user_id,
      message_type,
      text,
      media_url,
    });

    // Notify both users
    sendToUser(from_user_id, message);
    sendToUser(to_user_id, message);

    console.log("📤 Message Sent:", from_user_id, "→", to_user_id);

    res.json({ success: true, message });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET RECENT CHATS
===================================================== */
export const getRecentMessages = async (req, res) => {
  try {
    const userId = req.userId;

    const messages = await Message.find({
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    })
      .sort({ createdAt: -1 })
      .lean();

    const recentChatsMap = new Map();

    for (const msg of messages) {
      const otherUserId =
        msg.from_user_id === userId ? msg.to_user_id : msg.from_user_id;

      if (recentChatsMap.has(otherUserId)) continue;

      const user = await User.findById(otherUserId).select(
        "_id full_name profile_picture"
      );

      recentChatsMap.set(otherUserId, {
        userId: otherUserId,
        user,
        lastMessage: msg,
      });
    }

    res.json({
      success: true,
      recentChats: Array.from(recentChatsMap.values()),
    });
  } catch (error) {
    console.error("❌ Recent Messages Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* =====================================================
   GET CHAT MESSAGES
===================================================== */
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
      {
        from_user_id: to_user_id,
        to_user_id: userId,
        seen: false,
      },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Chat Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
