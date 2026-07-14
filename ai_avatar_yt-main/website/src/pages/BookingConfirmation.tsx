import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CheckCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Calendar,
  CreditCard,
  Home,
  Check,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { useTheme } from "@/hooks/useTheme";

// ─── Types ───────────────────────────────────────────────────────────────────
interface RoomData {
  id: string;
  name: string;
  price: number;
  tag: string;
  description: string;
}

interface BookingState {
  checkIn: string | Date;
  checkOut: string | Date;
  nights: number;
  numRooms: number;
  adults: number;
  children: number;
  totalGuests: number;
  selectedRoom: RoomData;
  totalPrice: number;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  bookingId: string;
}

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// ─── Luxury Card ─────────────────────────────────────────────────────────────
const LuxuryCard = ({ children, style = {}, t }: { children: React.ReactNode; style?: React.CSSProperties, t: Record<string, string> }) => (
  <div style={{
    background: t.surface,
    border: `1px solid ${t.border}`,
    borderRadius: "12px",
    padding: "28px 32px",
    boxShadow: t.shadow,
    ...style
  }}>
    {children}
  </div>
);

// ─── Card Icon ───────────────────────────────────────────────────────────────
const CardIcon = ({ icon }: { icon: React.ReactNode }) => (
  <div style={{
    width: "40px", height: "40px", borderRadius: "50%",
    border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
  }}>
    {icon}
  </div>
);

// ─── Card Heading ─────────────────────────────────────────────────────────────
const CardHeading = ({ icon, title, t }: { icon: React.ReactNode; title: string, t: Record<string, string> }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
    <CardIcon icon={icon} />
    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: t.text, fontWeight: 600, margin: 0 }}>
      {title}
    </h2>
  </div>
);

// ─── Field Label + Value ──────────────────────────────────────────────────────
const Field = ({ label, value, t }: { label: string; value: React.ReactNode, t: Record<string, string> }) => (
  <div>
    <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px", margin: "0 0 6px 0" }}>
      {label}
    </p>
    <p style={{ color: t.text, fontSize: "16px", fontWeight: 500, margin: 0 }}>{value}</p>
  </div>
);

// ─── Divider ─────────────────────────────────────────────────────────────────
const GoldDivider = () => (
  <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", margin: "20px 0" }} />
);

