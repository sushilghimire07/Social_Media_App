import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import { inngest } from "../inngest/index.js";

export const addUserStory = async (req, res) => {
  try {
    const { userId } = req.auth;

    const { content, media_type, background_color } = req.body;
    const media = req.file;
    let media_url = "";

    // ✅ Upload media to ImageKit (if image or video)
    if ((media_type === "image" || media_type === "video") && media) {
      const fileBuffer = fs.readFileSync(media.path);

      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: media.originalname,
      });

      media_url = response.url;
      fs.unlinkSync(media.path);
    }
    const story = await Story.create({
      user: userId,
      content,
      media_url,
      media_type,
      background_color,
    });
    await inngest.send({
      name: "app/story.delete",
      data: {
        storyId: story._id,
      },
    });

    // ✅ Response
    res.json({
      success: true,
      message: "Story added successfully",
      story,
    });
  } catch (error) {
    console.error("Error adding story:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};

export const getStories = async (req, res) => {
  try {
    const { userId } = req.auth;

    // ✅ Fetch the user
    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    const userIds = [
      userId,
      ...(user.connections || []),
      ...(user.following || []),
    ];
    const stories = await Story.find({
      user: { $in: userIds },
    })
      .populate("user")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Stories fetched successfully",
      stories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.json({
      success: false,
      message: error.message,
    });
  }
};
