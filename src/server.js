
import dotenv from "dotenv";
import { createServer } from "http";

import app from "./app.js";
import sequelize from "./config/db.js";
import { initializeSocket } from "./socket.js";
import logger from "./utils/logger.js";

import "./models/index.js";
import "./jobs/booking-expiration.job.js";
import "./jobs/payment-reconciliation.job.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await sequelize.authenticate();

        logger.info("Database connected successfully");

        const httpServer = createServer(app);

        initializeSocket(httpServer);

        httpServer.listen(PORT, () => {
            logger.info(
                { port: PORT },
                "Server is running"
            );
        });
    } catch (error) {
        logger.fatal(
            { err: error },
            "Failed to start server"
        );

        process.exitCode = 1;
    }
};

startServer();
