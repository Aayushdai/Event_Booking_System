// import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// SMTP is disabled in this environment because outbound SMTP ports are restricted.
// Uncomment this block when SMTP access is available again.
// const smtpPort = Number(process.env.SMTP_PORT || 587);
// const smtpSecure = smtpPort === 465;

// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: smtpPort,
//     secure: smtpSecure,
//     requireTLS: !smtpSecure,
//     family: 4,

//     connectionTimeout: 15000,
//     greetingTimeout: 15000,
//     socketTimeout: 15000,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASSWORD,
//     },
    
// });

// transporter.verify((error, success) => {
//     if (error) {
//         console.error("Error connecting to SMTP server:", error);
//     } else {
//         console.log("Connected to SMTP server", success);
//     }
// });

export const sendVerificationEmail = async (email, verificationLink) => {
    console.log("SMTP disabled. Verification email was not sent.");
    console.log("Verification recipient:", email);
    console.log("Verification link:", verificationLink);

    // try {
    //     await transporter.sendMail({
    //         from: `"Event Booking System" <${process.env.SMTP_USER}>`,
    //         to: email,
    //         subject: "Verify your email",
    //         html: `
    //             <h2>Verify Your Email</h2>
    //             <p>Thank you for registering.</p>
    //             <p>Please click the link below to verify your email:</p>
    //             <a href="${verificationLink}">Verify Email</a>
    //         `,
    //     });
    // } catch (error) {
    //     const emailError = new Error(
    //         "Email service unavailable. Please check SMTP network access and credentials."
    //     );
    //     emailError.cause = error;
    //     emailError.code = "EMAIL_SERVICE_UNAVAILABLE";
    //     throw emailError;
    // }
};
