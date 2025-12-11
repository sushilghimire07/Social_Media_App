// middleware/auth.js
export const protect = async (req, res, next) => {
  try {
    const authData = await req.auth();   // call once

    if (!authData?.userId) {
      return res.status(401).json({ success: false, message: "not authenticated" });
    }

    req.userId = authData.userId;
    next();

  } catch (err) {
    console.log("Auth error:", err);
    return res.status(401).json({ success: false, message: "Authentication failed" });
  }
};
