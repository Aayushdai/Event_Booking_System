import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EventSeat = sequelize.define(
    "EventSeat",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        event_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        seat_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        status: {
            type: DataTypes.ENUM(
                "available",
                "held",
                "booked"
            ),
            allowNull: false,
            defaultValue: "available",
        },

        hold_expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "event_seats",
        timestamps: false,
    }
);

export default EventSeat;