// ─── Component ───────────────────────────────────────────────────────────────
const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [iconVisible, setIconVisible] = useState(false);
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const t = {
    bg: isDark ? '#0F0D08' : '#FAF7F2',
    surface: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    border: isDark ? 'rgba(201,168,76,0.25)' : 'rgba(180,145,60,0.3)',
    text: isDark ? '#F5F0E8' : '#1A1510',
    textMuted: isDark ? 'rgba(245,240,232,0.55)' : 'rgba(26,21,16,0.60)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    shadow: isDark ? 'none' : '0 2px 12px rgba(180,145,60,0.08)',
  };

  const state = location.state as BookingState | null;

  useEffect(() => {
    // Trigger icon scale animation after mount
    const t = setTimeout(() => setIconVisible(true), 60);
    if (!state) {
      const redirect = setTimeout(() => navigate("/booking"), 3000);
      return () => { clearTimeout(t); clearTimeout(redirect); };
    }
    return () => clearTimeout(t);
  }, [state, navigate]);

  // ── Fallback screen ──────────────────────────────────────────────────────
  if (!state) {
    return (
      <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", padding: "0 24px" }}>
          <Calendar style={{ width: "56px", height: "56px", color: "#C9A84C", opacity: 0.4, margin: "0 auto 20px" }} />
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: t.text, marginBottom: "12px" }}>
            No booking data found
          </h2>
          <p style={{ color: t.textMuted, fontSize: "14px", maxWidth: "340px", margin: "0 auto 24px" }}>
            It looks like you navigated here directly. Redirecting you back to the booking page…
          </p>
          <button
            onClick={() => navigate("/booking")}
            style={{ background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "14px 40px", borderRadius: "8px", border: "none", cursor: "pointer", letterSpacing: "0.06em" }}
          >
            Go to Booking
          </button>
        </div>
      </div>
    );
  }

  // ── Destructure state ────────────────────────────────────────────────────
  const { checkIn, checkOut, nights, numRooms, adults, children, totalGuests, selectedRoom, totalPrice, customer, bookingId } = state;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── BACK LINK ─────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 40px" }}>
        <button
          onClick={() => navigate("/")}
          style={{ background: "none", border: "none", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "opacity 0.2s", padding: 0 }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <ArrowLeft style={{ width: "13px", height: "13px" }} />
          Back to Hotel
        </button>
      </div>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────── */}
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 5% 80px" }}>

        {/* ── HERO CONFIRMATION BLOCK ────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: "56px" }}>

          {/* Gold animated checkmark circle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              border: "2px solid #C9A84C", display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 32px rgba(201,168,76,0.2)",
              transform: iconVisible ? "scale(1)" : "scale(0)",
              transition: "transform 0.5s ease-out",
            }}>
              <Check style={{ width: "28px", height: "28px", color: "#C9A84C" }} />
            </div>
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 60px)", color: t.text, fontWeight: 600, margin: "0 0 20px 0" }}>
            Booking Confirmed!
          </h1>

          {/* Reference code */}
          <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", margin: "0 0 12px 0" }}>
            Reservation Reference
          </p>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.4)", borderRadius: "8px", padding: "12px 32px", color: "#C9A84C", fontSize: "20px", fontFamily: "monospace", letterSpacing: "0.15em", marginBottom: "24px" }}>
            {bookingId.slice(0, 8).toUpperCase()}
          </div>

          {/* Confirmation message */}
          <p style={{ color: t.textMuted, fontSize: "15px", lineHeight: 1.8, maxWidth: "560px", margin: "0 auto" }}>
            Thank you for choosing Mofam Hotel &amp; Apartments,{" "}
            <span style={{ color: t.text, fontWeight: 600 }}>{customer.fullName}</span>.
            Your reservation has been successfully processed and a confirmation email has been sent to{" "}
            <span style={{ color: t.text, fontWeight: 600 }}>{customer.email}</span>.
          </p>
        </div>

        {/* ── CONTENT GRID ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "32px", alignItems: "start" }} className="confirmation-grid">

          {/* ── LEFT COLUMN ───────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

            {/* Your Stay */}
            <LuxuryCard t={t}>
              <CardHeading icon={<Calendar style={{ width: "18px", height: "18px", color: "#C9A84C" }} />} title="Your Stay" t={t} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                <div>
                  <Field label="Check-In" value={format(checkInDate, "EEE, MMM dd yyyy")} t={t} />
                  <p style={{ color: "rgba(201,168,76,0.6)", fontSize: "12px", marginTop: "4px" }}>From 2:00 PM</p>
                </div>
                <div>
                  <Field label="Check-Out" value={format(checkOutDate, "EEE, MMM dd yyyy")} t={t} />
                  <p style={{ color: "rgba(201,168,76,0.6)", fontSize: "12px", marginTop: "4px" }}>By 11:00 AM</p>
                </div>
              </div>

              <GoldDivider />

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                {[
                  { label: "Nights", value: nights },
                  { label: "Rooms", value: numRooms },
                  { label: "Adults", value: adults },
                  { label: "Children", value: children },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: "center", padding: "14px 8px", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: "8px" }}>
                    <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 6px 0" }}>{label}</p>
                    <p style={{ color: t.text, fontSize: "20px", fontWeight: 600, margin: 0 }}>{value}</p>
                  </div>
                ))}
              </div>
            </LuxuryCard>

            {/* Room Details */}
            <LuxuryCard t={t}>
              <CardHeading icon={<Home style={{ width: "18px", height: "18px", color: "#C9A84C" }} />} title="Room Details" t={t} />
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <h3 style={{ color: t.text, fontSize: "18px", fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, margin: "0 0 6px 0" }}>
                    {selectedRoom.name} Room
                  </h3>
                  <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0" }}>{selectedRoom.tag}</p>
                  <p style={{ color: t.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0, maxWidth: "420px" }}>
                    {selectedRoom.description}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: "#C9A84C", fontSize: "22px", fontWeight: 700, margin: "0 0 2px 0" }}>{fmt(selectedRoom.price)}</p>
                  <p style={{ color: "rgba(201,168,76,0.6)", fontSize: "11px", margin: 0 }}>per night</p>
                </div>
              </div>
            </LuxuryCard>

            {/* Reservation Holder */}
            <LuxuryCard t={t}>
              <CardHeading icon={<Mail style={{ width: "18px", height: "18px", color: "#C9A84C" }} />} title="Reservation Holder" t={t} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                <Field label="Full Name" value={customer.fullName} t={t} />
                <div>
                  <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", margin: "0 0 8px 0" }}>
                    Contact Status
                  </p>
                  <span style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", borderRadius: "20px", padding: "4px 12px", fontSize: "11px", letterSpacing: "0.1em", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Check style={{ width: "10px", height: "10px" }} /> Verified
                  </span>
                </div>
                <Field label="Email Address" value={customer.email} t={t} />
                <Field label="Phone Number" value={customer.phone} t={t} />
              </div>
            </LuxuryCard>

            {/* Hotel Information */}
            <LuxuryCard t={t}>
              <CardHeading icon={<MapPin style={{ width: "18px", height: "18px", color: "#C9A84C" }} />} title="Hotel Information" t={t} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "20px" }}>
                <div>
                  <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 8px 0" }}>Address</p>
                  <p style={{ color: t.textMuted, fontSize: "14px", lineHeight: 1.8, margin: 0 }}>
                    19 Ofatedo Road,<br />
                    Osogbo,<br />
                    Osun State, Nigeria
                  </p>
                </div>
                <div>
                  <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", margin: "0 0 12px 0" }}>Contact</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <a href="tel:+2348000000000" style={{ color: "#C9A84C", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                      <Phone style={{ width: "13px", height: "13px" }} />
                      +234 (706) 920-6935
                    </a>
                    <a href="mailto:info@mofamhotelandapartments.com" style={{ color: "#C9A84C", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px", textDecoration: "none" }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                      <Mail style={{ width: "13px", height: "13px" }} />
                      info@mofamhotelandapartments.com
                    </a>
                  </div>
                </div>
              </div>

              <GoldDivider />

              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "16px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "8px" }}>
                <Clock style={{ width: "14px", height: "14px", color: "#C9A84C", flexShrink: 0, marginTop: "2px" }} />
                <div style={{ fontSize: "13px", color: t.textMuted, lineHeight: 1.8 }}>
                  <p style={{ margin: 0 }}><span style={{ color: t.text, fontWeight: 600 }}>Check-In:</span> From 2:00 PM</p>
                  <p style={{ margin: 0 }}><span style={{ color: t.text, fontWeight: 600 }}>Check-Out:</span> By 11:00 AM</p>
                  <p style={{ margin: "4px 0 0 0", color: "rgba(201,168,76,0.6)" }}>Early check-in and late check-out may be available upon request.</p>
                </div>
              </div>
            </LuxuryCard>
          </div>

          {/* ── RIGHT COLUMN: Price Summary ────────────────────────────────── */}
          <div style={{ position: "sticky", top: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <LuxuryCard t={t}>
              <CardHeading icon={<CreditCard style={{ width: "18px", height: "18px", color: "#C9A84C" }} />} title="Price Summary" t={t} />

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>{selectedRoom.name} Room</span>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>{fmt(selectedRoom.price)} / night</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>× {nights} night{nights !== 1 ? "s" : ""}</span>
                </div>
                {numRooms > 1 && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: t.textMuted, fontSize: "14px" }}>× {numRooms} rooms</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>Total guests</span>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>{totalGuests}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: t.textMuted, fontSize: "14px" }}>Taxes &amp; fees</span>
                  <span style={{ color: "#C9A84C", fontSize: "14px", fontWeight: 500 }}>Included</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(201,168,76,0.2)", paddingTop: "16px", marginTop: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                  <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Total</span>
                  <span style={{ color: "#C9A84C", fontSize: "20px", fontWeight: 700 }}>{fmt(totalPrice)}</span>
                </div>
                <p style={{ color: "rgba(201,168,76,0.5)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "right", margin: "4px 0 0 0" }}>Guaranteed reservation</p>
              </div>

              <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", marginTop: "20px", paddingTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => navigate("/")}
                  style={{ background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "14px 40px", borderRadius: "8px", border: "none", cursor: "pointer", letterSpacing: "0.06em", fontSize: "14px", width: "100%", transition: "background 0.3s ease" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
                  onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
                >
                  Return to Homepage
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", fontWeight: 600, padding: "14px 40px", borderRadius: "8px", cursor: "pointer", letterSpacing: "0.06em", fontSize: "14px", width: "100%", transition: "all 0.3s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  Print Confirmation
                </button>
              </div>
            </LuxuryCard>
          </div>
        </div>
      </main>

      {/* ── RESPONSIVE STYLES ────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .confirmation-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 600px) {
          .confirmation-grid > div:first-child > div {
            gap: 16px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BookingConfirmation;