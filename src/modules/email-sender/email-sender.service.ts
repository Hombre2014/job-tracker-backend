import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailSenderService {
  constructor(private readonly configService: ConfigService) {}

  async sendVerificationEmail(to: string, code: string) {
    await this.sendEmail(to, 'JobTracker Email verification', `Code: ${code}`);
  }

  async sendEmail(to: string, subject: string, body: string) {
    const token = this.configService.get('RESEND_TOKEN');
    const emailFrom = this.configService.get('NOTIFICATION_EMAIL');

    if (!token) {
      throw new Error('Email service not configured: Missing RESEND_TOKEN');
    }

    if (!emailFrom) {
      throw new Error('Email service not configured: Missing NOTIFICATION_EMAIL');
    }

    const resend = new Resend(token);
    const { error } = await resend.emails.send({
      from: `JobTracker <${emailFrom}>`,
      to: [to],
      subject: subject,
      html: body,
    });

    if (error) {
      console.error('Error during sending email', { error });
      throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
    }
  }
}
