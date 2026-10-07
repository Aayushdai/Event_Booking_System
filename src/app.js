import express from "express";
import cors from "cors";    
import authRoutes from "./routes/auth.routes.js";
import venueRoutes from "./routes/venue.routes.js";
import seatRoutes from "./routes/seat.routes.js";
import eventRoutes from "./routes/event.routes.js";
import eventSeatRoutes from "./routes/eventSeat.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();
app.use(express.json());

app.use(
    cors({
        origin: "http://localhost:5173",
    })
);

// app.get();
app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "Server is healthy" });
});

app.use("/api/auth", authRoutes);

app.use("/api/venues", venueRoutes);

app.use("/api/seats", seatRoutes);

app.use("/api/events", eventRoutes);

app.use("/api/event-seats", eventSeatRoutes);

app.use("/api/bookings", bookingRoutes);

app.use("/api/payments", paymentRoutes);

export default app;