import sgMail from '@sendgrid/mail';

const fromEmail = process.env.SENDGRID_FROM_EMAIL;

export async function sendEmail(
  toEmail: string,
  subject: string,
  body: string,
  agentName: string,
  messageId: string,
): Promise<{ status: 'sent'; sendgridMessageId: string } | { status: 'failed'; error: string }> {
  try {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) throw new Error('Missing env var: SENDGRID_API_KEY');
    if (!fromEmail) throw new Error('Missing env var: SENDGRID_FROM_EMAIL');

    sgMail.setApiKey(apiKey);

    const [response] = await sgMail.send({
      to: toEmail,
      from: { email: fromEmail, name: agentName },
      subject,
      text: body,
    });

    const sendgridMessageId = response.headers['x-message-id'] ?? '';
    console.log(`[delivery/email] sent messageId=${messageId} to=${toEmail} sgId=${sendgridMessageId}`);
    return { status: 'sent', sendgridMessageId };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(`[delivery/email] failed messageId=${messageId} to=${toEmail} error=${error}`);
    return { status: 'failed', error };
  }
}
