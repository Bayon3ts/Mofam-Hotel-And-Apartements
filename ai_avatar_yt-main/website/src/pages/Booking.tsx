import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Minus,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  Search,
  Wifi,
  Coffee,
  Car,
  Tv,
  Check,
  ChevronDown,
  AlertCircle,
  Loader2,
  Shield,
  Lock,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays, isBefore, startOfToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms, getAvailability, type RoomInventory } from "@/lib/roomStore";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabaseClient";
import { sendBookingEmails } from "@/lib/emailService";

// ─── Amenity Icon Map ────────────────────────────────────────────────────────
const AmenityIcon = ({ name }: { name: string }) => {
  const icons: Record<string, React.ReactNode> = {
    WIFI: <Wifi style={{ width: "12px", height: "12px", color: "#C9A84C" }} />,
    TV: <Tv style={{ width: "12px", height: "12px", color: "#C9A84C" }} />,
    AC: <span style={{ fontSize: "10px", fontWeight: "bold", lineHeight: 1, color: "#C9A84C" }}>AC</span>,
    COFFEE: <Coffee style={{ width: "12px", height: "12px", color: "#C9A84C" }} />,
    PARKING: <Car style={{ width: "12px", height: "12px", color: "#C9A84C" }} />,
    BUTLER: <Users style={{ width: "12px", height: "12px", color: "#C9A84C" }} />
  };
  return (
    <span style={{ border: "1px solid rgba(201,168,76,0.4)", borderRadius: "20px", padding: "4px 12px", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
      {icons[name.toUpperCase()]}
      {name}
    </span>
  );
};

// ─── Badge color map ────────────────────────────────────────────────────────
const badgeVariant = (badge: string) => {
  const b = badge.toUpperCase();
  if (b === "BEST VALUE") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (b === "POPULAR") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (b === "PREMIUM CHOICE" || b === "LAST UNIT") return "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/30";
  return "bg-accent/10 text-accent border-accent/20";
};

// ─── Format price ────────────────────────────────────────────────────────────
const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// ─── Component ───────────────────────────────────────────────────────────────
const Booking = () => {
  const navigate = useNavigate();

  // Date state
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);

  // Guest/room config
  const [numRooms, setNumRooms] = useState(1);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [guestDropOpen, setGuestDropOpen] = useState(false);
  const guestDropRef = useRef<HTMLDivElement>(null);

  // Search / result state
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomInventory[]>([]);

  // Validation errors
  const [dateError, setDateError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Customer info state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailsStep, setIsDetailsStep] = useState(false);

  // Derived values
  const nights = useMemo(() => {
    if (checkIn && checkOut) return differenceInDays(checkOut, checkIn);
    return 0;
  }, [checkIn, checkOut]);

  const safeRoomData = Array.isArray(roomData) ? roomData : [];

  const selectedRoom = useMemo(
    () => safeRoomData.find((r) => r.id === selectedRoomId) ?? null,
    [selectedRoomId, safeRoomData]
  );

  const totalPrice = useMemo(
    () => (selectedRoom ? selectedRoom.price * nights * numRooms : 0),
    [selectedRoom, nights, numRooms]
  );

  const totalGuests = adults * numRooms + children;

  // Close guest dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (guestDropRef.current && !guestDropRef.current.contains(e.target as Node)) {
        setGuestDropOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Sync Logic — Keep inventory updated from Supabase ─────────────────────
  const refreshRoomData = async () => {
    // Only refresh if we already have results showing
    if (showResults) {
      try {
        const liveRooms = await getRooms();
        console.log("[Booking] Refreshing room data:", liveRooms);
        setRoomData(Array.isArray(liveRooms) ? liveRooms : []);
      } catch (err) {
        console.error("[Booking] Sync error:", err);
      }
    }
  };

  useEffect(() => {
    window.addEventListener("focus", refreshRoomData);
    return () => {
      window.removeEventListener("focus", refreshRoomData);
    };
  }, [showResults]);

  // ── Search handler — reads LIVE data from Supabase ─────────────────────
  const handleSearch = async () => {
    setRoomError("");
    if (!checkIn || !checkOut || nights <= 0) {
      setDateError("Please select valid check-in and check-out dates.");
      return;
    }
    setDateError("");
    setShowResults(false);
    setSelectedRoomId(null);
    setIsSearching(true);

    try {
      // Pull fresh data from Supabase
      const liveRooms = await getRooms();
      console.log("[Booking] Search live rooms:", liveRooms);

      const safeLiveRooms = Array.isArray(liveRooms) ? liveRooms : [];
      setRoomData(safeLiveRooms);

      // Artificial delay for cinematic feel
      await new Promise(resolve => setTimeout(resolve, 800));

      setIsSearching(false);
      setShowResults(true);

      // Auto-select the first available room
      const firstAvailable = safeLiveRooms.find((r) => getAvailability(r) > 0);
      if (firstAvailable) {
        setSelectedRoomId(firstAvailable.id);
      }
    } catch (err) {
      console.error("[Booking] Search error:", err);
      toast.error("Unable to fetch room availability. Please try again.");
      setRoomData([]);
      setIsSearching(false);
    }
  };

  // ── Validation Helpers ─────────────────────────────────────────────────────
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }
    if (!phone.trim()) errors.phone = "Phone number is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Step control ───────────────────────────────────────────────────────────
  const proceedToDetails = () => {
    if (!selectedRoom) {
      setRoomError("Please select a room before proceeding.");
      return;
    }
    if (getAvailability(selectedRoom) <= 0) {
      setRoomError("This room is currently sold out.");
      return;
    }
    setRoomError("");
    setIsDetailsStep(true);
    // Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Final Confirm handler (Database Insertion) ──────────────────────────
  const handleFinalConfirm = async () => {
    if (!validateForm()) return;
    if (!selectedRoom) return;

    setIsSubmitting(true);

    // Prepare booking data
    const bookingData = {
      full_name: fullName,
      email: email,
      phone: phone,
      room_type: selectedRoom.name,
      check_in: format(checkIn!, "yyyy-MM-dd"),
      check_out: format(checkOut!, "yyyy-MM-dd"),
      guests: totalGuests,
      total_price: totalPrice,
      status: 'pending' // Initial status as per requirements
    };

    try {
      console.log("[Booking] Initiating secure insert:", bookingData);

      const { data, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      console.log("[Booking] Insert success:", data);

      // Trigger Emails AFTER successful insert — use the real Supabase-generated ID
      const emailSent = await sendBookingEmails({
        ...bookingData,
        id: data.id,          // Must be the real ID from Supabase response
        check_in: checkIn!,
        check_out: checkOut!
      });

      if (!emailSent) {
        toast.warning("Booking confirmed! Note: confirmation email could not be sent. Please contact the hotel directly.");
      } else {
        toast.success("Reservation confirmed! Confirmation email sent.");
      }

      // Navigate to confirmation page ONLY on success
      navigate("/bookingconfirmation", {
        state: {
          checkIn,
          checkOut,
          nights,
          numRooms,
          adults,
          children,
          totalGuests,
          selectedRoom,
          totalPrice,
          customer: { fullName, email, phone },
          bookingId: data.id
        },
      });
    } catch (err: any) {
      console.error("[Booking] Reservation failed:", err);

      // More detailed logging for debugging
      if (err.code) console.error("Error Code:", err.code);
      if (err.message) console.error("Error Message:", err.message);
      if (err.details) console.error("Error Details:", err.details);
      if (err.hint) console.error("Error Hint:", err.hint);

      toast.error("Failed to save reservation. Please click confirm again or check your connection.");
      setIsSubmitting(false);
    }
  };

  const guestLabel = `${numRooms} Room${numRooms > 1 ? "s" : ""} · ${adults} Adult${adults > 1 ? "s" : ""}${children > 0 ? ` · ${children} Child${children > 1 ? "ren" : ""}` : ""}`;

  return (
    <div className="min-h-screen text-foreground scroll-smooth" style={{ background: "#0F0D08" }}>
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ position: "relative", paddingTop: "40px", paddingBottom: "20px", maxWidth: "1200px", margin: "0 auto", paddingLeft: "5%", paddingRight: "5%" }}>
        <button
          onClick={() => navigate("/")}
          style={{ position: "absolute", top: "40px", left: "5%", display: "flex", alignItems: "center", gap: "8px", color: "#C9A84C", fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontWeight: 500, transition: "opacity 0.2s ease" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          <span style={{ fontSize: "14px" }}>←</span> Back to Hotel
        </button>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/mofam.webp" alt="Mofam Hotel And Apartements" style={{ width: "56px", height: "auto", objectFit: "contain" }} />
          <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginTop: "12px", marginBottom: "16px", fontWeight: 400 }}>
            RESERVE YOUR STAY
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 56px)", color: "#F5F0E8", fontWeight: 600, margin: 0, lineHeight: 1.1, textAlign: "center" }}>
            Book Your Stay at Mofam
          </h1>
          <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "15px", fontFamily: "'Inter', sans-serif", marginTop: "8px", marginBottom: "0", textAlign: "center", lineHeight: 1.6 }}>
            Experience Nigeria's hospitality at its finest
          </p>
          <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "16px auto 40px" }} />
        </div>
      </div>

      <main style={{ width: "100%", maxWidth: "100%", padding: 0 }}>

        {/* ── UNIFIED BOOKING BAR ─────────────────────────────────────── */}
        <div className="p-5 lg:p-7" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", maxWidth: "1100px", margin: "0 auto 10px auto", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", position: "relative" }}>
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1px_1fr_1px_1fr_auto] gap-6 lg:items-end">
            {/* Check-In */}
            <div className="flex-1 space-y-2">
              <Label style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Check-In</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="contact-luxury-input" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: checkIn ? "#F5F0E8" : "rgba(245,240,232,0.35)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                    <CalendarIcon style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                    {checkIn ? format(checkIn, "EEE, MMM dd") : "Add check-in date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0 bg-transparent" align="start">
                  <div className="booking-calendar-wrapper" style={{ padding: "16px" }}>
                    <Calendar
                      mode="single"
                      selected={checkIn}
                      onSelect={(d) => { setCheckIn(d); if (d && checkOut && !isBefore(d, checkOut)) setCheckOut(undefined); setDateError(""); }}
                      disabled={(date) => isBefore(date, startOfToday())}
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="hidden lg:block w-[1px] bg-[rgba(201,168,76,0.15)] self-stretch my-2" />

            {/* Check-Out */}
            <div className="flex-1 space-y-2">
              <Label style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Check-Out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="contact-luxury-input" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: checkOut ? "#F5F0E8" : "rgba(245,240,232,0.35)", padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                    <CalendarIcon style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                    {checkOut ? format(checkOut, "EEE, MMM dd") : "Add check-out date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0 bg-transparent" align="start">
                  <div className="booking-calendar-wrapper" style={{ padding: "16px" }}>
                    <Calendar
                      mode="single"
                      selected={checkOut}
                      onSelect={(d) => { setCheckOut(d); setDateError(""); }}
                      disabled={(date) => checkIn ? isBefore(date, addDays(checkIn, 1)) : isBefore(date, startOfToday())}
                      initialFocus
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="hidden lg:block w-[1px] bg-[rgba(201,168,76,0.15)] self-stretch my-2" />

            {/* Guests & Rooms */}
            <div className="flex-1 space-y-2 relative" ref={guestDropRef}>
              <Label style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Guests & Rooms</Label>
              <button className="contact-luxury-input" onClick={() => setGuestDropOpen(!guestDropOpen)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                <span className="flex items-center gap-2 overflow-hidden truncate">
                  <Users style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                  <span className="truncate">{guestLabel}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", guestDropOpen && "rotate-180")} style={{ color: "#C9A84C" }} />
              </button>
              {guestDropOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-[300px] z-[51] rounded-xl shadow-2xl p-5 space-y-5" style={{ background: "#1A1610", border: "1px solid rgba(201,168,76,0.3)" }}>
                  {[
                    { label: "Rooms", count: numRooms, set: setNumRooms, min: 1, desc: "" },
                    { label: "Adults", count: adults, set: setAdults, min: 1, desc: "Ages 18+" },
                    { label: "Children", count: children, set: setChildren, min: 0, desc: "Ages 0-17" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "14px", color: "#F5F0E8" }}>{item.label}</p>
                        {item.desc && <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.desc}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => item.set(Math.max(item.min, item.count - 1))} disabled={item.count <= item.min} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#C9A84C", cursor: item.count <= item.min ? "not-allowed" : "pointer", opacity: item.count <= item.min ? 0.3 : 1 }}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span style={{ width: "20px", textAlign: "center", fontWeight: 700, color: "#F5F0E8" }}>{item.count}</span>
                        <button onClick={() => item.set(item.count + 1)} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#C9A84C", cursor: "pointer" }}>
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <button style={{ width: "100%", background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer" }} onClick={() => setGuestDropOpen(false)}>Apply Selection</button>
                </div>
              )}
            </div>

            {/* Find Rooms */}
            <div className="flex items-end">
              <button
                onClick={handleSearch}
                disabled={isSearching}
                style={{ background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "16px 32px", borderRadius: "8px", letterSpacing: "0.06em", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", transition: "background 0.3s ease" }}
                onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
                onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
              >
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" style={{ color: "#0F0D08" }} />}
                {isSearching ? "Searching..." : "Find Rooms"}
              </button>
            </div>
          </div>
          {dateError && <p className="text-red-500 text-xs font-medium mt-3 animate-in fade-in slide-in-from-top-1" style={{ position: "absolute", bottom: "-24px" }}>{dateError}</p>}
        </div>

        {/* ── LUXURY REASSURANCE STRIP ─────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "48px", marginTop: "48px", marginBottom: "48px", flexWrap: "wrap" }}>
          {[
            { label: "Free Cancellation", icon: <Shield style={{ color: "#C9A84C", width: "18px", height: "18px" }} /> },
            { label: "Best Rate Guaranteed", icon: <Check style={{ color: "#C9A84C", width: "18px", height: "18px" }} /> },
            { label: "Instant Confirmation", icon: <Zap style={{ color: "#C9A84C", width: "18px", height: "18px" }} /> }
          ].map((item, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {item.icon}
              </div>
              <span style={{ color: "rgba(245,240,232,0.6)", fontSize: "12px", letterSpacing: "0.08em", fontFamily: "'Inter', sans-serif" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── CUSTOMER DETAILS FORM (STEP 2) ────────────────────────── */}
        {isDetailsStep && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500" style={{ maxWidth: "1100px", margin: "0 auto", marginBottom: "40px" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "12px", padding: "40px" }}>
              <div className="flex items-start justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.15)", paddingBottom: "32px", marginBottom: "32px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", color: "#F5F0E8", fontWeight: 600, margin: 0 }}>Customer Information</h3>
                  <div style={{ width: "48px", height: "1px", background: "#C9A84C", margin: "8px 0 4px" }} />
                  <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", margin: 0 }}>Details for your reservation</p>
                </div>
                <button onClick={() => setIsDetailsStep(false)} disabled={isSubmitting} style={{ background: "none", border: "none", color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", alignItems: "center", cursor: "pointer", opacity: 1, transition: "opacity 0.2s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.7"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                  <ArrowLeft style={{ width: "12px", height: "12px", marginRight: "8px" }} /> Change Selection
                </button>
              </div>
              <div className="grid gap-12 md:grid-cols-[1fr_340px]">
                <div className="space-y-6">
                  {/* FULL NAME */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="fullName" style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>Full Name</label>
                    <input
                      id="fullName"
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: "" })); }}
                      disabled={isSubmitting}
                      className="placeholder:text-[rgba(245,240,232,0.3)]"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.08)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {formErrors.fullName && <p style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>{formErrors.fullName}</p>}
                  </div>

                  {/* EMAIL */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="email" style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>Email Address</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" })); }}
                      disabled={isSubmitting}
                      className="placeholder:text-[rgba(245,240,232,0.3)]"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.08)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {formErrors.email && <p style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>{formErrors.email}</p>}
                  </div>

                  {/* PHONE */}
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <label htmlFor="phone" style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px" }}>Phone Number</label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="+234 (0) 800-000-0000"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: "" })); }}
                      disabled={isSubmitting}
                      className="placeholder:text-[rgba(245,240,232,0.3)]"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(201,168,76,0.08)"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    {formErrors.phone && <p style={{ color: "#ef4444", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px" }}>{formErrors.phone}</p>}
                  </div>
                </div>

                <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h4 style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", margin: 0 }}>
                      <Lock style={{ width: "12px", height: "12px" }} /> Secure Checkout
                    </h4>
                    <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "13px", lineHeight: 1.7, margin: "0" }}>
                      Your data is encrypted and used only for managing your reservation. By clicking confirm, you agree to our terms of service and editorial standards.
                    </p>
                  </div>
                  <div style={{ marginTop: "24px" }}>
                    <button
                      onClick={handleFinalConfirm}
                      disabled={isSubmitting}
                      style={{ background: "#C9A84C", color: "#0F0D08", fontWeight: 700, width: "100%", padding: "16px", borderRadius: "8px", letterSpacing: "0.06em", fontSize: "15px", border: "none", cursor: isSubmitting ? "not-allowed" : "pointer", opacity: isSubmitting ? 0.7 : 1, transition: "background 0.3s ease" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
                      onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
                    >
                      {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> Processing...</> : "Confirm Reservation"}
                    </button>
                    <p style={{ fontSize: "10px", fontWeight: 700, textAlign: "center", color: "rgba(245,240,232,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "12px", fontStyle: "italic", margin: "12px 0 0 0" }}>
                      No credit card required for standard sessions
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS (STEP 1) ───────────────────────────────────────── */}
        {!isDetailsStep && (isSearching || showResults) && (
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 40px 0 40px", display: "flex", gap: "32px", alignItems: "flex-start" }} className="animate-in fade-in duration-500 max-lg:flex-col max-lg:px-6 max-lg:py-8">
            {/* Left: Rooms */}
            <div style={{ flex: 1, maxWidth: "720px", display: "flex", flexDirection: "column", gap: "16px" }} className="w-full">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xl font-extrabold tracking-tight" style={{ color: "#F5F0E8" }}>
                  {isSearching ? "Finding Best Rates…" : `${safeRoomData.length} Room Types Available`}
                </h3>
              </div>

              {isSearching && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6 space-y-4 animate-pulse border-border/50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1"><Skeleton className="h-6 w-1/3" /><Skeleton className="h-4 w-1/4" /></div>
                        <Skeleton className="h-8 w-24" />
                      </div>
                      <Skeleton className="h-16 w-full" />
                      <div className="flex justify-between items-center"><Skeleton className="h-6 w-32" /><Skeleton className="h-10 w-28" /></div>
                    </Card>
                  ))}
                </div>
              )}

              {showResults && !isSearching && safeRoomData.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border animate-in fade-in">
                  <p className="text-lg font-medium text-muted-foreground">No rooms found for your selected criteria.</p>
                </div>
              )}

              {showResults && !isSearching && safeRoomData.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {safeRoomData.map((room, idx) => {
                    const isSelected = selectedRoomId === room.id;
                    const available = getAvailability(room);
                    const isSoldOut = available <= 0;
                    const onlyFewLeft = available > 0 && available <= 2;

                    return (
                      <div
                        key={room.id}
                        onClick={() => { if (!isSoldOut) { setSelectedRoomId(room.id); setRoomError(""); } }}
                        className="animate-in fade-in slide-in-from-bottom-4 group"
                        style={{
                          padding: "24px",
                          borderRadius: "12px",
                          border: "1px solid rgba(201,168,76,0.25)",
                          marginBottom: "16px",
                          background: isSelected ? "rgba(201,168,76,0.05)" : "transparent",
                          cursor: isSoldOut ? "not-allowed" : "pointer",
                          opacity: isSoldOut ? 0.5 : 1,
                          animationDelay: `${idx * 80}ms`,
                          transition: "all 0.3s ease"
                        }}
                      >
                        {/* Top: Name + Badge + Price Row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#F5F0E8", margin: 0, fontWeight: 600 }}>{room.name}</h4>
                              {room.badge && !isSoldOut && (
                                <span className={cn("px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-full border", badgeVariant(room.badge))}>
                                  {room.badge}
                                </span>
                              )}
                              {onlyFewLeft && (
                                <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-full border border-red-500/30 bg-red-500/10 text-red-600 animate-pulse">
                                  <AlertCircle className="h-3 w-3" />
                                  Only {available} left
                                </span>
                              )}
                              {isSoldOut && (
                                <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-full border border-border bg-muted text-muted-foreground">
                                  Sold Out
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-accent tracking-wide uppercase opacity-80">{room.tag}</p>
                          </div>

                          <div className="shrink-0 text-left sm:text-right">
                            <p style={{ color: "#C9A84C", fontSize: "20px", fontWeight: 600, margin: 0 }}>{fmt(room.price)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">per night</p>
                          </div>
                        </div>

                        {/* Middle: Description */}
                        <p style={{ fontSize: "14px", color: "rgba(245,240,232,0.6)", lineHeight: 1.7, margin: "0 0 24px 0" }}>{room.description}</p>

                        {/* Bottom: Amenities + Action */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto pt-4" style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                          <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                            {(room.amenities || []).map((a) => <AmenityIcon key={a} name={a} />)}
                            <Separator orientation="vertical" className="h-3 hidden sm:block bg-[rgba(201,168,76,0.3)]" />
                            <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Max {room.maxGuests} Guests</span>
                          </div>

                          <button
                            style={{
                              background: isSelected ? "#C9A84C" : "transparent",
                              border: isSelected ? "1px solid #C9A84C" : "1px solid rgba(201,168,76,0.55)",
                              color: isSelected ? "#0F0D08" : "#C9A84C",
                              padding: "10px 24px",
                              borderRadius: "8px",
                              fontWeight: 700,
                              cursor: isSoldOut ? "not-allowed" : "pointer",
                              fontSize: "13px",
                              transition: "all 0.3s ease",
                              width: "100%",
                              maxWidth: "160px"
                            }}
                            disabled={isSoldOut}
                          >
                            {isSelected ? "Selected" : isSoldOut ? "Sold Out" : "Select Room"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Sticky Summary */}
            <div style={{ width: "340px", flexShrink: 0, position: "sticky", top: "24px" }} className="hidden lg:block">
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "12px", padding: "28px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: "#F5F0E8", margin: "0 0 24px 0", fontWeight: 600 }}>Your Reservation</h3>
                </div>

                <div className="space-y-6">
                  {checkIn && checkOut && (
                    <div className="grid grid-cols-2 gap-3">
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.15)" }}>
                        <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", margin: 0 }}>Check-In</p>
                        <p style={{ color: "#F5F0E8", fontSize: "15px", margin: 0 }}>{format(checkIn, "MMM dd, yyyy")}</p>
                      </div>
                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.15)" }}>
                        <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", margin: 0 }}>Check-Out</p>
                        <p style={{ color: "#F5F0E8", fontSize: "15px", margin: 0 }}>{format(checkOut, "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-1">
                    <div className="flex flex-col gap-1 items-center">
                      <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Nights</span>
                      <span style={{ color: "#F5F0E8", fontSize: "15px" }}>{nights}</span>
                    </div>
                    <Separator orientation="vertical" className="h-8 bg-[rgba(201,168,76,0.15)]" />
                    <div className="flex flex-col gap-1 items-center">
                      <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Rooms</span>
                      <span style={{ color: "#F5F0E8", fontSize: "15px" }}>{numRooms}</span>
                    </div>
                    <Separator orientation="vertical" className="h-8 bg-[rgba(201,168,76,0.15)]" />
                    <div className="flex flex-col gap-1 items-center">
                      <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Guests</span>
                      <span style={{ color: "#F5F0E8", fontSize: "15px" }}>{totalGuests}</span>
                    </div>
                  </div>

                  <Separator className="bg-[rgba(201,168,76,0.15)]" />

                  {selectedRoom ? (
                    <div className="space-y-6">
                      <div className="animate-in fade-in slide-in-from-right-4">
                        <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>Selected Accommodation</p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p style={{ color: "#F5F0E8", fontSize: "15px", margin: 0, fontWeight: 600 }}>{selectedRoom.name}</p>
                            <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.8, margin: 0 }}>{selectedRoom.tag}</p>
                          </div>
                          <p style={{ color: "rgba(245,240,232,0.6)", fontSize: "14px", margin: 0 }}>{fmt(selectedRoom.price)}/nt</p>
                        </div>
                      </div>

                      <div style={{ background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "8px", border: "1px solid rgba(201,168,76,0.15)" }} className="space-y-3">
                        <div className="flex justify-between">
                          <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Room Charge</span>
                          <span style={{ color: "#F5F0E8", fontSize: "15px" }}>{fmt(selectedRoom.price * nights)}</span>
                        </div>
                        {numRooms > 1 && (
                          <div className="flex justify-between">
                            <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>× {numRooms} Rooms</span>
                            <span style={{ color: "#F5F0E8", fontSize: "15px" }}>{fmt(selectedRoom.price * nights * numRooms)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>VAT & Taxes</span>
                          <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Included</span>
                        </div>
                        <Separator className="bg-[rgba(201,168,76,0.15)]" />
                        <div className="flex justify-between items-center pt-1">
                          <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Total Price</span>
                          <span style={{ color: "#C9A84C", fontSize: "24px", fontWeight: 700 }}>{fmt(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 opacity-40">
                      <CreditCard className="h-10 w-10 mx-auto" style={{ color: "#C9A84C" }} strokeWidth={1} />
                      <p style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Select a room to calculate total</p>
                    </div>
                  )}

                  {roomError && <p className="text-red-500 text-[11px] font-bold uppercase text-center bg-red-500/10 py-2 rounded-lg">{roomError}</p>}

                  <button
                    onClick={isDetailsStep ? handleFinalConfirm : proceedToDetails}
                    disabled={!selectedRoom || isSubmitting}
                    style={{ background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "16px", borderRadius: "8px", width: "100%", border: "none", cursor: (!selectedRoom || isSubmitting) ? "not-allowed" : "pointer", opacity: (!selectedRoom || isSubmitting) ? 0.5 : 1, transition: "background 0.3s ease" }}
                  >
                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin inline" /> Confirming...</> : isDetailsStep ? "Confirm Reservation" : "Proceed to Details"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sticky Bar */}
      {showResults && selectedRoom && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl px-6 py-4 flex items-center justify-between gap-6 animate-in slide-in-from-bottom-full duration-500">
          <div className="space-y-0.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none">{selectedRoom.name} · {nights} Night{nights !== 1 ? "s" : ""}</p>
            <p className="text-2xl font-black text-accent tracking-tighter">{fmt(totalPrice)}</p>
          </div>
          <Button
            variant="luxury"
            className="h-12 px-8 font-black text-sm tracking-wide rounded-xl shadow-lg shadow-accent/20"
            onClick={isDetailsStep ? handleFinalConfirm : proceedToDetails}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Confirming..." : isDetailsStep ? "Confirm" : "Reserve"}
          </Button>
        </div>
      )}

      {showResults && selectedRoom && <div className="h-28 lg:hidden" />}

      {/* ── PAGE FOOTER STRIP ─────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(201,168,76,0.12)", padding: "20px", textAlign: "center", marginTop: "auto" }}>
        <p style={{ color: "rgba(245,240,232,0.3)", fontSize: "12px", fontFamily: "'Inter', sans-serif", margin: 0 }}>
          © 2025 Mofam Hotel &amp; Apartments
        </p>
      </footer>
    </div>
  );
};

export default Booking;