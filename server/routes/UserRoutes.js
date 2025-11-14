import express from "express";
import {
  getUserData,
  updateUserData,
  discoverUsers,
  followUser,
  unfollowUser,
  sendConnectionRequest,
  acceptConnectionRequest,
  getUserConnections,
  getUserProfiles
} from "../controllers/UserController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../configs/multer.js";
import { getRecentMessages } from "../controllers/MessageContoller.js";

const router = express.Router();

router.get("/data", protect, getUserData);

router.post(
  "/update",
  protect,
  upload.fields([
    { name: "profile_picture", maxCount: 1 },
    { name: "cover_photo", maxCount: 1 }
  ]),
  updateUserData
);


router.post("/discover", protect, discoverUsers);
router.post("/follow", protect, followUser);
router.post("/unfollow", protect, unfollowUser);

router.post('/connect',protect,sendConnectionRequest)
router.post('/accept',protect,acceptConnectionRequest)
router.post('/get',protect,getUserConnections)
router.post('/profiles',protect,getUserProfiles)

router.get('/recent-messages',protect,getRecentMessages)



export default router;
