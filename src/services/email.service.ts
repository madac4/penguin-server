import ejs from 'ejs';
import path from 'path';
import { Resend } from 'resend';
import { mailConfig } from '../config/mail.config';

const resend = new Resend(mailConfig.resendApiKey);
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates', 'emails');

async function renderTemplate(
  templateName: string,
  data: Record<string, unknown>,
): Promise<string> {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.ejs`);
  return ejs.renderFile(templatePath, data);
}

export async function sendConfirmationEmail(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const confirmUrl = `${mailConfig.clientUrl}/auth/confirm-email?token=${token}`;

  const html = await renderTemplate('confirm-email', {
    firstName,
    confirmUrl,
  });

  if (!mailConfig.resendApiKey) {
    console.log(`\n📧 Confirmation email → ${email}`);
    console.log(`   Link: ${confirmUrl}\n`);
    return;
  }

  await resend.emails.send({
    from: mailConfig.from,
    to: email,
    subject: 'Confirm your email — Penguin',
    html,
  });
}

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  firstName: string,
): Promise<void> {
  const resetUrl = `${mailConfig.clientUrl}/auth/reset-password?token=${token}`;

  const html = await renderTemplate('reset-password', {
    firstName,
    resetUrl,
  });

  if (!mailConfig.resendApiKey) {
    console.log(`\n📧 Password reset email → ${email}`);
    console.log(`   Link: ${resetUrl}\n`);
    return;
  }

  await resend.emails.send({
    from: mailConfig.from,
    to: email,
    subject: 'Reset your password — Penguin',
    html,
  });
}

export async function sendEmailChangeEmail(
  newEmail: string,
  token: string,
  firstName: string,
): Promise<void> {
  const confirmUrl = `${mailConfig.clientUrl}/confirm-email-change?token=${token}`;

  const html = await renderTemplate('confirm-email-change', {
    firstName,
    newEmail,
    confirmUrl,
  });

  if (!mailConfig.resendApiKey) {
    console.log(`\n📧 Email change confirmation → ${newEmail}`);
    console.log(`   Link: ${confirmUrl}\n`);
    return;
  }

  await resend.emails.send({
    from: mailConfig.from,
    to: newEmail,
    subject: 'Confirm your new email — Penguin',
    html,
  });
}
