import express from "express";
import { serve } from "inngest/express";
import { inngest, functions } from "./index.js";

const router = express.Router();

// Mount Inngest handler
router.use("/api/inngest", serve({ client: inngest, functions }));

export default router;
