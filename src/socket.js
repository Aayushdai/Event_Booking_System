import { Server } from "socket.io";

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
        },
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);

        socket.on("join:event", (eventId) => {
            socket.join(`event:${eventId}`);
        });

        socket.on("leave:event", (eventId) => {
            socket.leave(`event:${eventId}`);
        });

        socket.on("disconnect", () => {
            console.log("Socket disconnected:", socket.id);
        });
        socket.on("join:event", (eventId) => {
    socket.join(`event:${eventId}`);

    console.log(
        `Socket ${socket.id} joined event:${eventId}`
    );
});
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized");
    }

    return io;
};