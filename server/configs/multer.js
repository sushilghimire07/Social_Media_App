import multer from "multer";

// Temporary storage in memory or disk
const storage = multer.diskStorage({}); // you can customize if needed

export const upload = multer({ storage });
