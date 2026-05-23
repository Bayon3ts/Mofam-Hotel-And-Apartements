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
    WiFi: <Wifi className="h-3.5 w-3.5" />,
    TV: <Tv className="h-3.5 w-3.5" />,
    AC: <span className="text-[11px] font-bold leading-none">AC</span>,
    Coffee: <Coffee className="h-3.5 w-3.5" />,
    Parking: <Car className="h-3.5 w-3.5" />,
  };
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
      {icons[name]}
      {name}
    </span>
  );
};

// ─── Badge color map ────────────────────────────────────────────────────────
const badgeVariant = (badge: string) => {
  if (badge === "Best Value") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (badge === "Popular") return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (badge === "Exclusive") return "bg-amber-500/10 text-amber-700 border-amber-500/20";
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

      // Trigger Emails AFTER successful insert
      await sendBookingEmails({
        ...bookingData,
        id: data.id,
        check_in: checkIn!,
        check_out: checkOut!
      });

      toast.success("Reservation confirmed! Emails sent.");

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
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2 shrink-0">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Hotel</span>
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-center">
              Mofam Hotel And Apartements
            </h1>
            <div className="w-24 hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 bg-gradient-luxury bg-clip-text text-transparent">
            Perfect Stays Await
          </h2>
          <p className="text-muted-foreground text-lg">Experience Nigeria's hospitality at its finest</p>
        </div>

        {/* ── UNIFIED BOOKING BAR ─────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl shadow-card p-5 mb-10 relative overflow-visible">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Check-In</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start h-12 text-sm font-medium", !checkIn && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                    {checkIn ? format(checkIn, "EEE, MMM dd") : "Add check-in date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkIn}
                    onSelect={(d) => { setCheckIn(d); if (d && checkOut && !isBefore(d, checkOut)) setCheckOut(undefined); setDateError(""); }}
                    disabled={(date) => isBefore(date, startOfToday())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Check-Out</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start h-12 text-sm font-medium", !checkOut && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4 text-accent" />
                    {checkOut ? format(checkOut, "EEE, MMM dd") : "Add check-out date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={checkOut}
                    onSelect={(d) => { setCheckOut(d); setDateError(""); }}
                    disabled={(date) => checkIn ? isBefore(date, addDays(checkIn, 1)) : isBefore(date, startOfToday())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 space-y-2 relative" ref={guestDropRef}>
              <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Guests & Rooms</Label>
              <Button variant="outline" className="w-full justify-between h-12 text-sm font-medium" onClick={() => setGuestDropOpen(!guestDropOpen)}>
                <span className="flex items-center gap-2 overflow-hidden truncate">
                  <Users className="h-4 w-4 text-accent" />
                  <span className="truncate">{guestLabel}</span>
                </span>
                <ChevronDown className={cn("h-4 w-4 transition-transform", guestDropOpen && "rotate-180")} />
              </Button>
              {guestDropOpen && (
                <div className="absolute left-0 top-full mt-2 w-[300px] z-[51] bg-card border border-border rounded-xl shadow-xl p-5 space-y-5">
                  {[
                    { label: "Rooms", count: numRooms, set: setNumRooms, min: 1, desc: "" },
                    { label: "Adults", count: adults, set: setAdults, min: 1, desc: "Ages 18+" },
                    { label: "Children", count: children, set: setChildren, min: 0, desc: "Ages 0-17" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm tracking-tight">{item.label}</p>
                        {item.desc && <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.desc}</p>}
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={() => item.set(Math.max(item.min, item.count - 1))} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30" disabled={item.count <= item.min}>
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center font-bold">{item.count}</span>
                        <button onClick={() => item.set(item.count + 1)} className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <Button className="w-full h-11 font-bold" onClick={() => setGuestDropOpen(false)}>Apply Selection</Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-transparent select-none">Search</Label>
              <Button variant="luxury" className="h-12 px-10 w-full lg:w-auto font-bold text-base shadow-lg shadow-accent/15" onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                {isSearching ? "Searching..." : "Find Rooms"}
              </Button>
            </div>
          </div>
          {dateError && <p className="text-red-500 text-xs font-medium mt-3 animate-in fade-in slide-in-from-top-1">{dateError}</p>}
        </div>

        {/* ── CUSTOMER DETAILS FORM (STEP 2) ────────────────────────── */}
        {isDetailsStep && (
          <div className="max-w-4xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Card className="rounded-2xl border-accent/20 overflow-hidden bg-card">
              <div className="p-6 bg-accent/[0.03] border-b border-border flex items-center justify-between">
                <div>
                  <h3 className="font-black text-xl tracking-tight">Customer Information</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Details for your reservation</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsDetailsStep(false)} disabled={isSubmitting} className="text-xs font-bold uppercase tracking-widest opacity-60 hover:opacity-100">
                  <ArrowLeft className="h-3 w-3 mr-2" /> Change Selection
                </Button>
              </div>
              <div className="p-8">
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Full Name</Label>
                      <Input
                        id="fullName"
                        placeholder="e.g. John Doe"
                        value={fullName}
                        onChange={(e) => { setFullName(e.target.value); if (formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: "" })); }}
                        className={cn("h-12 border-border/60 focus:border-accent text-base", formErrors.fullName && "border-red-500/50 bg-red-500/[0.02]")}
                        disabled={isSubmitting}
                      />
                      {formErrors.fullName && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{formErrors.fullName}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (formErrors.email) setFormErrors(prev => ({ ...prev, email: "" })); }}
                        className={cn("h-12 border-border/60 focus:border-accent text-base", formErrors.email && "border-red-500/50 bg-red-500/[0.02]")}
                        disabled={isSubmitting}
                      />
                      {formErrors.email && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{formErrors.email}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+234 (0) 800-000-0000"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: "" })); }}
                        className={cn("h-12 border-border/60 focus:border-accent text-base", formErrors.phone && "border-red-500/50 bg-red-500/[0.02]")}
                        disabled={isSubmitting}
                      />
                      {formErrors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider ml-1">{formErrors.phone}</p>}
                    </div>
                  </div>

                  <div className="bg-accent/[0.02] border border-accent/10 rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-[0.2em] text-accent mb-4">Secure Checkout</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Your data is encrypted and used only for managing your reservation. By clicking confirm, you agree to our terms of service and editorial standards.
                      </p>
                    </div>
                    <div className="pt-6">
                      <Button
                        variant="luxury"
                        size="lg"
                        className="w-full h-14 text-base font-black shadow-xl shadow-accent/20"
                        onClick={handleFinalConfirm}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Confirm Reservation"}
                      </Button>
                      <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-widest mt-3 opacity-60 italic">
                        No credit card required for standard sessions
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── RESULTS (STEP 1) ───────────────────────────────────────── */}
        {!isDetailsStep && (isSearching || showResults) && (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] items-start animate-in fade-in duration-500">
            {/* Left: Rooms */}
            <div className="space-y-5">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xl font-extrabold tracking-tight">
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
                <div className="space-y-5">
                  {safeRoomData.map((room, idx) => {
                    const isSelected = selectedRoomId === room.id;
                    const available = getAvailability(room);
                    const isSoldOut = available <= 0;
                    const onlyFewLeft = available > 0 && available <= 2;

                    return (
                      <div
                        key={room.id}
                        onClick={() => { if (!isSoldOut) { setSelectedRoomId(room.id); setRoomError(""); } }}
                        className={cn(
                          "group relative p-6 border rounded-2xl transition-all duration-300",
                          "animate-in fade-in slide-in-from-bottom-4 shadow-sm",
                          isSoldOut ? "opacity-50 cursor-not-allowed bg-muted/30 border-border grayscale-[0.5]" : "cursor-pointer hover:shadow-lg hover:border-accent/40",
                          isSelected ? "border-accent ring-2 ring-accent/20 bg-accent/[0.02]" : "border-border bg-card"
                        )}
                        style={{ animationDelay: `${idx * 80}ms` }}
                      >
                        {/* Top: Name + Badge + Price Row */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xl font-black tracking-tight">{room.name}</h4>
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
                            <p className="text-2xl font-black tracking-tight text-foreground">{fmt(room.price)}</p>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-70">per night</p>
                          </div>
                        </div>

                        {/* Middle: Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-2xl px-1">{room.description}</p>

                        {/* Bottom: Amenities + Action */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mt-auto pt-4 border-t border-border/50">
                          <div className="flex flex-wrap gap-4 items-center w-full sm:w-auto">
                            {(room.amenities || []).map((a) => <AmenityIcon key={a} name={a} />)}
                            <Separator orientation="vertical" className="h-3 hidden sm:block" />
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Max {room.maxGuests} Guests</span>
                          </div>

                          <Button
                            variant={isSelected ? "luxury" : "outline"}
                            className={cn("w-full sm:w-32 h-10 font-bold text-sm transition-all rounded-xl", isSelected ? "shadow-md shadow-accent/20 scale-[1.03]" : "hover:scale-105 active:scale-95")}
                            disabled={isSoldOut}
                          >
                            {isSelected ? <><Check className="h-4 w-4 mr-1.5" /> Selected</> : isSoldOut ? "Sold Out" : "Select Room"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: Sticky Summary */}
            <div className="hidden lg:block sticky top-24">
              <Card className="rounded-2xl border-border shadow-2xl overflow-hidden bg-card/50 backdrop-blur-md">
                <div className="p-6 bg-accent/[0.03] border-b border-border">
                  <h3 className="font-black text-lg tracking-tight">Your Reservation</h3>
                </div>

                <div className="p-6 space-y-6">
                  {checkIn && checkOut && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Check-In</p>
                        <p className="font-bold text-sm">{format(checkIn, "MMM dd, yyyy")}</p>
                      </div>
                      <div className="bg-muted/40 p-4 rounded-xl border border-border/40">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Check-Out</p>
                        <p className="font-bold text-sm">{format(checkOut, "MMM dd, yyyy")}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest px-1">
                    <div className="flex flex-col gap-1 items-center"><span>Nights</span><span className="text-xl font-black text-foreground">{nights}</span></div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex flex-col gap-1 items-center"><span>Rooms</span><span className="text-xl font-black text-foreground">{numRooms}</span></div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex flex-col gap-1 items-center"><span>Guests</span><span className="text-xl font-black text-foreground">{totalGuests}</span></div>
                  </div>

                  <Separator className="opacity-50" />

                  {selectedRoom ? (
                    <div className="space-y-6">
                      <div className="animate-in fade-in slide-in-from-right-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Selected Accommodation</p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="font-black text-xl tracking-tight leading-none mb-1">{selectedRoom.name}</p>
                            <p className="text-xs text-accent font-bold uppercase tracking-widest opacity-80">{selectedRoom.tag}</p>
                          </div>
                          <p className="text-sm font-bold text-muted-foreground">{fmt(selectedRoom.price)}/nt</p>
                        </div>
                      </div>

                      <div className="space-y-3 p-4 bg-accent/[0.03] rounded-2xl border border-accent/10">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground opacity-80">Room Charge</span>
                          <span>{fmt(selectedRoom.price * nights)}</span>
                        </div>
                        {numRooms > 1 && (
                          <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                            <span className="text-muted-foreground opacity-80">× {numRooms} Rooms</span>
                            <span>{fmt(selectedRoom.price * nights * numRooms)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground opacity-80">VAT & Taxes</span>
                          <span className="text-emerald-500 font-black">Included</span>
                        </div>
                        <Separator className="bg-accent/10" />
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[11px] font-black uppercase tracking-[0.2em]">Total Price</span>
                          <span className="text-3xl font-black tracking-tighter text-accent">{fmt(totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-3 opacity-40">
                      <CreditCard className="h-10 w-10 mx-auto" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Select a room to calculate total</p>
                    </div>
                  )}

                  {roomError && <p className="text-red-500 text-[11px] font-bold uppercase text-center bg-red-500/10 py-2 rounded-lg">{roomError}</p>}

                  <Button
                    variant="luxury"
                    size="lg"
                    className="w-full h-14 text-base font-black shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-transform"
                    onClick={isDetailsStep ? handleFinalConfirm : proceedToDetails}
                    disabled={!selectedRoom || isSubmitting}
                  >
                    {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Confirming...</> : isDetailsStep ? "Confirm Reservation" : "Proceed to Details"}
                  </Button>
                </div>
              </Card>
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
    </div>
  );
};

export default Booking;