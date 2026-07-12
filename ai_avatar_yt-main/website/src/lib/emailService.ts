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

/**
 * Status Update Email — Confirmed / Cancelled
 *
 * Notifies the guest when an admin confirms or cancels their reservation
 * from the Staff Management panel. Uses the same /api/send-email endpoint
 * with type: 'status_update', which routes to the confirmedTemplate or
 * cancelledTemplate on the server side.
 */
export interface StatusUpdateData {
  guest_email: string;
  guest_name: string;
  status: 'confirmed' | 'cancelled';
  booking_id: string;
  room_type: string;
  check_in: string | Date;
  check_out: string | Date;
}

export async function sendStatusUpdateEmail(data: StatusUpdateData): Promise<boolean> {
  // Vercel serverless functions are unavailable in local dev (npm run dev).
  if (import.meta.env.DEV) {
    console.info('[Mofam] Local dev: status update email skipped (Vercel functions not available). Emails will send on the deployed site.');
    return true;
  }

  console.log('──────────────────────────────────────────');
  console.log(`📧 Sending "${data.status}" status email via Resend...`);

  const payload = {
    type: 'status_update',
    ...data,
    check_in:
      data.check_in instanceof Date
        ? format(data.check_in, 'EEE, MMM dd, yyyy')
        : data.check_in,
    check_out:
      data.check_out instanceof Date
        ? format(data.check_out, 'EEE, MMM dd, yyyy')
        : data.check_out,
  };

  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ Status update email API error:', result);
      return false;
    }

    console.log('✅ Status update email sent:', result);
    console.log('──────────────────────────────────────────');
    return true;
  } catch (err) {
    console.warn('[Mofam] Status update email delivery failed. Check RESEND_API_KEY / domain verification on Resend.');
    console.error('❌ Failed to reach email API:', err);
    return false;
  }
}