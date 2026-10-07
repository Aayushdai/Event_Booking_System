import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    
});

export const sendVerificationEmail = async (email, verificationLink) => {
    await transporter.sendMail({
        from: `"Event Booking System" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Verify your email",
        html: `
            <h2>Verify Your Email</h2>
            <p>Thank you for registering.</p>
            <p>Please click the link below to verify your email:</p>
            <a href="${verificationLink}">Verify Email</a>
        `,
    });
};