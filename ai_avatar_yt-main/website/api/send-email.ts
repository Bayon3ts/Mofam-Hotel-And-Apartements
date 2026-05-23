import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const HOTEL_NAME = 'Mofam Hotel And Apartements';
const ADMIN_EMAIL = 'reservations@mofamhotel.com'; // ← update to real admin inbox
const FROM_EMAIL  = 'onboarding@resend.dev';        // ← use your Resend verified domain in prod

// ─── HTML Email Templates ────────────────────────────────────────────────────

function guestTemplate(b: {
  full_name: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string;
  booking_id: string;
  phone: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Confirmed - ${HOTEL_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Segoe UI',Arial,sans-serif;color:#e8e0d0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

        <!-- Header -->
        <tr>
          <td style="padding:48px 40px 32px;background:linear-gradient(135deg,#1a1a1a 0%,#0e0e0e 100%);border-bottom:1px solid #2a2a2a;text-align:center;">
            <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.35em;text-transform:uppercase;color:#e9c349;opacity:0.7;">Luxury Hospitality</p>
            <h1 style="margin:0;font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#f5f0e8;">${HOTEL_NAME}</h1>
            <p style="margin:16px 0 0;font-size:13px;color:#888;letter-spacing:0.1em;">19 Ofatedo Road &middot; Osogbo &middot; Osun State, Nigeria</p>
          </td>
        </tr>

        <!-- Confirmation badge -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="display:inline-block;background:rgba(233,195,73,0.08);border:1px solid rgba(233,195,73,0.25);border-radius:50px;padding:10px 28px;">
              <span style="font-size:12px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:#e9c349;">&#10003; Booking Confirmed</span>
            </div>
            <h2 style="margin:20px 0 8px;font-size:26px;font-weight:900;color:#f5f0e8;">Welcome, ${b.full_name}!</h2>
            <p style="margin:0;font-size:15px;color:#aaa;line-height:1.7;">Your reservation has been secured. We look forward to hosting you.</p>
          </td>
        </tr>

        <!-- Booking ID -->
        <tr>
          <td style="padding:28px 40px 0;text-align:center;">
            <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#666;">Reservation Reference</p>
            <span style="display:inline-block;font-size:22px;font-weight:900;letter-spacing:0.2em;color:#e9c349;background:rgba(233,195,73,0.06);border:1px solid rgba(233,195,73,0.2);padding:10px 24px;border-radius:8px;">${b.booking_id}</span>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:32px 40px 0;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;" /></td></tr>

        <!-- Booking Details -->
        <tr>
          <td style="padding:28px 40px 0;">
            <p style="margin:0 0 20px;font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#666;">Reservation Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700;">Room Type</td>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:15px;font-weight:800;color:#f5f0e8;text-align:right;">${b.room_type}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700;">Check-In</td>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;font-weight:700;color:#f5f0e8;text-align:right;">${b.check_in}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700;">Check-Out</td>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;font-weight:700;color:#f5f0e8;text-align:right;">${b.check_out}</td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700;">Guests</td>
                <td style="padding:12px 0;border-bottom:1px solid #222;font-size:14px;font-weight:700;color:#f5f0e8;text-align:right;">${b.guests}</td>
              </tr>
              <tr>
                <td style="padding:16px 0 0;font-size:12px;text-transform:uppercase;letter-spacing:0.15em;color:#888;font-weight:800;">Total Amount</td>
                <td style="padding:16px 0 0;font-size:24px;font-weight:900;color:#e9c349;text-align:right;">${b.total_price}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr><td style="padding:28px 40px 0;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;" /></td></tr>

        <!-- Policy Info -->
        <tr>
          <td style="padding:24px 40px 0;background:#121212;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="50%" style="padding-right:12px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#e9c349;">Check-In Time</p>
                  <p style="margin:0;font-size:13px;color:#aaa;">From 3:00 PM</p>
                </td>
                <td width="50%" style="border-left:1px solid #2a2a2a;padding-left:16px;">
                  <p style="margin:0 0 4px;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#e9c349;">Check-Out Time</p>
                  <p style="margin:0;font-size:13px;color:#aaa;">By 11:00 AM</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:32px 40px 40px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#555;">Need assistance? Contact us at</p>
            <a href="mailto:${ADMIN_EMAIL}" style="color:#e9c349;font-size:13px;font-weight:700;text-decoration:none;">${ADMIN_EMAIL}</a>
            <p style="margin:20px 0 0;font-size:11px;color:#444;">&copy; ${new Date().getFullYear()} ${HOTEL_NAME}. All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function adminTemplate(b: {
  full_name: string;
  email: string;
  phone: string;
  room_type: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: string;
  booking_id: string;
}): string {
  const rows: [string, string][] = [
    ['Guest Name', b.full_name],
    ['Email', b.email],
    ['Phone', b.phone],
    ['Room Type', b.room_type],
    ['Check-In', b.check_in],
    ['Check-Out', b.check_out],
    ['Guests', String(b.guests)],
    ['Total Amount', b.total_price],
  ];

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #222;font-size:11px;text-transform:uppercase;letter-spacing:0.15em;color:#666;font-weight:700;width:40%;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #222;font-size:14px;font-weight:700;color:#f5f0e8;text-align:right;">${value}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><title>New Booking - ${HOTEL_NAME}</title></head>
<body style="margin:0;padding:0;background:#0e0e0e;font-family:'Segoe UI',Arial,sans-serif;color:#e8e0d0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0e0e;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#161616;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

        <tr>
          <td style="padding:32px 40px;background:#1a1200;border-bottom:1px solid #3a2d00;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#e9c349;">New Booking Alert</p>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#f5f0e8;">${HOTEL_NAME}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#888;">Admin Notification</p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px 0;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#e9c349;">Booking ID</p>
            <span style="font-size:18px;font-weight:900;letter-spacing:0.15em;color:#f5f0e8;">${b.booking_id}</span>
          </td>
        </tr>

        <tr><td style="padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #2a2a2a;margin:0;" /></td></tr>

        <tr>
          <td style="padding:24px 40px 0;">
            <p style="margin:0 0 16px;font-size:10px;font-weight:800;letter-spacing:0.3em;text-transform:uppercase;color:#666;">Guest Information</p>
            <table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
          </td>
        </tr>

        <tr>
          <td style="padding:32px 40px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#444;">&copy; ${new Date().getFullYear()} ${HOTEL_NAME} &middot; Admin Portal</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Vercel Serverless Handler ────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-email] RESEND_API_KEY is not configured.');
    return res.status(500).json({ error: 'Email service not configured.' });
  }

  const booking = req.body as {
    full_name: string;
    email: string;
    phone: string;
    room_type: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    id?: string;
  };

  const formattedPrice = `\u20a6${booking.total_price.toLocaleString('en-NG')}`;
  const bookingId = (booking.id ?? 'N/A').slice(0, 8).toUpperCase();

  const commonData = {
    ...booking,
    total_price: formattedPrice,
    booking_id: bookingId,
  };

  console.log('[send-email] Processing booking:', bookingId, '| Guest:', booking.email);

  try {
    const [guestResult, adminResult] = await Promise.allSettled([
      resend.emails.send({
        from: `${HOTEL_NAME} <${FROM_EMAIL}>`,
        to: [booking.email],
        subject: `Booking Confirmed - ${HOTEL_NAME}`,
        html: guestTemplate(commonData),
      }),
      resend.emails.send({
        from: `Booking System <${FROM_EMAIL}>`,
        to: [ADMIN_EMAIL],
        subject: `New Booking - ${booking.room_type} - ${bookingId}`,
        html: adminTemplate(commonData),
      }),
    ]);

    const guestOk = guestResult.status === 'fulfilled' && !guestResult.value.error;
    const adminOk = adminResult.status === 'fulfilled' && !adminResult.value.error;

    if (!guestOk) console.error('[send-email] Guest email error:', guestResult);
    if (!adminOk) console.error('[send-email] Admin email error:', adminResult);

    console.log('[send-email] Done. Guest OK:', guestOk, '| Admin OK:', adminOk);

    return res.status(200).json({ success: true, guest: guestOk, admin: adminOk });
  } catch (err) {
    console.error('[send-email] Unexpected error:', err);
    return res.status(500).json({ error: 'Failed to send emails', details: String(err) });
  }
}
