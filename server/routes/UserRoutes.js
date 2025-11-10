import express from "express";
import {
  getUserData,
  updateUserData,
  discoverUsers,
  followUser,
  unfollowUser,
  sendConnectionRequest,
  aceptConnectionRequest,
  getUserConnections
} from "../controllers/UserController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../configs/multer.js";

const router = express.Router();

router.get("/data", protect, getUserData);

router.post(
  "/update",
  protect,
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ]),
  updateUserData
);

router.post("/discover", protect, discoverUsers);
router.post("/follow", protect, followUser);
router.post("/unfollow", protect, unfollowUser);

router.post('/connect',protect,sendConnectionRequest)
router.post('/connect',protect,aceptConnectionRequest)
router.post('/get',protect,getUserConnections)



export default router;
