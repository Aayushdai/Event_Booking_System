import Venue from "../models/Venue.js";

export const createVenue = async ({name, location})=> {
    const venue = await Venue.create({
        name, location,
    })
    return venue;
};

export const getAllVenues = async () => {
    return await Venue.findAll({
        order: [["id", "ASC"]],
    });
};

export const getVenueById = async (id) => {
    return await Venue.findByPk(id);
};

export const updateVenue = async (id, {name, location}) => {
    const venue = await Venue.findByPk(id);
    if(!venue) {
        throw new Error("Venue not found");
    }
    await venue.update({
        name,location,
    });
    return venue;
}

export const deleteVenue = async (id) => {
    const venue = await Venue.findByPk(id);
    if(!venue) {
        throw new Error("Venue not found");
    }
    await venue.destroy();

    return venue;
}