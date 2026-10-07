import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Booking = sequelize.define(
    "Booking",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        event_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        total_amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        status: {
            type: DataTypes.ENUM(
                "pending",
                "confirmed",
                "payment_failed",
                "expired",
                "cancelled"
            ),
            allowNull: false,
            defaultValue: "pending",
        },

        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
    },
    {
        tableName: "bookings",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Booking;