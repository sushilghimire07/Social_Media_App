import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { clerkMiddleware } from "@clerk/express";
import userRouter from "./routes/UserRoutes.js";
import inngestRouter from "./inngest/serve.js";
import postRounter from "./routes/PostRoute.js";
import stroyRouter from "./routes/StoryRoutes.js";



const app = express();
await connectDB();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Server is running"));
app.use(inngestRouter); 
app.use("/api/user", userRouter);
app.use('/api/post',postRounter)
app.use('/api/story',stroyRouter)

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
