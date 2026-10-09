import { createVenue, getAllVenues, getVenueById, updateVenue, deleteVenue } from "../services/venue.service.js";

export const create = async (req, res, next)=> {
    try {
        const { name, location} = req.body;

        if(!name || !location) {
            return res.status(400).json({
                message: "Name and location are required",
            });
        }
        const venue = await createVenue({name, location});

        return res.status(201).json({
            message: "Venue created successfully",
            venue,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
        
    };

export const getAll = async(req, res, next)=> {
    try{
        const venues = await getAllVenues();
        return res.status(200).json({
            message: "Venues retrieved successfully",
            venues,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
        
    };

export const getById = async(req, res, next)=> {
    try{
        const { id } = req.params;
        if(!id) {
            return res.status(400).json({
                message: "Venue ID is required",
            });
        }
        const venue = await getVenueById(id);
        if(!venue) {
            return res.status(404).json({
                message: "Venue not found",
            });
        }
        return res.status(200).json({
            message: "Venue retrieved successfully",
            venue,
        });
    } catch (error) {
        error.statusCode = 500;
        return next(error);
    }
};

export const update = async (req,res, next)=> {
    try{
        const {name, location} = req.body;
        if (!name || !location) {
            return res.status(400).json({
                message: "Name and location are required",
            });
        }

        const venue = await updateVenue(req.params.id, {name, location});
        return res.status(200).json({
            message: "Venue updated successfully",
            venue,
        });
    } catch (error) {
        error.statusCode =
        error.messagge === "Venu not found" ? 404 : 500;
        return next(error);
    }
};

export const remove = async (req, res, next)=> {
    try{
        await deleteVenue(req.params.id);
        return res.status(200).json({
            message: "Venue deleted successfully",
        });
    }catch (error) {

        error.statusCode =
        error.message === "Venue not found" ? 404 : 500;

        return next(error);
    }
}