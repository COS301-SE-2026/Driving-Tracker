import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendAuthEmail = async (to: string, subject: string, html: string) => {
	try{
		const info = await transporter.sendMail({
			from: `Driving Tracker <${process.env.EMAIL_USER}>`,
			to,
			subject,
			html
		});
		console.log('Email sent successfully:', info.messageId);
	}catch(error){
		console.log('Failed to send email', error)
	}
};