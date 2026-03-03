"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConfirmationEmail = sendConfirmationEmail;
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const resend_1 = require("resend");
const mail_config_1 = require("../config/mail.config");
const resend = new resend_1.Resend(mail_config_1.mailConfig.resendApiKey);
const TEMPLATES_DIR = path_1.default.join(__dirname, '..', 'templates', 'emails');
async function renderTemplate(templateName, data) {
    const templatePath = path_1.default.join(TEMPLATES_DIR, `${templateName}.ejs`);
    return ejs_1.default.renderFile(templatePath, data);
}
async function sendConfirmationEmail(email, token, firstName) {
    const confirmUrl = `${mail_config_1.mailConfig.clientUrl}/confirm-email?token=${token}`;
    const html = await renderTemplate('confirm-email', {
        firstName,
        confirmUrl,
    });
    if (!mail_config_1.mailConfig.resendApiKey) {
        console.log(`\n📧 Confirmation email → ${email}`);
        console.log(`   Link: ${confirmUrl}\n`);
        return;
    }
    await resend.emails.send({
        from: mail_config_1.mailConfig.from,
        to: email,
        subject: 'Confirm your email — Penguin',
        html,
    });
}
async function sendPasswordResetEmail(email, token, firstName) {
    const resetUrl = `${mail_config_1.mailConfig.clientUrl}/reset-password?token=${token}`;
    const html = await renderTemplate('reset-password', {
        firstName,
        resetUrl,
    });
    if (!mail_config_1.mailConfig.resendApiKey) {
        console.log(`\n📧 Password reset email → ${email}`);
        console.log(`   Link: ${resetUrl}\n`);
        return;
    }
    await resend.emails.send({
        from: mail_config_1.mailConfig.from,
        to: email,
        subject: 'Reset your password — Penguin',
        html,
    });
}
//# sourceMappingURL=email.service.js.map