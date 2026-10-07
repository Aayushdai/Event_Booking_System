import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Venue = sequelize.define(
    "Venue",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        location: {
            type: DataTypes.STRING(200),
            allowNull: false,
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
        tableName: "venues",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);
export default Venue;