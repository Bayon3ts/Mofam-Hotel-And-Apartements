import { format } from 'date-fns';

/**
 * Centralized Email Service – Resend (via /api/send-email)
 *
 * Sends two emails after a successful booking:
 * 1. Guest confirmation email
 * 2. Admin notification email
 *
 * The actual sending happens server-side in /api/send-email.ts to keep
 * the RESEND_API_KEY out of the browser bundle.
 */

export interface BookingData {
  full_name: string;
  email: string;
  phone: string;
  room_type: string;
  check_in: string | Date;
  check_out: string | Date;
  guests: number;
  total_price: number;
  id?: string;
}

export async function sendBookingEmails(booking: BookingData): Promise<boolean> {
  // Vercel serverless functions are unavailable in local dev (npm run dev).
  // Skip the API call silently so the booking flow is never blocked locally.
  if (import.meta.env.DEV) {
    console.info('[Mofam] Local dev: email send skipped (Vercel functions not available). Emails will send on the deployed site.');
    return true;
  }

  console.log('──────────────────────────────────────────');
  console.log('📧 Sending booking emails via Resend...');

  // Normalise dates to ISO strings before sending over the wire
  const payload = {
    ...booking,
    check_in:
      booking.check_in instanceof Date
        ? format(booking.check_in, 'EEE, MMM dd, yyyy')
        : booking.check_in,
    check_out:
      booking.check_out instanceof Date
        ? format(booking.check_out, 'EEE, MMM dd, yyyy')
        : booking.check_out,
  };

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Email API returned an error:', data);
      return false;
    }

    console.log('✅ Email API response:', data);
    console.log(`   Guest email OK: ${data.guest} | Admin email OK: ${data.admin}`);
    console.log('──────────────────────────────────────────');
    return true;
  } catch (err) {
    // Network / CORS errors should not break the booking flow
    console.warn('[Mofam] Email delivery failed. Check: 1) RESEND_API_KEY in Vercel env vars, 2) Domain verification on Resend dashboard for mofamhotelandapartments.com');
    console.error('❌ Failed to reach email API:', err);
    return false;
  }
}
