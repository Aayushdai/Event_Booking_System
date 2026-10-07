import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const BookingItem = sequelize.define(
    "BookingItem",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        event_seat_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
    },
    {
        tableName: "booking_items",
        timestamps: false,
    }
);

export default BookingItem;