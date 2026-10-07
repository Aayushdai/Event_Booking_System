import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Seat = sequelize.define(
    "Seat",
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        venue_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },

        seat_number: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },

        seat_type: {
            type: DataTypes.ENUM("regular", "premium", "vip"),
            allowNull: false,
            defaultValue: "regular",
        },
    },
    {
        tableName: "seats",
        timestamps: false,
    }
);

export default Seat;