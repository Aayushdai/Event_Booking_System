import express from "express";
import authRoutes from "./routes/auth.routes.js";

const app = express();
app.use(express.json());

// app.get();
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);

export default app;