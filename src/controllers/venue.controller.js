import { createVenue, getAllVenues, getVenueById } from "../services/venue.service.js";

export const create = async (req, res)=> {
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
        console.error("Error creating venue:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
        
    };

export const getAll = async(req, res)=> {
    try{
        const venues = await getAllVenues();
        return res.status(200).json({
            message: "Venues retrieved successfully",
            venues,
        });
    } catch (error) {
        console.error("Error retrieving venues:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
        
    };

export const getById = async(req, res)=> {
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
        console.error("Error retrieving venue:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
};

export const update = async (req,res)=> {
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
        console.error("Error updating venue:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}

export const remove = async (req, res)=> {
    try{
        await deleteVenue(req.params.id);
        return res.status(200).json({
            message: "Venue deleted successfully",
        });
    }catch (error) {

        if (error.message === "Venue not found") {
            return res.status(404).json({
                message: "Venue not found",
            });
        }
        console.error("Error deleting venue:", error);
        return res.status(500).json({
            message: "Internal server error",
        });
    }
}