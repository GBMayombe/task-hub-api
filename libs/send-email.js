import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  throw new Error('SENDGRID_API_KEY is not configured');
}
sgMail.setApiKey(apiKey);

const fromEmail = process.env.FROM_EMAIL;

export const sendEmail = async (to, subject, html) => {
  const msg = {
    to,
    from: fromEmail,
    subject,
    html,
  };

  try {
    await sgMail.send(msg);
    console.log('Email sent successfully');

    return true;
  } catch (error) {
    console.error(`
    Error code: ${error.code}    
    Error Msg: ${error.message}
    `);

    console.log(error.response.body);
    return false;
  }
};
