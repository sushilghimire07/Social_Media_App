import fs from "fs";
import User from "../models/User.js";
import imagekit from "../configs/imageKit.js";
import Connection from "../models/Connection.js";

// GET USER DATA
export const getUserData = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-password");

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({ success: true, user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE USER DATA
export const updateUserData = async (req, res) => {
  try {
    const userId = req.userId;
    let { username, bio, location, full_name } = req.body;

    const tempuser = await User.findById(userId);

    // Handle username change
    if (username && tempuser.username !== username) {
      const exists = await User.findOne({ username });
      if (exists) username = tempuser.username;
    }

    const updatedData = { username, bio, location, full_name };

    const profile = req.files?.profile?.[0];
    const cover = req.files?.cover?.[0];

    //     console.log("Files received:", req.files);
    // console.log("Body received:", req.body);

    if (profile?.path) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: profile.originalname,
      });
      updatedData.profile_picture = response.url;
    }

    if (cover?.path) {
      const buffer = fs.readFileSync(cover.path);
      const response = await imagekit.upload({
        file: buffer,
        fileName: cover.originalname,
      });
      updatedData.cover_photo = response.url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    return res.json({ success: true, user, message: "Profile updated" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DISCOVER USERS
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

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;
    if (!id)
      return res
        .status(400)
        .json({ success: false, message: "User id required" });

    const user = await User.findById(userId);
    if (user.following.includes(id))
      return res.json({ success: false, message: "Already following" });

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

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.body;

    const user = await User.findById(userId);
    if (!user.following.includes(id))
      return res.json({ success: false, message: "Not following" });

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

//send connection request

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;

    //check if user has sent more then 20 connection request

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequest = await Connection.find({
      from_user_id: userId,
      createdAt: { $gt: last24Hours },
    });
    if (connectionRequest.length >= 20) {
      return res.json({
        success: false,
        message:
          "You have sent more then 20 connection request 24 hr wait little bit",
      });
    }

    //check user are already connected

    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: userId },
        { from_user_id: id, to_user_id: id },
      ],
    });
    if (!connection) {
      await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });
      return res.json({
        success: true,
        message: "Connection request sent sucessfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.json({ success: false, message: "You are already connected" });
    }
    return res.json({ success: false, message: "Connection request pending" });
  } catch (error) {
     console.log(error);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// get user connection


export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate('connections followers following')

    const connection  = user.connections
    const followers  = user.followers
    const following = user.following

    const pendingConnections = (await Connection.find({
      to_user_id:userId,
      status:'pending'
    }).populate('from_user_id')).map((connection)=>{
      connection.from_user_id
    })
    res.json({success:true,connection,followers,following,pendingConnections})

  } catch (error) {
     console.log(error);
    return res.status(500).json({ success: false, message: err.message });
  }
};
// Accept connection request

export const aceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const {id} = req.body

    const connection = await Connection.findOne({from_user_id:id,to_user_id:userId})

    if(!connection){
      return res.j
      son({success:false,message:"Connection not found"})
    }
    const user = await User.findById(userId)
    user.connections.push(id);
    await user.save()

    const toUser = await User.findById(id)
    toUser.connections.push(userId);
    await toUser.save()
    
    connection.status = 'accepted'
    await connection.save()

    res.json({success:true,message:"Connection accepted succesfully"})

  } catch (error) {
     console.log(error);
    return res.status(500).json({ success: false, message: err.message });
  }
};
