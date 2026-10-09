import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import logger from "../utils/logger.js";

export const requestLogger = pinoHttp({
    logger,
    genReqId: (req,res)=> {
        const requestId = randomUUID();
        res.setHeader("X-Request-Id", requestId);
        return requestId;
    },
    serializaers: {
        req(req) {
            return{
                id: req.id,
                method: req.method,

                url: req.url.split("?")[0],
                remoteAddress: req.remoteAddress,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },

    customerLogLevel(req,res,err){
        if(err || res.statusCode >= 500){
            return "error";
        }
        if(res.statusCode >= 400){
            return "warn";
        }
        return "info";
    },

    customeSuccessMessage(req,res) {
        return `${req.method} ${req.url.split("?")[0]} completed`;
    },

    customErrorMessage(req, res, err){
        return `${req.method} ${req.url.split("?")[0]} failed`;
    },

    autoLogging: {
        ignore: (req)=>
            req.url.split("?")[0] === "/api/health",
    },
});