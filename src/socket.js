
import { Server } from "socket.io";
import logger from "./utils/logger.js";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
        },
    });

    io.on("connection", (socket) => {
        logger.info(
            { socketId: socket.id },
            "Socket connected"
        );

        socket.on("join:event", (eventId) => {
            const room = `event:${eventId}`;

            socket.join(room);

            logger.info(
                {
                    socketId: socket.id,
                    eventId,
                },
                "Socket joined event room"
            );
        });

        socket.on("leave:event", (eventId) => {
            socket.leave(`event:${eventId}`);
        });

        socket.on("disconnect", () => {
            logger.info(
                { socketId: socket.id },
                "Socket disconnected"
            );
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error(
            "Socket.IO has not been initialized"
        );
    }

    return io;
};
