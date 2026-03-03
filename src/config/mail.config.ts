export const mailConfig = {
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  from: process.env.MAIL_FROM ?? 'Penguin <noreply@penguin.dev>',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:3000',
};
