import Seat from "../models/Seat.js";
import Venue from "../models/Venue.js";

export const createSeat = async ({venue_id, seat_number, seat_type}) => {
    const venue = await Venue.findByPk(venue_id);

    if(!venue) {    
        throw new Error("Venue not found");
    }

    const existingSeat = await Seat.findOne({
        where: {
            venue_id,
            seat_number,
        },
    });

    if(existingSeat){
        throw new Error("Seat already exists in this venue");


    }

    const seat = await Seat.create({
        venue_id,
        seat_number,
        seat_type,
    });
    return seat;
};

export const getSeatsByVenue = async (venue_id)=> {
    return await Seat.findAll({
        where: { venue_id},
        order: [["id", "ASC"]],
    });
};

export const getSeatById = async (id)=> {
    return await Seat.findByPk(id);
};


export const updateSeat = async (id, {seat_number, seat_type}) => {
    const seat = await Seat.findByPk(id);
    if(!seat) {
        throw new Error("Seat not found");
    }
    const existingSeat = await Seat.findOne({
        where: {
            venue_id: seat.venue_id,
            seat_number,
        },
    });
    if(existingSeat && existingSeat.id !== seat.id) {
        throw new Error("Seat number already exists in this venue");
    }
    await seat.update({seat_number, seat_type});
    return seat;
    
};

export const deleteSeat = async(id) => {
    const seat = await Seat.findByPk(id);

    if(!seat) {
        throw new Error("Seat not found");
    }
    await seat.destroy();

    return seat;
};
