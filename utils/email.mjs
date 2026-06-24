import nodemailer from 'nodemailer';
import pug from 'pug'
import { convert } from 'html-to-text';
import { __dirname } from '../utils.mjs'
import path from 'path'


class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Omar Ahmad <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Resend Service For Production
      return nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true, // true for port 465
        auth: {
          user: 'resend',
          pass: process.env.RESEND_API_KEY
        }
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on pug template
    const html = pug.renderFile(
      path.join(__dirname,
        'views',
        'emails',
        `${template}.pug`
      ),
      {
        firstName: this.firstName,
        url: this.url,
        subject
      })

    // 2) Define the email options
    const mailOption = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html, { wordwrap: 130 }),
    };
    // 3) Create a transport and send the email
    await this.newTransport().sendMail(mailOption);
  }

  async sendWelcome() {
    await this.send("welcome", "Welcome to the Natours!!")
  }

  async sendResetPassword() {
    await this.send("passwordReset", "Your password reset token (vaild for only 10 minutes)");
  }
}


export { Email }