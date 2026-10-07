import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Payment = sequelize.define(
    "Payment",
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

        provider: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },

        transaction_uuid: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },

        reference_id: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },

        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },

        status: {
            type: DataTypes.ENUM(
                "pending",
                "success",
                "failed",
                "expired",
                "refunded"
            ),
            allowNull: false,
            defaultValue: "pending",
        },

        paid_at: {
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
        tableName: "payments",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

export default Payment;