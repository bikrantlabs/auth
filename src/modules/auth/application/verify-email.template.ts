export type VerifyEmailTemplateData = {
  token: string;
  expiresInMinutes: number;
};

const escapeHtml = (input: string): string =>
  input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/** Minimal verification-email template for Mailpit dev. No layout, no branding. */
export const verifyEmailTemplate = {
  subject: "Verify your email",
  text: (data: VerifyEmailTemplateData): string =>
    `Your verification code is: ${data.token}\n\nIt expires in ${data.expiresInMinutes} minutes.\n`,
  html: (data: VerifyEmailTemplateData): string =>
    `<p>Your verification code is: <strong>${escapeHtml(data.token)}</strong></p>` +
    `<p>It expires in ${data.expiresInMinutes} minutes.</p>`,
};
