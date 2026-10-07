import {z} from "zod";
export const registerSchema = z.object({

    name: z
    .string()
    .min(2,"NAme must be at least 2 characters long")
    .max(100,"Name must be at most 100 characters long"),
    
    email:z
    .string()
    .email("Invalid email address")
    .max(100,"Email must be at most 100 characters long"),

    password:z
    .string()
    .min(6,"Password must be at least 6 characters long")
    .max(100,"Password must be at most 100 characters long"),


});

export const loginSchema = z.object({
    email:z
    .string()
    .email("Invalid email address"),

    password:z
    .string()
    .min(6,"Password must be at least 6 characters long")
});