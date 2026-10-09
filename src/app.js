import express from "express";
import cors from "cors";   
import cookieParser from "cookie-parser"; 
import authRoutes from "./routes/auth.routes.js";
import { login } from "./controllers/auth.controller.js";
import { loginLimiter } from "./middleware/ratelimit.middleware.js";
import venueRoutes from "./routes/venue.routes.js";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import seatRoutes from "./routes/seat.routes.js";
import eventRoutes from "./routes/event.routes.js";
import eventSeatRoutes from "./routes/eventSeat.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";
const app = express();
app.use(requestLogger);
app.use(express.json());
app.use(cookieParser());

app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// app.get();
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);

app.post("/api/login", loginLimiter, login);

app.use("/api/venues", venueRoutes);

app.use("/api/seats", seatRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/event-seats", eventSeatRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
