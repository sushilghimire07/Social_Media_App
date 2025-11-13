import express from "express";
import { seeController, sendMessage, getChatMessages, getRecentMessages } from "../controllers/MessageContoller.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {upload} from "../middlewares/multer.js";
import { protect } from "../middleware/auth.js";

const messagerouter = express.Router();

router.get("/:userId", seeController);
router.post("/send", upload.single("image"), protect,sendMessage);
router.get("/get",protect, getChatMessages);

export default messagerouter;
 