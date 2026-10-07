import app from "./app.js";
import dotenv from "dotenv";
import { createServer } from "http";
import sequelize from "./config/db.js";
import { initializeSocket } from "./socket.js";
import "./models/index.js";
import "./jobs/booking-expiration.job.js";

dotenv.config();

const PORT = process.env.PORT;

const StartServer = async () => {
    try{
        await sequelize.authenticate();
        console.log("Database connected successfully");
        
        const httpServer = createServer(app);

        initializeSocket(httpServer);

        httpServer.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
})
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

StartServer();

