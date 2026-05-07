const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

export async function sendSMS(
  toPhone: string,
  body: string,
  fromPhone: string,
  messageId: string,
): Promise<{ status: 'sent'; twilioSid: string } | { status: 'failed'; error: string }> {
  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({ to: toPhone, from: fromPhone, body });
    console.log(`[delivery/sms] sent messageId=${messageId} to=${toPhone} sid=${message.sid}`);
    return { status: 'sent', twilioSid: message.sid };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.log(`[delivery/sms] failed messageId=${messageId} to=${toPhone} error=${error}`);
    return { status: 'failed', error };
  }
}
