// middleware/auth.js
export const protect = async (req, res, next) => {
  try {
    if (!req.auth()) {
      return res.status(401).json({ success: false, message: "Auth middleware not setup" });
    }

    const authData = await req.auth();
    const userId = authData?.userId;

    if (!userId) {
      return res.status(401).json({ success: false, message: "not authenticated" });
    }

    req.userId = userId; // attach userId for controllers
    next();
  } catch (err) {
    console.log("Auth error:", err);
    return res.status(401).json({ success: false, message: err.message });
  }
};
