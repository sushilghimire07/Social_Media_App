import express from "express";
import {  sendMessage, getChatMessages, getRecentMessages } from "../controllers/MessageContoller.js";
import { upload } from "../configs/multer.js";
import { protect } from "../middleware/auth.js";




const messagerouter = express.Router();

// SSE - NO PROTECT
// messagerouter.get("/sse", seeController);


messagerouter.post("/get", protect, getChatMessages);
messagerouter.get("/recent", protect, getRecentMessages);
messagerouter.post("/send", protect, upload.single("image"), sendMessage);


export default messagerouter;
