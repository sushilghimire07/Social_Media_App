import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Message from "../models/Message.js";

// -------------------- ACTIVE CONNECTIONS --------------------
const connections = {};

// -------------------- SSE CONTROLLER --------------------
export const seeController = (req, res) => {
  try {
    const { userId } = req.params;
    console.log("🟢 New Client Connected:", userId);

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Add to active connections
    connections[userId] = res;

    // Send initial event
    res.write(`data: ${JSON.stringify({ message: "Connected to SSE stream" })}\n\n`);

    // Remove connection when client disconnects
    req.on("close", () => {
      delete connections[userId];
      console.log("🔴 Client disconnected:", userId);
    });
  } catch (error) {
    console.error("❌ SSE Connection Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------- SEND MESSAGE --------------------
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id, text } = req.body;
    const image = req.file;

    let media_url = "";
    let message_type = image ? "image" : "text";

    // Upload image to ImageKit
    if (message_type === "image") {
      const fileBuffer = fs.readFileSync(image.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: image.originalname,
      });

      media_url = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });

      fs.unlinkSync(image.path); // delete temp file
    }

    // Save message to DB
    const message = await Message.create({
      from_user_id: userId,
      to_user_id,
      text,
      message_type,
      media_url,
    });

    res.json({ success: true, message });

    // Real-time update to receiver
    const messageWithUserData = await Message.findById(message._id).populate(
      "from_user_id"
    );

    if (connections[to_user_id]) {
      connections[to_user_id].write(
        `data: ${JSON.stringify(messageWithUserData)}\n\n`
      );
    }

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// -------------------- GET CHAT MESSAGES --------------------
export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { to_user_id } = req.body;

    // Fetch both directions of conversation
    const messages = await Message.find({
      $or: [
        { from_user_id: userId, to_user_id },
        { from_user_id: to_user_id, to_user_id: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("from_user_id to_user_id");

    // Mark as seen
    await Message.updateMany(
      { from_user_id: to_user_id, to_user_id: userId, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// -------------------- GET RECENT MESSAGES --------------------
export const getRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth();

    const messages = await Message.find({
      $or: [{ from_user_id: userId }, { to_user_id: userId }],
    })
      .sort({ createdAt: -1 })
      .populate("from_user_id to_user_id");
    const recentChatsMap = new Map();

    return res.json({ success: true, recentChats });
  } catch (error) {
    console.error("❌ Error fetching recent messages:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
