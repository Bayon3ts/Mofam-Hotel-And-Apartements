import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInDays, isBefore, startOfToday, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getRooms, getAvailability, isRoomAvailableForDates, type RoomInventory } from "@/lib/roomStore";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/lib/supabaseClient";
import { sendBookingEmails } from "@/lib/emailService";
import { useTheme } from "@/hooks/useTheme";

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
    dropdownBg: isDark ? '#1A1610' : '#FFFFFF',
    dropdownColor: isDark ? '#F5F0E8' : '#1A1510',
    dropdownBorder: isDark ? '1px solid rgba(201,168,76,0.3)' : '1px solid rgba(180,145,60,0.3)',
  };

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
  const [resultsOpen, setResultsOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<RoomInventory[]>([]);

  // Date-aware availability: remaining rooms per room id, keyed by room.id
  // Populated/refreshed whenever check-in or check-out changes
  const [dateAwareAvailability, setDateAwareAvailability] = useState<Record<string, number>>({});
  // True while the date-aware availability check is in flight — selection is
  // locked during this window so a room can NEVER be picked before we know
  // for certain it's actually free for the chosen dates.
  const [isAvailabilityChecking, setIsAvailabilityChecking] = useState(false);
  // Branded transition shown after "Reserve" is clicked, before the details form appears
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  // Single source of truth for "how many of this room are actually free" —
  // used by the card click handler, the Reserve button, and proceedToDetails,
  // so all three can never disagree with each other.
  //
  // There are two independent availability signals in this app, and a room
  // must respect BOTH — whichever is more restrictive wins:
  //   1. Flat/admin-managed (totalRooms - bookedRooms): what the Admin panel
  //      and the public Rooms & Suites page show (e.g. "FULLY BOOKED").
  //      This is a manual figure the hotel staff control directly.
  //   2. Date-aware (real overlap check against the bookings table for the
  //      selected check-in/check-out): catches specific date conflicts the
  //      flat counter alone wouldn't know about.
  // A room the admin has marked fully booked can NEVER be selected here,
  // even if no overlapping reservation row exists for these exact dates.
  const getRoomAvailable = (room: RoomInventory) => {
    const flatAvailable = getAvailability(room);
    const dateAwareAvailable = (checkIn && checkOut && room.id in dateAwareAvailability)
      ? dateAwareAvailability[room.id]
      : flatAvailable;
    return Math.min(flatAvailable, dateAwareAvailable);
  };

  // A room is only genuinely selectable if there are enough free units to
  // cover how many rooms the guest is actually requesting — not merely > 0.
  // Requesting 2 rooms when only 1 is left must NEVER be selectable.
  const canSelectRoom = (room: RoomInventory) => getRoomAvailable(room) >= numRooms;

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

  // ── Date-Aware Availability Effect ────────────────────────────────────────
  // Re-run whenever dates or room list change to update remaining counts
  useEffect(() => {
    if (!checkIn || !checkOut || safeRoomData.length === 0) return;
    const checkInStr = format(checkIn, "yyyy-MM-dd");
    const checkOutStr = format(checkOut, "yyyy-MM-dd");

    setIsAvailabilityChecking(true);
    (async () => {
      const results: Record<string, number> = {};
      for (const room of safeRoomData) {
        try {
          const { remaining } = await isRoomAvailableForDates(
            room.name,       // bookings table stores display name in room_type
            room.totalRooms,
            checkInStr,
            checkOutStr
          );
          results[room.id] = remaining;
        } catch {
          // On error, fall back to flat counter so the UI keeps working
          results[room.id] = getAvailability(room);
        }
      }
      setDateAwareAvailability(results);
      setIsAvailabilityChecking(false);
    })();
  }, [checkIn, checkOut, safeRoomData]);

  // ── Selection Safety Net ──────────────────────────────────────────────────
  // If the room a guest has selected turns out to be unavailable — whether
  // that's revealed by the date-aware check above, or by a live inventory
  // refresh while they're browsing — deselect it immediately. A sold-out
  // room, or one with fewer free units than the number of rooms requested,
  // can never remain "selected".
  useEffect(() => {
    if (!selectedRoomId) return;
    const room = safeRoomData.find((r) => r.id === selectedRoomId);
    if (!room) return;
    if (!isAvailabilityChecking && !canSelectRoom(room)) {
      setSelectedRoomId(null);
      const remaining = getRoomAvailable(room);
      setRoomError(
        remaining <= 0
          ? `${room.name} just became unavailable. Please choose another room.`
          : `Only ${remaining} ${room.name} room${remaining === 1 ? "" : "s"} left — not enough for your ${numRooms}-room request.`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoomId, dateAwareAvailability, safeRoomData, isAvailabilityChecking, numRooms]);

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
    setResultsOpen(true); // open the popup immediately — no scrolling needed to see the loading state

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
    if (isAvailabilityChecking) {
      setRoomError("Still confirming availability for your dates — one moment.");
      return;
    }
    if (!canSelectRoom(selectedRoom)) {
      setSelectedRoomId(null);
      setRoomError("This room no longer has enough units available. Please choose another.");
      return;
    }
    setRoomError("");
    setIsDetailsStep(true);
    // Scroll to top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Called when "Reserve" is clicked in the results popup. Re-validates
  // availability one last time, then plays a short branded transition
  // before handing off to the details form.
  const handleReserveClick = () => {
    if (!selectedRoom) {
      setRoomError("Please select a room before proceeding.");
      return;
    }
    if (isAvailabilityChecking) {
      setRoomError("Still confirming availability for your dates — one moment.");
      return;
    }
    if (!canSelectRoom(selectedRoom)) {
      setSelectedRoomId(null);
      setRoomError("This room no longer has enough units available. Please choose another.");
      return;
    }
    setRoomError("");
    setIsTransitioning(true);
    window.setTimeout(() => {
      setIsTransitioning(false);
      proceedToDetails();
    }, 900);
  };

  // ── Final Confirm handler (Database Insertion) ──────────────────────────
  const handleFinalConfirm = async () => {
    if (!validateForm()) return;
    if (!selectedRoom) return;

    setIsSubmitting(true);

    // ── Availability guard (last check before insert) ──────────────────────
    // This runs as close as possible to the insert to minimise the race-condition
    // window between two guests booking the last available room simultaneously.
    // Checks BOTH signals — the admin's flat inventory counter AND the
    // date-aware overlap check — so a room the admin has marked fully booked
    // can never slip through here even without a matching bookings row.
    try {
      // Pull the freshest flat inventory count directly from Supabase —
      // don't trust `selectedRoom` from state, which may be stale.
      const liveRooms = await getRooms();
      const liveRoom = (Array.isArray(liveRooms) ? liveRooms : []).find((r) => r.id === selectedRoom.id);
      const flatRemaining = liveRoom ? getAvailability(liveRoom) : getAvailability(selectedRoom);

      const checkInStr = format(checkIn!, "yyyy-MM-dd");
      const checkOutStr = format(checkOut!, "yyyy-MM-dd");
      const { available, remaining: dateAwareRemaining } = await isRoomAvailableForDates(
        selectedRoom.name,
        selectedRoom.totalRooms,
        checkInStr,
        checkOutStr
      );

      const remaining = Math.min(flatRemaining, dateAwareRemaining);

      if (!available || remaining < numRooms) {
        toast.error(
          remaining <= 0
            ? `Sorry, ${selectedRoom.name} is fully booked. Please choose another room type.`
            : `Sorry, only ${remaining} ${selectedRoom.name} room${remaining === 1 ? "" : "s"} left — not enough for your ${numRooms}-room request.`
        );
        setSelectedRoomId(null);
        setIsSubmitting(false);
        setIsDetailsStep(false); // send them back to the picker — a details form with no room selected is a dead end
        setResultsOpen(true);
        refreshRoomData(); // pull fresh counts so the reopened picker isn't showing stale numbers
        return; // Stop here — do not insert the booking
      }

      // Log remaining for debugging
      console.log(`[Booking] Date-aware check passed: ${remaining} room(s) remaining for '${selectedRoom.name}' on ${checkInStr}→${checkOutStr}`);
    } catch (err: any) {
      console.error('[Booking] Availability pre-check failed:', err);
      toast.error(err?.message || 'Unable to verify availability. Please try again.');
      setIsSubmitting(false);
      return;
    }

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
    <div className="min-h-screen text-foreground scroll-smooth" style={{ background: t.bg }}>
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
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 4vw, 56px)", color: t.text, fontWeight: 600, margin: 0, lineHeight: 1.1, textAlign: "center" }}>
            Book Your Stay at Mofam
          </h1>
          <p style={{ color: t.textMuted, fontSize: "15px", fontFamily: "'Inter', sans-serif", marginTop: "8px", marginBottom: "0", textAlign: "center", lineHeight: 1.6 }}>
            Experience Nigeria's hospitality at its finest
          </p>
          <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "16px auto 40px" }} />
        </div>
      </div>

      <main style={{ width: "100%", maxWidth: "100%", padding: 0 }}>

        {/* ── UNIFIED BOOKING BAR ─────────────────────────────────────── */}
        <div className="p-5 lg:p-7" style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", maxWidth: "1100px", margin: "0 auto 10px auto", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", position: "relative", boxShadow: t.shadow }}>
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_1px_1fr_1px_1fr_auto] gap-6 lg:items-end">
            {/* Check-In */}
            <div className="flex-1 space-y-2">
              <Label style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "8px", display: "block" }}>Check-In</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="contact-luxury-input" style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: checkIn ? t.text : t.textMuted, padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                    <CalendarIcon style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                    {checkIn ? format(checkIn, "EEE, MMM dd") : "Add check-in date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0 bg-transparent" align="start">
                  <div className="booking-calendar-wrapper" style={{ padding: "16px", background: t.dropdownBg, color: t.dropdownColor, border: t.dropdownBorder, borderRadius: "12px", boxShadow: t.shadow }}>
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
                  <button className="contact-luxury-input" style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: checkOut ? t.text : t.textMuted, padding: "14px 16px", display: "flex", alignItems: "center", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                    <CalendarIcon style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                    {checkOut ? format(checkOut, "EEE, MMM dd") : "Add check-out date"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 border-0 bg-transparent" align="start">
                  <div className="booking-calendar-wrapper" style={{ padding: "16px", background: t.dropdownBg, color: t.dropdownColor, border: t.dropdownBorder, borderRadius: "12px", boxShadow: t.shadow }}>
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
              <button className="contact-luxury-input" onClick={() => setGuestDropOpen(!guestDropOpen)} style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", fontFamily: "'Inter', sans-serif", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease" }}>
                <span className="flex items-center gap-2 overflow-hidden truncate">
                  <Users style={{ color: "#C9A84C", width: "16px", height: "16px" }} />
                  <span className="truncate">{guestLabel}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", guestDropOpen && "rotate-180")} style={{ color: "#C9A84C" }} />
              </button>
              {guestDropOpen && (
                <div className="absolute left-0 top-[calc(100%+8px)] w-[300px] z-[51] rounded-xl shadow-2xl p-5 space-y-5" style={{ background: t.dropdownBg, color: t.dropdownColor, border: t.dropdownBorder, boxShadow: t.shadow }}>
                  {[
                    { label: "Rooms", count: numRooms, set: setNumRooms, min: 1, desc: "" },
                    { label: "Adults", count: adults, set: setAdults, min: 1, desc: "Ages 18+" },
                    { label: "Children", count: children, set: setChildren, min: 0, desc: "Ages 0-17" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p style={{ fontWeight: 600, fontSize: "14px", color: t.dropdownColor }}>{item.label}</p>
                        {item.desc && <p style={{ fontSize: "10px", color: "rgba(201,168,76,0.6)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.desc}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => item.set(Math.max(item.min, item.count - 1))} disabled={item.count <= item.min} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "#C9A84C", cursor: item.count <= item.min ? "not-allowed" : "pointer", opacity: item.count <= item.min ? 0.3 : 1 }}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span style={{ width: "20px", textAlign: "center", fontWeight: 700, color: t.dropdownColor }}>{item.count}</span>
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
              <span style={{ color: t.textMuted, fontSize: "12px", letterSpacing: "0.08em", fontFamily: "'Inter', sans-serif" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── CUSTOMER DETAILS FORM (STEP 2) ────────────────────────── */}
        {isDetailsStep && (
          <div className="animate-in fade-in slide-in-from-bottom-5 duration-500" style={{ maxWidth: "1100px", margin: "0 auto", marginBottom: "40px" }}>
            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "40px", boxShadow: t.shadow }}>
              <div className="flex items-start justify-between" style={{ borderBottom: "1px solid rgba(201,168,76,0.15)", paddingBottom: "32px", marginBottom: "32px" }}>
                <div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "32px", color: t.text, fontWeight: 600, margin: 0 }}>Customer Information</h3>
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
                      style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
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
                      style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
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
                      style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "8px", color: t.text, padding: "14px 16px", fontSize: "14px", outline: "none", width: "100%", transition: "all 0.2s" }}
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
                    <p style={{ color: t.textMuted, fontSize: "13px", lineHeight: 1.7, margin: "0" }}>
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

        {/* ── RESULTS MODAL (STEP 1) ─────────────────────────────────
             Opens the instant "Find Rooms" is clicked — no scrolling
             required. Shows a loading state first, then results. ──── */}
        {!isDetailsStep && (
          <Dialog open={resultsOpen} onOpenChange={(open) => { if (!isTransitioning) setResultsOpen(open); }}>
            <DialogContent
              className="p-0 gap-0 overflow-hidden flex flex-col w-[94vw] sm:w-full sm:max-w-2xl lg:max-w-5xl max-h-[88vh] rounded-2xl"
              style={{ background: t.bg, border: `1px solid ${t.border}` }}
              onInteractOutside={(e) => { if (isTransitioning) e.preventDefault(); }}
              onEscapeKeyDown={(e) => { if (isTransitioning) e.preventDefault(); }}
            >
              {/* Header */}
              <DialogHeader className="shrink-0 text-left px-5 sm:px-8 pt-6 pb-5 border-b" style={{ borderColor: "rgba(201,168,76,0.15)" }}>
                <DialogTitle
                  style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(20px, 3vw, 28px)", color: t.text, fontWeight: 600, margin: 0 }}
                >
                  {isSearching
                    ? "Finding Your Perfect Stay…"
                    : showResults && safeRoomData.length === 0
                      ? "No Rooms Found"
                      : `${safeRoomData.length} Room Type${safeRoomData.length !== 1 ? "s" : ""} Available`}
                </DialogTitle>
                {checkIn && checkOut && (
                  <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", margin: "4px 0 0 0" }}>
                    {format(checkIn, "MMM dd")} → {format(checkOut, "MMM dd, yyyy")} &nbsp;·&nbsp; {nights} Night{nights !== 1 ? "s" : ""} &nbsp;·&nbsp; {numRooms} Room{numRooms !== 1 ? "s" : ""}
                  </p>
                )}
              </DialogHeader>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
                {isSearching && (
                  <div className="space-y-4">
                    {/* Nice centered loading state */}
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="relative h-16 w-16 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full animate-ping" style={{ border: "2px solid rgba(201,168,76,0.35)" }} />
                        <div className="absolute inset-2 rounded-full animate-pulse" style={{ border: "2px solid rgba(201,168,76,0.55)" }} />
                        <div className="relative h-9 w-9 rounded-full flex items-center justify-center" style={{ background: "rgba(201,168,76,0.12)" }}>
                          <Search className="h-4 w-4" style={{ color: "#C9A84C" }} />
                        </div>
                      </div>
                      <p style={{ color: t.textMuted, fontSize: "13px", letterSpacing: "0.04em", textAlign: "center" }}>
                        Checking live availability across all room types…
                      </p>
                    </div>

                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6 space-y-4 animate-pulse border-border/50" style={{ animationDelay: `${i * 100}ms` }}>
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
                  <div className="grid gap-8 lg:grid-cols-[1fr_300px] items-start">
                    {/* Rooms */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {isAvailabilityChecking && (
                        <div className="flex items-center gap-2 px-1 pb-1" style={{ color: t.textMuted, fontSize: "12px" }}>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "#C9A84C" }} />
                          Confirming exact availability for your dates…
                        </div>
                      )}
                      {safeRoomData.map((room, idx) => {
                        const isSelected = selectedRoomId === room.id;
                        const available = getRoomAvailable(room);
                        const isFullySoldOut = available <= 0;
                        // Not enough units for the number of rooms requested — distinct from
                        // fully sold out, but equally unselectable. Under no circumstance
                        // should a room the guest can't actually get be tappable.
                        const isInsufficientQty = !isFullySoldOut && available < numRooms;
                        // Selection is locked entirely while we're still confirming
                        // date-aware availability — a room can never be tapped
                        // before we're certain it's actually free.
                        const isSoldOut = isAvailabilityChecking || isFullySoldOut || isInsufficientQty;
                        const onlyFewLeft = !isAvailabilityChecking && !isFullySoldOut && !isInsufficientQty && available <= 2;

                        return (
                          <div
                            key={room.id}
                            onClick={() => { if (!isSoldOut) { setSelectedRoomId(room.id); setRoomError(""); } }}
                            className="animate-in fade-in slide-in-from-bottom-4 group"
                            style={{
                              padding: "24px",
                              borderRadius: "12px",
                              border: `1px solid ${isSelected ? "#C9A84C" : t.border}`,
                              background: isSelected ? "rgba(201,168,76,0.05)" : t.surface,
                              cursor: isSoldOut ? "not-allowed" : "pointer",
                              opacity: isAvailabilityChecking ? 0.7 : isSoldOut ? 0.5 : 1,
                              animationDelay: `${idx * 80}ms`,
                              transition: "all 0.3s ease",
                            }}
                          >
                            {/* Top: Name + Badge + Price Row */}
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", color: t.text, margin: 0, fontWeight: 600 }}>{room.name}</h4>
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
                                  {!isAvailabilityChecking && isInsufficientQty && (
                                    <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded-full border border-red-500/30 bg-red-500/10 text-red-600">
                                      <AlertCircle className="h-3 w-3" />
                                      Only {available} left — need {numRooms}
                                    </span>
                                  )}
                                  {!isAvailabilityChecking && isFullySoldOut && (
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
                            <p style={{ fontSize: "14px", color: t.textMuted, lineHeight: 1.7, margin: "0 0 24px 0" }}>{room.description}</p>

                            {/* Bottom: Amenities + Action */}
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto pt-4" style={{ borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                              <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                                {(room.amenities || []).map((a) => <AmenityIcon key={a} name={a} />)}
                                <Separator orientation="vertical" className="h-3 hidden sm:block bg-[rgba(201,168,76,0.3)]" />
                                <span style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase" }}>Max {room.maxGuests} Guests</span>
                              </div>

                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "13px",
                                  color: isSelected ? "#C9A84C" : t.textMuted,
                                  letterSpacing: "0.05em",
                                }}
                              >
                                {isAvailabilityChecking
                                  ? "Checking…"
                                  : isSelected
                                    ? "✓ Selected"
                                    : isFullySoldOut
                                      ? "Sold Out"
                                      : isInsufficientQty
                                        ? "Not enough available"
                                        : "Tap to select"}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reservation Summary (desktop) */}
                    <div className="hidden lg:block sticky top-0">
                      <div style={{ background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: "12px", padding: "24px" }}>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", color: t.text, margin: "0 0 16px 0", fontWeight: 600 }}>Your Reservation</h3>

                        <div className="space-y-4">
                          {checkIn && checkOut && (
                            <div className="grid grid-cols-2 gap-2">
                              <div style={{ background: t.bg, padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
                                <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Check-In</p>
                                <p style={{ color: t.text, fontSize: "13px", margin: 0 }}>{format(checkIn, "MMM dd, yyyy")}</p>
                              </div>
                              <div style={{ background: t.bg, padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}` }}>
                                <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Check-Out</p>
                                <p style={{ color: t.text, fontSize: "13px", margin: 0 }}>{format(checkOut, "MMM dd, yyyy")}</p>
                              </div>
                            </div>
                          )}

                          {selectedRoom ? (
                            <div className="animate-in fade-in slide-in-from-right-4 space-y-3">
                              <div>
                                <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 4px 0" }}>Selected Room</p>
                                <p style={{ color: t.text, fontSize: "14px", margin: 0, fontWeight: 600 }}>{selectedRoom.name}</p>
                              </div>
                              <div style={{ background: t.bg, padding: "12px", borderRadius: "8px", border: `1px solid ${t.border}` }} className="space-y-2">
                                <div className="flex justify-between">
                                  <span style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Room × {nights}nt{numRooms > 1 ? ` × ${numRooms}` : ""}</span>
                                  <span style={{ color: t.text, fontSize: "13px" }}>{fmt(selectedRoom.price * nights * numRooms)}</span>
                                </div>
                                <Separator className="bg-[rgba(201,168,76,0.15)]" />
                                <div className="flex justify-between items-center">
                                  <span style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Total</span>
                                  <span style={{ color: "#C9A84C", fontSize: "19px", fontWeight: 700 }}>{fmt(totalPrice)}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6 space-y-2 opacity-40">
                              <CreditCard className="h-8 w-8 mx-auto" style={{ color: "#C9A84C" }} strokeWidth={1} />
                              <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase" }}>Select a room to see total</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sticky footer CTA — identical on mobile & desktop, no scrolling needed */}
              {showResults && !isSearching && safeRoomData.length > 0 && (
                <div
                  className="shrink-0 flex items-center justify-between gap-4 px-5 sm:px-8 py-4 border-t"
                  style={{ borderColor: "rgba(201,168,76,0.15)", background: t.bg }}
                >
                  <div className="min-w-0">
                    {selectedRoom ? (
                      <>
                        <p style={{ color: "#C9A84C", fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", margin: 0 }}>
                          {selectedRoom.name} · {nights} Night{nights !== 1 ? "s" : ""}
                        </p>
                        <p style={{ color: "#C9A84C", fontSize: "clamp(18px, 4vw, 22px)", fontWeight: 800, margin: 0 }}>{fmt(totalPrice)}</p>
                      </>
                    ) : (
                      <p style={{ color: t.textMuted, fontSize: "12px", margin: 0 }}>{roomError || "Select a room to continue"}</p>
                    )}
                  </div>
                  <button
                    onClick={handleReserveClick}
                    disabled={!selectedRoom || isAvailabilityChecking}
                    style={{
                      background: "#C9A84C",
                      color: "#0F0D08",
                      fontWeight: 700,
                      padding: "14px 28px",
                      borderRadius: "8px",
                      letterSpacing: "0.06em",
                      fontSize: "13px",
                      border: "none",
                      cursor: (!selectedRoom || isAvailabilityChecking) ? "not-allowed" : "pointer",
                      opacity: (!selectedRoom || isAvailabilityChecking) ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      transition: "background 0.3s ease",
                    }}
                  >
                    Reserve
                  </button>
                </div>
              )}

              {/* Branded transition — plays after "Reserve" is clicked, before the
                details form appears. Covers the full popup so it reads cleanly
                on both mobile and desktop. */}
              {isTransitioning && (
                <div
                  className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 px-6 animate-in fade-in duration-300"
                  style={{ background: t.bg }}
                >
                  <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full animate-ping" style={{ border: "2px solid rgba(201,168,76,0.35)" }} />
                    <div className="absolute inset-2 rounded-full" style={{ border: "2px solid rgba(201,168,76,0.55)", animation: "mofam-spin 2.2s linear infinite" }} />
                    <img
                      src="/mofam.webp"
                      alt="Mofam Hotel And Apartements"
                      className="relative h-11 w-11 sm:h-14 sm:w-14 object-contain"
                      style={{ animation: "mofam-breathe 1.6s ease-in-out infinite" }}
                    />
                  </div>
                  <div className="text-center space-y-1">
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(18px, 3.5vw, 24px)", color: t.text, fontWeight: 600, margin: 0 }}>
                      Preparing Your Reservation
                    </p>
                    <p style={{ color: t.textMuted, fontSize: "12px", margin: 0, letterSpacing: "0.03em" }}>
                      {selectedRoom?.name} · {nights} Night{nights !== 1 ? "s" : ""} · {fmt(totalPrice)}
                    </p>
                  </div>
                  <style>{`
                  @keyframes mofam-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                  @keyframes mofam-breathe { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.08); opacity: 0.85; } }
                `}</style>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}

      </main>



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