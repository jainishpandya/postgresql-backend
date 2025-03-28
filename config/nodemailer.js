import 'dotenv/config';
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    }
});

export const mailOptions = (email_reciever, subject, text, html) => {
    return {
        from: process.env.EMAIL_USER,
        to: email_reciever,
        subject: subject,
        text: text,
        html: html
    }
}
