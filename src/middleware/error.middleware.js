import logger from "../utils/logger.js";

export const notFound = (req, res, next) => {
    const error = new Error(
        `Route not found: ${req.method} ${req.originalUrl}`
    );

    error.statusCode = 404;
    next(error);
};

export const errorHandler = (err, req, res, next) => {

    if (res.headerSent) {
        return next(err);
    }
  const statusCode = err.statusCode || 500;

  const context = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    statusCode,
  };

  if(statusCode >=500){
    logger.error(
        {
            ...context,
            err,
        },
        "Request failed"
    );
  }else if (statusCode >=400){
    logger.warn(
        {
            ...context,
            message: err.message,
        },
        "Request rejected"
        
    )
  }


    return res.status(statusCode).json({
        message:
            statusCode === 500
                ? "Internal server error"
                : err.message,
    });
};