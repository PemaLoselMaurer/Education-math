import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: '', // <-- Replace with your Gmail address
      pass: '', // <-- Replace with your Gmail App Password
    },
  });

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `http://localhost:3001/user/verify-email?token=${token}`;
    await this.transporter.sendMail({
      from: '',
      to: email,
      subject: 'Verify your email',
      html: `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`,
    });
  }
}
