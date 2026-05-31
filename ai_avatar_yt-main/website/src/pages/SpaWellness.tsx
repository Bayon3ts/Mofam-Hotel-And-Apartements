import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Waves,
  Sofa,
  Heart,
  Phone,
  Calendar,
  Flame,
} from "lucide-react";
import spaImage from "@/assets/spa-amenities.jpg";

// ─── Ornamental Divider ───────────────────────────────────────────────────────
const OrnamentalDivider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: "16px", padding: "48px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "scaleX(1)" : "scaleX(0.4)",
        transition: "opacity 0.8s ease, transform 0.8s ease",
      }}
    >
      <div style={{ flex: 1, maxWidth: "120px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.4))" }} />
      <span style={{ color: "#C9A84C", fontSize: "14px", letterSpacing: "0.3em" }}>✦</span>
      <div style={{ flex: 1, maxWidth: "120px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.4))" }} />
    </div>
  );
};

// ─── Section heading component ────────────────────────────────────────────────
const SectionHeading = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) => (
  <div style={{ textAlign: "center", marginBottom: "52px" }}>
    <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "14px" }}>
      {eyebrow}
    </p>
    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 48px)", color: "#F5F0E8", fontWeight: 600, margin: "0 0 12px 0" }}>
      {title}
    </h2>
    <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 20px" }} />
    {subtitle && (
      <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "15px", maxWidth: "560px", margin: "0 auto", lineHeight: 1.8 }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Fade-in section wrapper ──────────────────────────────────────────────────
const FadeSection = ({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.7s ease, transform 0.7s ease",
        ...style,
      }}
    >
      {children}
    </section>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const facilities = [
  {
    icon: <Heart style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Massage Suite",
    description: "Private treatment rooms with trained therapists and premium oils",
  },
  {
    icon: <Flames />,
    name: "Steam & Sauna",
    description: "Detox and unwind in our steam facility, available daily",
  },
  {
    icon: <Sofa style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Relaxation Lounge",
    description: "A quiet space to decompress before or after your treatment",
  },
  {
    icon: <Waves style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Poolside Wellness",
    description: "Complement your treatment with time at our outdoor pool area",
  },
];

function Flames() {
  return <Flame style={{ width: "20px", height: "20px", color: "#C9A84C" }} />;
}

const treatments = [
  {
    name: "Signature Relaxation Massage",
    duration: "60 mins",
    price: "₦18,000",
    description: "Full-body therapeutic massage with warm aromatic oils to ease tension and restore calm",
  },
  {
    name: "Deep Tissue Massage",
    duration: "90 mins",
    price: "₦24,000",
    description: "Targeted muscle therapy for deep tension relief — ideal after long travel or stressful days",
  },
  {
    name: "Couples Spa Package",
    duration: "120 mins",
    price: "₦45,000",
    description: "Side-by-side treatments for two, with welcome drinks and a shared relaxation suite",
  },
  {
    name: "Rejuvenating Facial",
    duration: "75 mins",
    price: "₦16,000",
    description: "A deep-cleanse facial using premium skincare products tailored to your skin type",
  },
  {
    name: "Hot Stone Therapy",
    duration: "90 mins",
    price: "₦22,000",
    description: "Heated basalt stones melt away muscle tension while improving circulation",
  },
  {
    name: "Aromatherapy Session",
    duration: "60 mins",
    price: "₦17,000",
    description: "Calming essential oil treatment to reduce stress and promote deep relaxation",
  },
];

const hours = [
  { day: "Monday – Friday", time: "9:00 AM – 8:00 PM" },
  { day: "Saturday", time: "8:00 AM – 9:00 PM" },
  { day: "Sunday", time: "10:00 AM – 6:00 PM" },
];

const policies = [
  "Please arrive 10 minutes before your appointment",
  "Advance booking recommended for weekend treatments",
  "24-hour cancellation policy applies",
  "Complimentary robes and slippers provided",
  "Mobile phones must be silenced in spa areas",
  "Treatment prices are subject to 7.5% VAT",
];

// ─── Component ────────────────────────────────────────────────────────────────
const SpaWellness = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#0F0D08", fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVIGATION BAR ─────────────────────────────────────────────── */}
      <header style={{ background: "#0F0D08", borderBottom: "1px solid rgba(201,168,76,0.12)", position: "sticky", top: 0, zIndex: 50, padding: "0 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", transition: "opacity 0.2s", padding: 0 }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <ArrowLeft style={{ width: "13px", height: "13px" }} />
            Back to Home
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <a
              href="tel:+2347069206935"
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", letterSpacing: "0.05em", textDecoration: "none", transition: "all 0.3s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.08)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <Phone style={{ width: "13px", height: "13px" }} />
              Call Spa
            </a>
            <button
              onClick={() => navigate("/booking")}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#C9A84C", color: "#0F0D08", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", transition: "background 0.3s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
              onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
            >
              <Calendar style={{ width: "13px", height: "13px" }} />
              Book Treatment
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "520px", overflow: "hidden" }}>
        <img src={spaImage} alt="Mofam Spa & Wellness" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,13,8,0.62)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "18px" }}>
            RESTORE · REJUVENATE · REVIVE
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 6vw, 72px)", color: "#F5F0E8", fontWeight: 600, margin: "0 0 8px 0", lineHeight: 1.1 }}>
            Spa &amp; Wellness
          </h1>
          <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "16px auto" }} />
          <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "16px", maxWidth: "560px", lineHeight: 1.8, margin: 0 }}>
            Step away from the pace of the city. Our wellness sanctuary is designed to restore your body and calm your mind — right here in the heart of Osogbo.
          </p>
        </div>
      </section>

      {/* ── CONTENT WRAPPER ────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 5%" }}>

        <OrnamentalDivider />

        {/* ── PREMIUM FACILITIES ─────────────────────────────────────── */}
        <FadeSection>
          <SectionHeading
            eyebrow="OUR FACILITIES"
            title="Premium Wellness Facilities"
            subtitle="Every space within our wellness centre is thoughtfully designed to offer a sanctuary of calm and restoration."
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {facilities.map((facility, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  borderRadius: "12px",
                  padding: "28px 24px",
                  textAlign: "center",
                  transition: "border-color 0.3s ease, transform 0.3s ease",
                  cursor: "default",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.55)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,168,76,0.25)";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                  {facility.icon}
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#F5F0E8", fontWeight: 600, margin: "0 0 10px 0" }}>
                  {facility.name}
                </h3>
                <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
                  {facility.description}
                </p>
              </div>
            ))}
          </div>
        </FadeSection>

        <OrnamentalDivider />

        {/* ── SIGNATURE TREATMENTS ───────────────────────────────────── */}
        <FadeSection>
          <SectionHeading
            eyebrow="SIGNATURE TREATMENTS"
            title="Curated Spa Experiences"
            subtitle="Each treatment is delivered by trained therapists using premium products — tailored to your needs and pace."
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
            {treatments.map((t, idx) => (
              <TreatmentCard key={idx} treatment={t} onBook={() => navigate("/booking")} />
            ))}
          </div>
        </FadeSection>

        <OrnamentalDivider />

        {/* ── HOURS & POLICIES ───────────────────────────────────────── */}
        <FadeSection style={{ paddingBottom: "80px" }}>
          <SectionHeading
            eyebrow="PLAN YOUR VISIT"
            title="Hours & Policies"
          />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>

            {/* Operating Hours */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock style={{ width: "17px", height: "17px", color: "#C9A84C" }} />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#F5F0E8", fontWeight: 600, margin: 0 }}>
                  Operating Hours
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {hours.map(({ day, time }, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                      <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase" }}>{day}</span>
                      <span style={{ color: "rgba(245,240,232,0.7)", fontSize: "14px" }}>{time}</span>
                    </div>
                    {idx < hours.length - 1 && <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }} />}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", marginTop: "16px", paddingTop: "16px" }}>
                <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
                  Last treatment bookings accepted 90 minutes before closing.
                </p>
              </div>
            </div>

            {/* Spa Policies */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "12px", padding: "28px 32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Sparkles style={{ width: "17px", height: "17px", color: "#C9A84C" }} />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#F5F0E8", fontWeight: 600, margin: 0 }}>
                  Spa Policies
                </h3>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {policies.map((policy, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ width: "2px", height: "16px", background: "#C9A84C", flexShrink: 0, marginTop: "3px", opacity: 0.7 }} />
                    <span style={{ color: "rgba(245,240,232,0.7)", fontSize: "14px", lineHeight: 1.6 }}>{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Strip */}
          <div style={{ marginTop: "48px", textAlign: "center", padding: "40px 32px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "12px" }}>
            <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "12px" }}>
              READY TO UNWIND?
            </p>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 3vw, 36px)", color: "#F5F0E8", fontWeight: 600, margin: "0 0 8px 0" }}>
              Reserve Your Treatment Today
            </h3>
            <p style={{ color: "rgba(245,240,232,0.5)", fontSize: "14px", margin: "0 0 28px 0" }}>
              Call us directly or make a booking online — our team is happy to help
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="tel:+2347069206935"
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "#C9A84C", color: "#0F0D08", border: "none", borderRadius: "8px", padding: "14px 32px", fontSize: "14px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", textDecoration: "none", transition: "background 0.3s ease" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#b8963e"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#C9A84C"}
              >
                <Phone style={{ width: "14px", height: "14px" }} />
                +234 (706) 920-6935
              </a>
              <button
                onClick={() => navigate("/booking")}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", borderRadius: "8px", padding: "14px 32px", fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.3s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <Calendar style={{ width: "14px", height: "14px" }} />
                Book Online
              </button>
            </div>
          </div>
        </FadeSection>
      </div>

      {/* ── PAGE FOOTER STRIP ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(201,168,76,0.12)", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "rgba(245,240,232,0.3)", fontSize: "12px", margin: 0 }}>
          © 2025 Mofam Hotel &amp; Apartments — Osogbo, Osun State
        </p>
      </footer>
    </div>
  );
};

// ─── Treatment Card ───────────────────────────────────────────────────────────
const TreatmentCard = ({
  treatment,
  onBook,
}: {
  treatment: { name: string; duration: string; price: string; description: string };
  onBook: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.25)"}`,
        borderRadius: "12px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#F5F0E8", fontWeight: 600, margin: 0, flex: 1, paddingRight: "12px" }}>
          {treatment.name}
        </h3>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: "#C9A84C", fontWeight: 600, flexShrink: 0 }}>
          {treatment.price}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "14px" }}>
        <Clock style={{ width: "12px", height: "12px", color: "#C9A84C" }} />
        <span style={{ color: "rgba(245,240,232,0.55)", fontSize: "12px" }}>{treatment.duration}</span>
      </div>

      <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "13px", lineHeight: 1.7, margin: "0 0 auto 0", flexGrow: 1 }}>
        {treatment.description}
      </p>

      <button
        onClick={onBook}
        style={{
          marginTop: "20px",
          background: hovered ? "#C9A84C" : "transparent",
          border: "1px solid rgba(201,168,76,0.45)",
          color: hovered ? "#0F0D08" : "#C9A84C",
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          fontSize: "12px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          fontWeight: hovered ? 700 : 500,
          transition: "all 0.3s ease",
        }}
      >
        Book This Treatment
      </button>
    </div>
  );
};

export default SpaWellness;