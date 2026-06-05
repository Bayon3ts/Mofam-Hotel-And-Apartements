import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Users,
  Phone,
  Calendar,
  Heart,
  ShowerHead,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

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

// ─── Section Heading ──────────────────────────────────────────────────────────
const SectionHeading = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) => (
  <div style={{ textAlign: "center", marginBottom: "52px" }}>
    <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "14px" }}>
      {eyebrow}
    </p>
    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(32px, 4vw, 48px)", color: "var(--text-heading, #F5F0E8)", fontWeight: 600, margin: "0 0 12px 0" }}>
      {title}
    </h2>
    <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 20px" }} />
    {subtitle && (
      <p style={{ color: "var(--text-muted, rgba(245,240,232,0.55))", fontSize: "15px", maxWidth: "560px", margin: "0 auto", lineHeight: 1.8 }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Fade-in Section ──────────────────────────────────────────────────────────
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
    name: "Cardio Zone",
    description: "Treadmills, ellipticals and bikes to keep your cardio routine on track",
  },
  {
    icon: <Dumbbell style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Strength Training",
    description: "Free weights, resistance machines and benches for a full strength session",
  },
  {
    icon: <Users style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Personal Training",
    description: "One-on-one sessions with our in-house trainer — book in advance at the front desk",
  },
  {
    icon: <ShowerHead style={{ width: "20px", height: "20px", color: "#C9A84C" }} />,
    name: "Changing Rooms",
    description: "Clean, well-maintained facilities with lockers, showers and towels provided",
  },
];

const classes = [
  {
    name: "Morning Stretch & Mobility",
    time: "6:30 AM",
    duration: "45 mins",
    level: "All Levels",
  },
  {
    name: "Strength & Conditioning",
    time: "8:00 AM · 5:00 PM",
    duration: "50 mins",
    level: "Intermediate",
  },
  {
    name: "Yoga & Relaxation",
    time: "7:00 AM · 6:00 PM",
    duration: "60 mins",
    level: "All Levels",
  },
];

const hours = [
  { label: "Fitness Center", value: "5:00 AM – 10:00 PM daily" },
  { label: "Group Classes", value: "6:30 AM – 7:00 PM" },
  { label: "Personal Training", value: "By appointment — contact front desk" },
];

const policies = [
  "Proper athletic attire required",
  "Towels provided complimentary",
  "Personal training requires advance booking at reception",
  "Children under 16 must be accompanied by an adult",
  "Please wipe down equipment after use",
];

// ─── Facility Card ────────────────────────────────────────────────────────────
const FacilityCard = ({ facility, t }: { facility: typeof facilities[0], t: Record<string, string> }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? "rgba(201,168,76,0.55)" : t.border}`,
        borderRadius: "12px",
        padding: "28px 24px",
        textAlign: "center",
        transition: "border-color 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
        boxShadow: t.shadow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ width: "52px", height: "52px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        {facility.icon}
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: t.text, fontWeight: 600, margin: "0 0 10px 0" }}>
        {facility.name}
      </h3>
      <p style={{ color: t.textMuted, fontSize: "14px", lineHeight: 1.7, margin: 0 }}>
        {facility.description}
      </p>
    </div>
  );
};

// ─── Class Card ───────────────────────────────────────────────────────────────
const ClassCard = ({ cls, t }: { cls: typeof classes[0], t: Record<string, string> }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        background: t.surface,
        border: `1px solid ${hovered ? "rgba(201,168,76,0.45)" : t.border}`,
        borderRadius: "12px",
        padding: "24px",
        transition: "border-color 0.3s ease, transform 0.3s ease",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        cursor: "default",
        boxShadow: t.shadow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", color: t.text, fontWeight: 600, margin: 0, flex: 1, paddingRight: "12px" }}>
          {cls.name}
        </h3>
        <span style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: "20px", padding: "4px 12px", flexShrink: 0 }}>
          {cls.level}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
        <Clock style={{ width: "13px", height: "13px", color: "#C9A84C", flexShrink: 0 }} />
        <span style={{ color: t.textMuted, fontSize: "13px" }}>{cls.time}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Calendar style={{ width: "13px", height: "13px", color: "#C9A84C", flexShrink: 0 }} />
        <span style={{ color: t.textMuted, fontSize: "13px" }}>Duration: {cls.duration}</span>
      </div>
    </div>
  );
};

// ─── Gallery Photo ────────────────────────────────────────────────────────────
const GalleryPhoto = ({ src, alt, t }: { src: string; alt: string; t: Record<string, string> }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "12px",
        border: `1px solid ${hovered ? "rgba(201,168,76,0.5)" : t.border}`,
        aspectRatio: "4/3",
        cursor: "pointer",
        transition: "border-color 0.3s ease",
        boxShadow: t.shadow,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={alt}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.6s ease",
          transform: hovered ? "scale(1.06)" : "scale(1)",
          display: "block",
        }}
      />
      {/* subtle dark-to-transparent gradient at bottom */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,13,8,0.45) 0%, transparent 50%)", pointerEvents: "none" }} />
      {/* gold corner accent */}
      <div style={{ position: "absolute", top: "12px", right: "12px", width: "28px", height: "28px", border: "1px solid rgba(201,168,76,0.5)", borderRadius: "50%", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", opacity: hovered ? 1 : 0, transition: "opacity 0.3s ease" }}>
        <span style={{ color: "#C9A84C", fontSize: "10px" }}>✦</span>
      </div>
    </div>
  );
};

const FitnessCenter = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === 'dark';
  const t = {
    bg: isDark ? '#0F0D08' : '#FAF7F2',
    surface: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    border: isDark ? 'rgba(201,168,76,0.25)' : 'rgba(180,145,60,0.3)',
    text: isDark ? '#F5F0E8' : '#1A1510',
    textMuted: isDark ? 'rgba(245,240,232,0.55)' : 'rgba(26,21,16,0.60)',
    inputBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    shadow: isDark ? 'none' : '0 2px 12px rgba(180,145,60,0.08)',
    headerBg: isDark ? '#0F0D08' : 'rgba(250,247,242,0.97)',
  };

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAVIGATION BAR ─────────────────────────────────────────────── */}
      <header style={{ background: t.headerBg, borderBottom: `1px solid ${t.border}`, position: "sticky", top: 0, zIndex: 50, padding: "0 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => navigate("/")}
            style={{ background: "none", border: "none", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            <ArrowLeft style={{ width: "13px", height: "13px" }} />
            Back to Home
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#C9A84C'
              }}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <a
              href="tel:+2347069206935"
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", letterSpacing: "0.05em", textDecoration: "none", transition: "all 0.3s ease" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.08)"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <Phone style={{ width: "13px", height: "13px" }} />
              Call Fitness Center
            </a>
            <button
              onClick={() => navigate("/booking")}
              style={{ display: "flex", alignItems: "center", gap: "8px", background: "#C9A84C", color: "#0F0D08", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.05em", cursor: "pointer", transition: "background 0.3s ease" }}
              onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
              onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
            >
              <Calendar style={{ width: "13px", height: "13px" }} />
              Schedule Training
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ───────────────────────────────────────────────── */}
      <section style={{ position: "relative", height: "520px", overflow: "hidden" }}>
        <img
          src="/Mofam_pictures/fitness-hero.jpeg"
          alt="Mofam Fitness Center"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,13,8,0.55)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px" }}>
          <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "18px" }}>
            BODY · STRENGTH · ENERGY
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 64px)", color: "#F5F0E8", fontWeight: 600, margin: "0 0 8px 0", lineHeight: 1.1 }}>
            Fitness Center
          </h1>
          <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "16px auto" }} />
          <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "16px", maxWidth: "580px", lineHeight: 1.8, margin: "0 0 32px 0" }}>
            Stay at your best during your stay. Our fully equipped fitness center is available to all Mofam guests — no excuses, no extra charge.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            {["Free for Hotel Guests", "Professional Equipment", "Daily Access"].map((badge) => (
              <span
                key={badge}
                style={{ border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.12em", padding: "8px 16px", borderRadius: "20px", textTransform: "uppercase" }}
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTENT WRAPPER ────────────────────────────────────────────── */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 5%" }}>

        <OrnamentalDivider />

        {/* ── FACILITY CARDS ─────────────────────────────────────────── */}
        <FadeSection>
          <SectionHeading
            eyebrow="OUR FACILITIES"
            title="What's Inside"
            subtitle="Everything you need for a focused, productive workout — available every day of your stay."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            {facilities.map((facility, idx) => (
              <FacilityCard key={idx} facility={facility} t={t} />
            ))}
          </div>
        </FadeSection>

        <OrnamentalDivider />

        {/* ── PHOTO GALLERY ─────────────────────────────────────────── */}
        <FadeSection>
          <SectionHeading
            eyebrow="THE SPACE"
            title="Inside the Fitness Center"
            subtitle="A look at the real Mofam fitness facilities available to every guest."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {[
              { src: "/Mofam_pictures/fitness-dsc544.jpg", alt: "Mofam Fitness Center" },
              { src: "/Mofam_pictures/fitness-dsc545.jpg", alt: "Mofam Gym Equipment" },
              { src: "/Mofam_pictures/fitness-dsc547.jpg", alt: "Mofam Training Area" },
            ].map(({ src, alt }, idx) => (
              <GalleryPhoto key={idx} src={src} alt={alt} t={t} />
            ))}
          </div>
        </FadeSection>

        <OrnamentalDivider />

        {/* ── GROUP CLASSES ──────────────────────────────────────────── */}
        <FadeSection>
          <SectionHeading
            eyebrow="GROUP CLASSES"
            title="Daily Classes"
            subtitle="Join a class, build a habit. Our resident instructor leads focused sessions for all guest levels."
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
            {classes.map((cls, idx) => (
              <ClassCard key={idx} cls={cls} t={t} />
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

            {/* Facility Hours */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "28px 32px", boxShadow: t.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Clock style={{ width: "17px", height: "17px", color: "#C9A84C" }} />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: t.text, fontWeight: 600, margin: 0 }}>
                  Facility Hours
                </h3>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                {hours.map(({ label, value }, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", gap: "16px" }}>
                      <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.15em", textTransform: "uppercase", flexShrink: 0 }}>{label}</span>
                      <span style={{ color: t.text, fontSize: "14px", textAlign: "right" }}>{value}</span>
                    </div>
                    {idx < hours.length - 1 && <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)" }} />}
                  </div>
                ))}
              </div>

              <div style={{ borderTop: "1px solid rgba(201,168,76,0.1)", marginTop: "16px", paddingTop: "16px" }}>
                <p style={{ color: t.textMuted, fontSize: "12px", lineHeight: 1.7, margin: 0 }}>
                  Complimentary access for all hotel guests with valid room key.
                </p>
              </div>
            </div>

            {/* Policies */}
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "28px 32px", boxShadow: t.shadow }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "24px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Dumbbell style={{ width: "17px", height: "17px", color: "#C9A84C" }} />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: t.text, fontWeight: 600, margin: 0 }}>
                  Gym Policies
                </h3>
              </div>

              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "14px" }}>
                {policies.map((policy, idx) => (
                  <li key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                    <div style={{ width: "2px", height: "16px", background: "#C9A84C", flexShrink: 0, marginTop: "3px", opacity: 0.7 }} />
                    <span style={{ color: t.text, fontSize: "14px", lineHeight: 1.6 }}>{policy}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA Strip */}
          <div style={{ marginTop: "48px", textAlign: "center", padding: "40px 32px", background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "12px", boxShadow: t.shadow }}>
            <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: "12px" }}>
              READY TO TRAIN?
            </p>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(24px, 3vw, 36px)", color: t.text, fontWeight: 600, margin: "0 0 8px 0" }}>
              Book a Personal Training Session
            </h3>
            <p style={{ color: t.textMuted, fontSize: "14px", margin: "0 0 28px 0" }}>
              Contact the front desk to arrange a one-on-one session with our in-house trainer
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
                onClick={() => navigate("/")}
                style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "1px solid rgba(201,168,76,0.5)", color: "#C9A84C", borderRadius: "8px", padding: "14px 32px", fontSize: "14px", fontWeight: 600, cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.3s ease" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
              >
                <ArrowLeft style={{ width: "14px", height: "14px" }} />
                Back to Home
              </button>
            </div>
          </div>
        </FadeSection>
      </div>

      {/* ── PAGE FOOTER STRIP ─────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(201,168,76,0.12)", padding: "20px", textAlign: "center" }}>
        <p style={{ color: "rgba(245,240,232,0.3)", fontSize: "12px", margin: 0 }}>
          © 2025 Mofam Hotel & Apartments — Osogbo, Osun State
        </p>
      </footer>
    </div>
  );
};

export default FitnessCenter;