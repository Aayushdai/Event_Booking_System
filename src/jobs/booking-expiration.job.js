import cron from "node-cron";
import { expireBookings } from "../services/booking-expiration.service.js";

cron.schedule("* * * * *", async () => {
    try{
        const expiredCount = await expireBookings();

        if(expiredCount > 0){
            console.log(
                `Booking expireation job: ${expiredCount} booking(s) expired`
            );
        }
    }catch(error){
        console.error("Error in booking expiration job:", error);
    }
    
});