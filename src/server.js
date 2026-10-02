import app from "./app.js";
import dotenv from "dotenv";
import sequelize from "./config/db.js";
import User from "./models/User.js";

dotenv.config();

const PORT = process.env.PORT;


const StartServer = async () => {
    try{
        await sequelize.authenticate();
        console.log("Database connected successfully");

        
        app.listen(PORT, ()=>{
        console.log(`Server is running on port ${PORT}`);
})
    } catch (error) {
        console.error("Error connecting to the database:", error);
    }
}

StartServer();

