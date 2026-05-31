import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, useScroll, useTransform, Variants } from "framer-motion";
import LiveKitWidget from "@/components/ai_avatar/LiveKitWidget";
import {
  MapPin,
  Phone,
  Mail,
  Wifi,
  Car,
  Utensils,
  Waves,
  Dumbbell,
  Crown,
  Calendar,
  Users,
  Star,
  ArrowRight,
  ChefHat,
  Coffee,
  MessageCircle,
  Menu,
  Lock,
  X,
  Loader2,
  Instagram,
  Facebook,
  Twitter
} from "lucide-react";
import { getRooms, getAvailability, type RoomInventory } from "@/lib/roomStore";
import { supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";

// Import images
import heroVideo from "@/assets/hero-video.mp4";
import suiteImage from "@/assets/suite-room.jpg";
import diningImage from "../../mofam_roomsPicture/A_photorealistic,_ultra-high_resolution_luxury_202605240116.jpeg";
import meetingImage from "@/assets/meeting-room.jpg";
import spaImage from "../../mofam_roomsPicture/DSC00314poolside.jpg";
import loungeImage from "../../mofam_roomsPicture/A_photorealistic,_ultra-high_resolution_luxury_202605240102lo.jpeg";
import standardRoomImageOne from "../../mofam_roomsPicture/DSC00552.jpg";
import standardRoomImageTwo from "../../mofam_roomsPicture/A_photorealistic,_ultra-high_resolution_hotel_202605231131.jpeg";
import standardRoomImageThree from "../../mofam_roomsPicture/DSC00552_Standardroom3.jpg";
import standardRoomImageFour from "../../mofam_roomsPicture/DSC00553_standardroom4.jpg";
import vvipAptRoomImage from "../../mofam_roomsPicture/DSC00495VVIP1.jpg";
import royalAptRoomImageOne from "../../mofam_roomsPicture/DSC00391 Royal1.jpg";
import royalAptRoomImageTwo from "../../mofam_roomsPicture/DSC00393Royal2.jpg";
import royalAptRoomImageThree from "../../mofam_roomsPicture/DSC00394Royal 3.jpg";
import royalAptRoomImageFour from "../../mofam_roomsPicture/DSC00397Royal4.jpg";

const STANDARD_ROOM_IMAGE = standardRoomImageOne;

const ROYAL_APT_IMAGES = [
  royalAptRoomImageOne,
  royalAptRoomImageTwo,
  royalAptRoomImageThree,
  royalAptRoomImageFour
];
const EXECUTIVE_ROOM_IMAGE = ROYAL_APT_IMAGES[0];

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } },
};

const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeScaleItem: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
};

const fmt = (n: any) => {
  try {
    const val = Number(n);
    if (isNaN(val) || n === null || n === undefined) return "Price on request";
    return `₦${val.toLocaleString("en-NG")}`;
  } catch (e) {
    return "Price on request";
  }
};

// 1. FAIL-SAFE FALLBACK DATA (Requirement 6)
const DEFAULT_ROOMS = [
  { id: "standard", name: "Standard", price: 35000, total_rooms: 15, booked_rooms: 12, amenities: ["WiFi", "TV", "AC"], maxGuests: 2, description: "Comfortable and affordable stay." },
  { id: "business", name: "Business", price: 45000, total_rooms: 12, booked_rooms: 10, amenities: ["WiFi", "TV", "AC", "Desk"], maxGuests: 2, description: "Ideal for the modern traveler." },
  { id: "executive", name: "Executive", price: 70000, total_rooms: 10, booked_rooms: 7, amenities: ["WiFi", "TV", "AC", "Coffee", "Parking"], maxGuests: 3, description: "Elevated comfort for business professionals." }
];

const EXCLUDED_IDS = ["royal", "executive-suite", "royal-apartment", "diplomatic-apartment", "vvip", "presidential"];

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);

  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, 200]);

  // Ref for the luxury divider animation
  const dividerRef = useRef<HTMLDivElement>(null);
  const dividerRef2 = useRef<HTMLDivElement>(null);
  const dividerRef3 = useRef<HTMLDivElement>(null);
  const dividerRef4 = useRef<HTMLDivElement>(null);
  const [isDividerVisible, setIsDividerVisible] = useState(false);
  const [isDividerVisible2, setIsDividerVisible2] = useState(false);
  const [isDividerVisible3, setIsDividerVisible3] = useState(false);
  const [isDividerVisible4, setIsDividerVisible4] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === dividerRef.current) {
            setIsDividerVisible(entry.isIntersecting);
          } else if (entry.target === dividerRef2.current) {
            setIsDividerVisible2(entry.isIntersecting);
          } else if (entry.target === dividerRef3.current) {
            setIsDividerVisible3(entry.isIntersecting);
          } else if (entry.target === dividerRef4.current) {
            setIsDividerVisible4(entry.isIntersecting);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (dividerRef.current) observer.observe(dividerRef.current);
    if (dividerRef2.current) observer.observe(dividerRef2.current);
    if (dividerRef3.current) observer.observe(dividerRef3.current);
    if (dividerRef4.current) observer.observe(dividerRef4.current);

    return () => {
      if (dividerRef.current) observer.unobserve(dividerRef.current);
      if (dividerRef2.current) observer.unobserve(dividerRef2.current);
      if (dividerRef3.current) observer.unobserve(dividerRef3.current);
      if (dividerRef4.current) observer.unobserve(dividerRef4.current);
    };
  }, []);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "rooms", label: "Rooms & Suites" },
    { id: "amenities", label: "Amenities" },
    { id: "dining", label: "Dining" },
    { id: "events", label: "Meetings & Events" },
    { id: "contact", label: "Contact" }
  ];

  // 2. SAFE FETCH HANDLING (Requirement 2)
  const refreshRooms = async () => {
    setIsLoadingRooms(true);
    try {
      console.log("Fetching rooms from Supabase...");
      const { data, error } = await supabase.from("rooms").select("*");

      if (error) {
        console.error("Fetch error:", error);
        setRooms([]); // Safe state reset
      } else {
        const validatedData = Array.isArray(data) ? data : [];
        console.log("Rooms state:", validatedData); // Requirement 8
        setRooms(validatedData);
      }
    } catch (err) {
      console.error("Fetch implementation error:", err);
      setRooms([]); // Absolute safety-net
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    setIsVisible(true);
    refreshRooms();

    // Sync when returning to tab
    window.addEventListener("focus", refreshRooms);

    // Dynamic navbar scroll detection
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("focus", refreshRooms);
    };
  }, []);

  // Helper to get image for room
  const getRoomImage = (id: string | undefined, index: number) => {
    try {
      if (!id) return index % 2 === 0 ? loungeImage : suiteImage;
      const safeId = String(id).toLowerCase();
      if (safeId.includes("business")) return vvipAptRoomImage;
      if (safeId.includes("suite")) return suiteImage;
      if (safeId.includes("apartment")) return loungeImage;
      if (safeId.includes("royal") || safeId.includes("presidential") || safeId.includes("vvip")) return suiteImage;
      return index % 2 === 0 ? loungeImage : suiteImage;
    } catch (e) {
      return suiteImage;
    }
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // 3. GLOBAL RENDER GUARD (Requirement 3)
  // Ensure the page component handles non-array states safely (though initialization is safe)
  if (!Array.isArray(rooms)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
          <p className="text-muted-foreground animate-pulse font-medium">Initializing application...</p>
        </div>
      </div>
    );
  }

  // 4. PREVENT CRASH ON MAP/FILTER (Requirement 4)
  // 5. RENDER USING SAFE DATA (Requirement 7)
  const roomsToDisplay = useMemo(() => {
    const rawRooms = Array.isArray(rooms) ? rooms : [];

    // Filtering logic to respect user "leave other" request
    const filtered = rawRooms.filter(r => !EXCLUDED_IDS.includes(r.id));

    // Fallback logic (Requirement 6)
    const list = filtered.length > 0 ? filtered : DEFAULT_ROOMS;

    // Return safe row of 3 with stable mapping
    return list.slice(0, 3).map((r, i) => ({
      ...r,
      id: r.id || `room-fallback-${i}`,
      name: String(r.id || "").toLowerCase().includes("business") ? "Business" : String(r.id || "").toLowerCase().includes("executive") ? "Executive" : r.name || "Mofam Luxurious Room",
      price: String(r.id || "").toLowerCase().includes("business") ? 45000 : String(r.id || "").toLowerCase().includes("executive") ? 70000 : r.price || 0,
      amenities: Array.isArray(r.amenities) ? r.amenities : ["WiFi", "TV", "AC"]
    }));
  }, [rooms]);

  const hasRoomsData = roomsToDisplay.length > 0;

  // Requirement 8: Debug Logging
  console.log("Final rooms selection:", roomsToDisplay);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      {/* Navigation */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 py-3"
        style={{
          transition: "all 0.3s ease",
          opacity: isScrolled ? 1 : 0,
          transform: isScrolled ? "translateY(0)" : "translateY(-100%)",
          background: "rgba(15,13,8,0.97)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
          pointerEvents: isScrolled ? "auto" : "none"
        }}
      >
        <div className="container mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between">
            <div style={{ padding: "20px 0 0 24px" }}>
              <img src="/mofam.webp" alt="Mofam Hotel And Apartements" style={{ width: "64px", height: "64px" }} className="object-contain" />
            </div>
            <div className="hidden md:flex items-center justify-end flex-1 space-x-10 pr-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-[13px] font-light tracking-[0.05em] uppercase transition-colors text-white hover:text-champagne`}
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {/* Mobile Toggle Button */}
            <button
              className="md:hidden text-white p-2 -mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-charcoal/95 backdrop-blur-md border-b border-white/10 shadow-lg animate-fade-in">
            <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    scrollToSection(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left text-[13px] tracking-wide uppercase transition-colors text-white hover:text-champagne`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative flex min-h-screen flex-col justify-center overflow-hidden"
      >
        {/* Background video */}
        <motion.div
          className="absolute inset-0"
          style={{ y: parallaxY }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <video
            autoPlay loop muted playsInline
            className="w-full h-full object-cover object-center"
            src={heroVideo}
          />
        </motion.div>

        {/* Top vignette for navbar legibility */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 30%, transparent 60%)", zIndex: 2 }}
        />

        {/* Directional overlay */}
        <div className="absolute inset-0 bg-gradient-hero pointer-events-none z-10" />
        
        {/* Film grain overlay */}
        <div className="film-grain" />

        {/* Localized gradient for text legibility */}
        <div 
          className="absolute inset-y-0 left-0 w-full z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, rgba(8,6,1,0.65) 0%, rgba(8,6,1,0.3) 45%, transparent 70%)" }} 
        />

        {/* Upper right overlay */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at top right, rgba(0,0,0,0.35) 0%, transparent 60%)" }}
        />

        {/* Content grid */}
        <div className="relative z-20 w-full pb-11">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-40 lg:pt-24 pb-10">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">

              {/* LEFT — Text Block */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={staggerContainer}
                className="flex flex-col justify-center pl-6 md:pl-[60px] h-full"
                style={{ fontFamily: "'Inter', sans-serif", marginBottom: "8vh" }}
              >
                <div className="flex flex-col">
                  {/* Eyebrow */}
                  <motion.div
                    variants={fadeUpItem}
                    className="flex items-center space-x-4 mb-6"
                  >
                    <div className="h-[1px] w-8 bg-champagne/60" />
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-champagne/80">
                      Osogbo, Osun State &middot; Nigeria
                    </p>
                    <div className="h-[1px] w-8 bg-champagne/60" />
                  </motion.div>

                  {/* Headline */}
                  <motion.h1
                    variants={fadeUpItem}
                    className="flex flex-col"
                    style={{ textShadow: "0 2px 24px rgba(0,0,0,0.5)" }}
                  >
                    <span 
                      className="text-white whitespace-nowrap leading-none" 
                      style={{ fontSize: "clamp(52px, 6.5vw, 82px)", letterSpacing: "-0.03em", fontWeight: 700, fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif" }}
                    >
                      Experience
                    </span>
                    <span 
                      className="font-serif italic whitespace-nowrap" 
                      style={{ 
                        color: "#C9A84C", 
                        opacity: 1, 
                        textShadow: "0 2px 20px rgba(0,0,0,0.6)", 
                        fontSize: "clamp(52px, 6.5vw, 84px)", 
                        fontFamily: "'Cormorant Garamond', serif", 
                        lineHeight: 1.05 
                      }}
                    >
                      Luxury Redefined
                    </span>
                  </motion.h1>

                  {/* Subtitle */}
                  <motion.div variants={fadeUpItem} style={{ marginTop: "24px" }}>
                    <p className="text-[16px] text-white/70 tracking-wide font-light">
                      Where elegance meets comfort in the heart of the city
                    </p>
                    <motion.div 
                      className="h-[1px] bg-champagne mt-5"
                      initial={{ width: 0 }}
                      animate={{ width: 60 }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 1 }}
                    />
                  </motion.div>
                </div>
              </motion.div>

              {/* RIGHT — Glass Card */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.45, ease: "easeOut" }}
                className="flex items-center justify-center lg:justify-end h-full"
                style={{ marginBottom: "8vh" }}
              >
                <div className="hero-glass-card w-full max-w-sm">
                  {/* Card header */}
                  <div className="flex items-center justify-center pb-2">
                    <span style={{ display: "inline-block", width: "36px", height: "1px", background: "#C9A84C", opacity: 0.6, verticalAlign: "middle", margin: "0 10px" }} />
                    <p 
                      style={{ color: "#C9A84C", fontSize: "10px", letterSpacing: "0.25em", fontFamily: "'Cormorant Garamond', serif", textTransform: "uppercase", textAlign: "center" }}
                    >
                      Begin Your Stay
                    </p>
                    <span style={{ display: "inline-block", width: "36px", height: "1px", background: "#C9A84C", opacity: 0.6, verticalAlign: "middle", margin: "0 10px" }} />
                  </div>

                  {/* Explore Rooms */}
                  <button
                    className="hero-cta-btn hero-cta-btn--explore w-full flex items-center justify-center"
                    onClick={() => scrollToSection("rooms")}
                  >
                    <span>Explore Rooms</span>
                    <ArrowRight className="h-4 w-4 ml-2 flex-shrink-0 stroke-[1.5]" />
                  </button>

                  {/* Book Your Stay */}
                  <button
                    className="hero-cta-btn hero-cta-btn--book w-full"
                    onClick={() => navigate('/booking')}
                  >
                    Book Your Stay
                  </button>
                </div>
              </motion.div>

            </div>
          </div>
        </div>



        {/* Marquee Ribbon — pinned to bottom of hero */}
        <div
          aria-label="Mofam Hotel welcome message"
          className="overflow-hidden"
          style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '44px', zIndex: 25, background: 'rgba(10,8,2,0.40)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        >
          <div className="mofam-marquee-hairline-top" />
          <div className="mofam-marquee-track flex h-full w-max items-center">
            {Array.from({ length: 2 }).map((_, groupIndex) => (
              <div key={groupIndex} className="flex shrink-0" aria-hidden={groupIndex === 1}>
                {Array.from({ length: 6 }).map((_, itemIndex) => (
                  <span key={itemIndex} className="flex items-center whitespace-nowrap">
                    <span className="mofam-marquee-text mofam-marquee-label">
                      Welcome to Mofam Hotel &amp; Apartments &mdash; where every moment feels like home
                    </span>
                    <span className="mofam-marquee-separator" aria-hidden="true">◆</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* Rooms & Suites — Luxury Redesign */}
      <section
        id="rooms"
        style={{ background: "#0F0D08", paddingTop: "100px", paddingBottom: "80px", paddingLeft: "5%", paddingRight: "5%" }}
      >
        <motion.div
          className="mx-auto"
          style={{ maxWidth: "1200px" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeUpItem} style={{ textAlign: "center", marginBottom: "48px" }}>
            {/* Eyebrow label */}
            <p style={{
              color: "#C9A84C",
              fontSize: "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif",
              marginBottom: "12px",
              fontWeight: 400
            }}>
              Our Accommodations
            </p>

            {/* Short gold rule between eyebrow and heading */}
            <div style={{
              width: "32px",
              height: "1px",
              background: "#C9A84C",
              margin: "0 auto 12px"
            }} />

            {/* Main heading */}
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(40px, 5vw, 64px)",
              color: "#F5F0E8",
              fontWeight: 600,
              lineHeight: 1.1,
              margin: 0
            }}>
              Rooms &amp; Suites
            </h2>

            {/* Gold rule beneath heading */}
            <div style={{
              width: "60px",
              height: "1px",
              background: "#C9A84C",
              margin: "16px auto 0"
            }} />
          </motion.div>

          {/* Room Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "28px", paddingLeft: "40px", paddingRight: "40px" }}>
            {(Array.isArray(roomsToDisplay) && roomsToDisplay.length > 0 ? roomsToDisplay : DEFAULT_ROOMS.slice(0, 3)).map((room, index) => {
              const totalRoomsCount = Number(room.total_rooms || room.totalRooms || 0);
              const bookedRoomsCount = Number(room.booked_rooms || room.bookedRooms || 0);
              const available = Math.max(0, totalRoomsCount - bookedRoomsCount);
              const isSoldOut = available === 0;
              const imageUrl = getRoomImage(room.id, index);
              const isStandardRoom = `${room.id ?? ""} ${room.name ?? ""}`.toLowerCase().includes("standard");
              const isRoyalAptRoom = `${room.id ?? ""} ${room.name ?? ""}`.toLowerCase().includes("executive") || `${room.id ?? ""} ${room.name ?? ""}`.toLowerCase().includes("royal apt");
              const roomImg = isStandardRoom ? STANDARD_ROOM_IMAGE : isRoyalAptRoom ? EXECUTIVE_ROOM_IMAGE : imageUrl;

              return (
                <motion.div
                  key={room.id || `room-${index}`}
                  variants={fadeUpItem}
                  className="rooms-luxury-card"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(201,168,76,0.30)",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                    transition: "border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                  }}
                  whileHover={{
                    y: -4,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Image Block */}
                  <div className="rooms-card-image-wrap" style={{ position: "relative", height: "260px", overflow: "hidden", flexShrink: 0 }}>
                    <motion.img
                      src={roomImg}
                      alt={room.name || "Hotel Room"}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      whileHover={{ scale: 1.04 }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                      onError={(e) => { (e.target as HTMLImageElement).src = suiteImage; }}
                    />

                    {/* Bottom gradient overlay */}
                    <div style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(to top, rgba(15,13,8,0.85) 0%, transparent 50%)",
                      pointerEvents: "none"
                    }} />

                    {/* Price overlay — bottom-left of image */}
                    <div style={{
                      position: "absolute",
                      bottom: "14px",
                      left: "16px",
                      zIndex: 10,
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px"
                    }}>
                      <span style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "22px",
                        fontWeight: 600,
                        color: "#C9A84C",
                        lineHeight: 1
                      }}>
                        {fmt(room.price)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#F5F0E8", opacity: 0.8, fontFamily: "'Inter', sans-serif" }}>/night</span>
                    </div>

                    {/* Fully Booked badge */}
                    {isSoldOut && (
                      <div style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        zIndex: 20,
                        background: "rgba(15,13,8,0.85)",
                        border: "1px solid rgba(201,168,76,0.4)",
                        color: "#C9A84C",
                        fontSize: "10px",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500
                      }}>
                        Fully Booked
                      </div>
                    )}

                    {/* Low availability badge */}
                    {!isSoldOut && available > 0 && available <= 3 && (
                      <div style={{
                        position: "absolute",
                        top: "14px",
                        right: "14px",
                        zIndex: 20,
                        background: "rgba(15,13,8,0.85)",
                        border: "1px solid rgba(201,168,76,0.3)",
                        color: "#C9A84C",
                        fontSize: "10px",
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        fontFamily: "'Inter', sans-serif",
                      }}>
                        Last {available} Units
                      </div>
                    )}
                  </div>

                  {/* Content Block */}
                  <div style={{ padding: "24px 24px 32px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                    {/* Room name */}
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "26px",
                      color: "#F5F0E8",
                      fontWeight: 500,
                      margin: "0 0 8px 0",
                      lineHeight: 1.2
                    }}>
                      {room.name || "Room"}
                    </h3>

                    {/* Gold rule beneath name */}
                    <div style={{ width: "40px", height: "1px", background: "#C9A84C", marginBottom: "18px" }} />

                    {/* Amenity tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                      {(Array.isArray(room.amenities) ? room.amenities : ["WiFi", "TV", "AC"]).slice(0, 4).map((feature: string, idx: number) => (
                        <span
                          key={idx}
                          style={{
                            background: "rgba(201,168,76,0.08)",
                            border: "1px solid rgba(201,168,76,0.2)",
                            color: "#C9A84C",
                            fontSize: "11px",
                            letterSpacing: "0.1em",
                            padding: "4px 10px",
                            borderRadius: "4px",
                            fontFamily: "'Inter', sans-serif",
                            textTransform: "uppercase",
                          }}
                        >
                          {feature}
                        </span>
                      ))}

                      {/* Guest capacity tag */}
                      <span
                        style={{
                          background: "rgba(201,168,76,0.08)",
                          border: "1px solid rgba(201,168,76,0.2)",
                          color: "#C9A84C",
                          fontSize: "11px",
                          letterSpacing: "0.1em",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontFamily: "'Inter', sans-serif",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <Users style={{ width: "11px", height: "11px", flexShrink: 0 }} />
                        Up to {room.maxGuests || 2} Guests
                      </span>
                    </div>

                    {/* CTA Button */}
                    <div style={{ marginTop: "auto" }}>
                      {isSoldOut ? (
                        <button
                          onClick={() => setShowSupport(true)}
                          style={{
                            width: "100%",
                            background: "transparent",
                            border: "1px solid rgba(201,168,76,0.55)",
                            color: "#C9A84C",
                            fontWeight: 600,
                            padding: "14px",
                            borderRadius: "8px",
                            letterSpacing: "0.06em",
                            fontSize: "14px",
                            fontFamily: "'Inter', sans-serif",
                            cursor: "pointer",
                            transition: "border-color 0.3s ease, background 0.3s ease",
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.borderColor = "#C9A84C";
                            e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)";
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          Contact Support
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/booking')}
                          style={{
                            width: "100%",
                            background: "#C9A84C",
                            color: "#0F0D08",
                            fontWeight: 700,
                            padding: "14px",
                            borderRadius: "8px",
                            letterSpacing: "0.06em",
                            fontSize: "14px",
                            fontFamily: "'Inter', sans-serif",
                            cursor: "pointer",
                            border: "none",
                            transition: "background 0.3s ease",
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = "#b8963e")}
                          onMouseLeave={e => (e.currentTarget.style.background = "#C9A84C")}
                        >
                          Book This Room
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* View All button — always visible */}
          <motion.div variants={fadeUpItem} style={{ marginTop: "48px", textAlign: "center" }}>
            <button
              onClick={() => navigate('/booking')}
              style={{
                background: "transparent",
                border: "1px solid rgba(201,168,76,0.4)",
                color: "#C9A84C",
                fontWeight: 600,
                padding: "14px 40px",
                borderRadius: "8px",
                letterSpacing: "0.08em",
                fontSize: "13px",
                fontFamily: "'Inter', sans-serif",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "border-color 0.3s ease, color 0.3s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#C9A84C";
                e.currentTarget.style.color = "#F5F0E8";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
                e.currentTarget.style.color = "#C9A84C";
              }}
            >
              View All Room Types
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* Luxury Section Divider */}
      <div 
        ref={dividerRef} 
        className={`luxury-divider-container ${isDividerVisible ? 'divider-animate' : ''}`} 
        style={{ background: "#0F0D08", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "48px 0" }}
      >
        <div className="divider-line-left" style={{ width: "120px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
        <span className="divider-star" style={{ color: "#C9A84C", fontSize: "14px", display: "inline-block" }}>✦</span>
        <div className="divider-line-right" style={{ width: "120px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
      </div>

      {/* Amenities — Luxury Redesign */}
      <section
        id="amenities"
        style={{ background: "#0F0D08", padding: "48px 5% 80px" }}
      >
        <motion.div
          className="mx-auto"
          style={{ maxWidth: "1200px" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeUpItem} style={{ textAlign: "center", marginBottom: "64px" }}>
            {/* Eyebrow */}
            <p style={{
              color: "#C9A84C",
              fontSize: "11px",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              fontFamily: "'Inter', sans-serif",
              marginBottom: "12px",
              fontWeight: 400
            }}>
              Facilities &amp; Services
            </p>

            {/* 32px gold rule between eyebrow and heading */}
            <div style={{ width: "32px", height: "1px", background: "#C9A84C", margin: "0 auto 12px" }} />

            {/* Main heading */}
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(36px, 5vw, 60px)",
              color: "#F5F0E8",
              fontWeight: 600,
              lineHeight: 1.1,
              margin: 0
            }}>
              World-Class Amenities
            </h2>

            {/* Gold decorative rule */}
            <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 0" }} />

            {/* Subheading */}
            <p style={{
              color: "rgba(245,240,232,0.55)",
              fontSize: "15px",
              fontFamily: "'Inter', sans-serif",
              marginTop: "16px",
              lineHeight: 1.6
            }}>
              Indulge in our premium facilities designed for your comfort and convenience
            </p>
          </motion.div>

          {/* Two-column layout */}
          <div className="amenities-two-col">

            {/* LEFT — Amenity list */}
            <motion.div variants={fadeUpItem}>
              {[
                { icon: Waves, title: "Spa & Wellness", desc: "Rejuvenate in our award-winning spa with premium treatments", link: "/spa-wellness" },
                { icon: Dumbbell, title: "Fitness Center", desc: "State-of-the-art equipment available 24/7", link: "/fitness-center" },
                { icon: Wifi, title: "High-Speed WiFi", desc: "Complimentary internet throughout the property", link: "/wifi-connectivity" },
              ].map((amenity, index, arr) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "20px",
                    padding: "24px 0",
                    borderBottom: index < arr.length - 1 ? "1px solid rgba(201,168,76,0.1)" : "none",
                    cursor: amenity.link ? "pointer" : "default",
                  }}
                  onClick={() => amenity.link && navigate(amenity.link)}
                >
                  {/* Circle icon container */}
                  <div style={{
                    flexShrink: 0,
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    border: "1px solid rgba(201,168,76,0.4)",
                    background: "rgba(201,168,76,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <amenity.icon style={{ width: "20px", height: "20px", color: "#C9A84C", strokeWidth: 1.5 }} />
                  </div>

                  {/* Text content */}
                  <div>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "22px",
                      color: "#F5F0E8",
                      fontWeight: 500,
                      margin: "0 0 6px 0",
                      lineHeight: 1.2
                    }}>
                      {amenity.title}
                    </h3>
                    <p style={{
                      color: "rgba(245,240,232,0.55)",
                      fontSize: "14px",
                      fontFamily: "'Inter', sans-serif",
                      lineHeight: 1.6,
                      margin: "0 0 8px 0"
                    }}>
                      {amenity.desc}
                    </p>
                    {amenity.link && (
                      <a
                        href={amenity.link}
                        onClick={e => e.preventDefault()}
                        style={{
                          color: "#C9A84C",
                          fontSize: "12px",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontFamily: "'Inter', sans-serif",
                          textDecoration: "none",
                          fontWeight: 500,
                          transition: "text-decoration 0.2s ease",
                        }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}
                      >
                        Learn more →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* RIGHT — Image */}
            <motion.div
              variants={fadeScaleItem}
              style={{ display: "flex", flexDirection: "column" }}
            >
              <div style={{
                borderRadius: "12px",
                overflow: "hidden",
                border: "1px solid rgba(201,168,76,0.2)",
                position: "relative",
              }}>
                <motion.img
                  src={spaImage}
                  alt="Mofam Hotel Exterior & Pool"
                  style={{ width: "100%", height: "480px", objectFit: "cover", display: "block" }}
                  initial={{ scale: 1.06 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to top, rgba(15,13,8,0.5) 0%, transparent 40%)",
                  pointerEvents: "none"
                }} />
              </div>

              {/* Caption */}
              <p style={{
                color: "rgba(201,168,76,0.6)",
                fontSize: "11px",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                fontFamily: "'Inter', sans-serif",
                textAlign: "center",
                marginTop: "12px",
              }}>
                Mofam Hotel Exterior &amp; Pool
              </p>
            </motion.div>

          </div>
        </motion.div>
      </section>


      {/* Luxury Section Divider 2 */}
      <div 
        ref={dividerRef2} 
        className={`luxury-divider-container ${isDividerVisible2 ? 'divider-animate' : ''}`} 
        style={{ background: "#0F0D08", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "48px 0" }}
      >
        <div className="divider-line-left" style={{ width: "120px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
        <span className="divider-star" style={{ color: "#C9A84C", fontSize: "14px", display: "inline-block" }}>✦</span>
        <div className="divider-line-right" style={{ width: "120px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
      </div>

      {/* Dining — Luxury Redesign */}
      <section id="dining" style={{ background: "#0F0D08", padding: "80px 5%" }}>
        <motion.div
          className="mx-auto"
          style={{ maxWidth: "1200px" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          {/* Section Header */}
          <motion.div variants={fadeUpItem} style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginBottom: "12px", fontWeight: 400 }}>
              Culinary Experience
            </p>
            <div style={{ width: "32px", height: "1px", background: "#C9A84C", margin: "0 auto 12px" }} />
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 60px)", color: "#F5F0E8", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
              Exquisite Dining
            </h2>
            <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 0" }} />
            <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "15px", fontFamily: "'Inter', sans-serif", marginTop: "16px", lineHeight: 1.6 }}>
              Savor culinary excellence at our award-winning restaurants
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "32px" }}>
            {/* Dining Card */}
            <motion.div variants={fadeScaleItem} className="dining-luxury-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ position: "relative", height: "280px", overflow: "hidden" }}>
                <img src={diningImage} alt="Dining" className="dining-card-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,13,8,0.85) 0%, transparent 50%)", pointerEvents: "none" }} />
              </div>
              <div style={{ padding: "32px 24px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: "40px", height: "1px", background: "#C9A84C" }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: "#F5F0E8", fontWeight: 500, margin: "20px 0 0 0", lineHeight: 1.2 }}>Dining</h3>
                <p style={{ color: "rgba(245,240,232,0.60)", fontSize: "14px", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, margin: "12px 0 0 0" }}>
                  From jollof rice perfected over open flame to Continental favourites prepared by our in-house chefs, every meal at Mofam is a celebration. Warm service, rich aromas, and a space designed to make you linger.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                  <Coffee style={{ width: "14px", height: "14px", color: "#C9A84C" }} />
                  <span style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Open: 6 PM – 11 PM</span>
                </div>
              </div>
              <div style={{ padding: "0 24px 24px" }}>
                <button
                  style={{ width: "100%", background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "14px", borderRadius: "8px", letterSpacing: "0.06em", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", fontSize: "13px", transition: "background 0.3s ease" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
                  onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
                >
                  Reserve Table
                </button>
              </div>
            </motion.div>

            {/* The Bar & Lounge Card */}
            <motion.div variants={fadeScaleItem} className="dining-luxury-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ position: "relative", height: "280px", overflow: "hidden" }}>
                <img src={loungeImage} alt="The Bar & Lounge" className="dining-card-img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(15,13,8,0.85) 0%, transparent 50%)", pointerEvents: "none" }} />
              </div>
              <div style={{ padding: "32px 24px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ width: "40px", height: "1px", background: "#C9A84C" }} />
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: "#F5F0E8", fontWeight: 500, margin: "20px 0 0 0", lineHeight: 1.2 }}>The Bar & Lounge</h3>
                <p style={{ color: "rgba(245,240,232,0.60)", fontSize: "14px", fontFamily: "'Inter', sans-serif", lineHeight: 1.8, margin: "12px 0 0 0" }}>
                  Whether you're toasting a deal, unwinding after a long journey, or simply enjoying a cold Trophy and good company the Mofam Bar & Lounge is where good times find a home. Premium spirits, local favourites, and an Osogbo vibe that never rushes you
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(201,168,76,0.15)" }}>
                  <Coffee style={{ width: "14px", height: "14px", color: "#C9A84C" }} />
                  <span style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>Open: 7 AM – 10 PM</span>
                </div>
              </div>
              <div style={{ padding: "0 24px 24px" }}>
                <button
                  style={{ width: "100%", background: "transparent", border: "1px solid rgba(201,168,76,0.55)", color: "#C9A84C", fontWeight: 600, padding: "14px", borderRadius: "8px", letterSpacing: "0.06em", cursor: "pointer", fontFamily: "'Inter', sans-serif", textTransform: "uppercase", fontSize: "13px", transition: "all 0.3s ease" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                    e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)";
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  View Drinks Menu
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Luxury Section Divider 3 */}
      <div 
        ref={dividerRef3} 
        className={`luxury-divider-container ${isDividerVisible3 ? 'divider-animate' : ''}`} 
        style={{ background: "#0F0D08", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "48px 0" }}
      >
        <div className="divider-line-left" style={{ width: "120px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
        <span className="divider-star" style={{ color: "#C9A84C", fontSize: "14px", display: "inline-block" }}>✦</span>
        <div className="divider-line-right" style={{ width: "120px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
      </div>

      {/* Meetings & Events */}
      <section id="events" style={{ background: "#0F0D08", padding: "80px 5%" }}>
        <motion.div
          className="mx-auto"
          style={{ maxWidth: "1200px" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginBottom: "12px", fontWeight: 400 }}>
              VENUES & OCCASIONS
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 60px)", color: "#F5F0E8", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
              Meetings & Events
            </h2>
            <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 0" }} />
            <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "15px", fontFamily: "'Inter', sans-serif", marginTop: "16px", lineHeight: 1.6 }}>
              Host memorable events in our sophisticated venues
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "32px" }}>
            {[
              {
                title: "Event Hall",
                capacity: "300 guests",
                image: meetingImage,
                features: ["Spacious hall ideal for weddings, conferences & celebrations", "Professional sound & lighting system", "Dedicated event coordinator on-site"]
              },
              {
                title: "Executive Boardroom",
                capacity: "20 guests",
                image: meetingImage,
                features: ["Private entrance", "High-tech presentation", "Catering available"]
              },
              {
                title: "Garden Terrace",
                capacity: "150 guests",
                image: loungeImage,
                features: ["Outdoor setting", "City views", "Weather protection"]
              }
            ].map((venue, index) => (
              <motion.div 
                variants={fadeScaleItem} 
                key={index}
                className="events-luxury-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "border-color 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                  height: "100%"
                }}
                whileHover={{
                  y: -4,
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                  borderColor: "rgba(201,168,76,0.55)"
                }}
              >
                <div style={{ position: "relative", height: "240px", overflow: "hidden", flexShrink: 0 }}>
                  <motion.img
                    src={venue.image}
                    alt={venue.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                  <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(to top, rgba(15,13,8,0.85) 0%, transparent 50%)",
                    pointerEvents: "none"
                  }} />
                </div>

                <div style={{ padding: "24px", paddingBottom: "28px", display: "flex", flexDirection: "column", flexGrow: 1 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px", gap: "12px" }}>
                    <h3 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "26px",
                      color: "#F5F0E8",
                      fontWeight: 500,
                      margin: 0,
                      lineHeight: 1.2
                    }}>
                      {venue.title}
                    </h3>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: "#C9A84C",
                      fontSize: "12px",
                      letterSpacing: "0.08em",
                      fontFamily: "'Inter', sans-serif",
                      textTransform: "uppercase",
                      marginTop: "6px"
                    }}>
                      <Users style={{ width: "12px", height: "12px" }} />
                      {venue.capacity}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px", flexGrow: 1 }}>
                    {venue.features.map((feature, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "flex-start" }}>
                        <div style={{
                          background: "#C9A84C",
                          width: "2px",
                          height: "14px",
                          borderRadius: "2px",
                          marginRight: "10px",
                          marginTop: "5px",
                          flexShrink: 0
                        }} />
                        <span style={{
                          color: "rgba(245,240,232,0.65)",
                          fontSize: "14px",
                          lineHeight: 1.7,
                          fontFamily: "'Inter', sans-serif"
                        }}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "1px solid rgba(201,168,76,0.55)",
                      color: "#C9A84C",
                      fontWeight: 600,
                      padding: "14px",
                      borderRadius: "8px",
                      letterSpacing: "0.06em",
                      fontSize: "14px",
                      fontFamily: "'Inter', sans-serif",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "border-color 0.3s ease, background 0.3s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "#C9A84C";
                      e.currentTarget.style.background = "rgba(201,168,76,0.08)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Calendar style={{ width: "16px", height: "16px", color: "#C9A84C" }} />
                    Check Availability
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Luxury Section Divider 4 */}
      <div 
        ref={dividerRef4} 
        className={`luxury-divider-container ${isDividerVisible4 ? 'divider-animate' : ''}`} 
        style={{ background: "#0F0D08", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "48px 0" }}
      >
        <div className="divider-line-left" style={{ width: "120px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
        <span className="divider-star" style={{ color: "#C9A84C", fontSize: "14px", display: "inline-block" }}>✦</span>
        <div className="divider-line-right" style={{ width: "120px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
      </div>

      {/* Contact */}
      <section id="contact" style={{ background: "#0F0D08", padding: "80px 5% 100px" }}>
        <motion.div
          className="mx-auto"
          style={{ maxWidth: "1200px" }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} style={{ textAlign: "center", marginBottom: "64px" }}>
            <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", marginBottom: "12px", fontWeight: 400 }}>
              GET IN TOUCH
            </p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(36px, 5vw, 60px)", color: "#F5F0E8", fontWeight: 600, lineHeight: 1.1, margin: 0 }}>
              Contact Us
            </h2>
            <div style={{ width: "60px", height: "1px", background: "#C9A84C", margin: "12px auto 0" }} />
            <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "15px", fontFamily: "'Inter', sans-serif", marginTop: "16px", lineHeight: 1.6 }}>
              We're here to make your stay exceptional
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "64px" }}>
            {/* Left — Contact Info Block */}
            <motion.div variants={fadeUpItem} style={{ display: "flex", flexDirection: "column" }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "28px", color: "#F5F0E8", fontWeight: 500, margin: "0 0 32px 0", lineHeight: 1.2 }}>
                Get in Touch
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px 0", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                  <div style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin style={{ width: "18px", height: "18px", color: "#C9A84C" }} />
                  </div>
                  <div>
                    <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 4px 0", fontWeight: 500 }}>Address</p>
                    <p style={{ color: "#F5F0E8", fontSize: "15px", lineHeight: 1.6, fontFamily: "'Inter', sans-serif", margin: 0 }}>19 Ofatedo Road, Osogbo,<br />Osun State, Nigeria</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px 0", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
                  <div style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Phone style={{ width: "18px", height: "18px", color: "#C9A84C" }} />
                  </div>
                  <div>
                    <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 4px 0", fontWeight: 500 }}>Phone</p>
                    <p style={{ color: "#F5F0E8", fontSize: "15px", lineHeight: 1.6, fontFamily: "'Inter', sans-serif", margin: 0 }}>+234 (706) 920-6935</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", padding: "20px 0" }}>
                  <div style={{ flexShrink: 0, width: "44px", height: "44px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.4)", background: "rgba(201,168,76,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Mail style={{ width: "18px", height: "18px", color: "#C9A84C" }} />
                  </div>
                  <div>
                    <p style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 4px 0", fontWeight: 500 }}>Email</p>
                    <p style={{ color: "#F5F0E8", fontSize: "15px", lineHeight: 1.6, fontFamily: "'Inter', sans-serif", margin: 0 }}>reservations@mofamhotel.com</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Contact Form */}
            <motion.div variants={fadeScaleItem}>
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "12px", padding: "36px" }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "24px", color: "#F5F0E8", margin: "0 0 24px 0", lineHeight: 1.2, fontWeight: 500 }}>
                  Send us a Message
                </h3>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <input 
                      type="text" 
                      placeholder="First Name" 
                      className="contact-luxury-input"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", fontFamily: "'Inter', sans-serif", transition: "all 0.3s ease" }} 
                    />
                    <input 
                      type="text" 
                      placeholder="Last Name" 
                      className="contact-luxury-input"
                      style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", fontFamily: "'Inter', sans-serif", transition: "all 0.3s ease" }} 
                    />
                  </div>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="contact-luxury-input"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", fontFamily: "'Inter', sans-serif", transition: "all 0.3s ease" }} 
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    className="contact-luxury-input"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", fontFamily: "'Inter', sans-serif", transition: "all 0.3s ease" }} 
                  />
                  <textarea 
                    placeholder="How can we assist you?" 
                    className="contact-luxury-input"
                    style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "8px", color: "#F5F0E8", padding: "14px 16px", fontSize: "14px", fontFamily: "'Inter', sans-serif", minHeight: "120px", resize: "vertical", transition: "all 0.3s ease" }} 
                  />
                  <button 
                    type="submit"
                    style={{ width: "100%", background: "#C9A84C", color: "#0F0D08", fontWeight: 700, padding: "16px", borderRadius: "8px", letterSpacing: "0.06em", fontSize: "15px", fontFamily: "'Inter', sans-serif", border: "none", cursor: "pointer", transition: "background 0.3s ease" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#b8963e"}
                    onMouseLeave={e => e.currentTarget.style.background = "#C9A84C"}
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#0A0800", position: "relative" }}>
        {/* Top ornamental border with static divider */}
        <div style={{ position: "relative", width: "100%", height: "1px", background: "rgba(201,168,76,0.25)" }}>
          <div style={{ position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", background: "#0A0800", padding: "0 24px" }}>
            <div style={{ width: "40px", height: "1px", background: "linear-gradient(to right, transparent, rgba(201,168,76,0.6))" }} />
            <span style={{ color: "#C9A84C", fontSize: "14px", display: "inline-block" }}>✦</span>
            <div style={{ width: "40px", height: "1px", background: "linear-gradient(to left, transparent, rgba(201,168,76,0.6))" }} />
          </div>
        </div>

        {/* Footer top section */}
        <div style={{ padding: "64px 5% 48px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "48px" }}>
            {/* Column 1 — Brand */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <img src="/mofam.webp" alt="Mofam Hotel And Apartements" style={{ width: "56px", height: "auto", objectFit: "contain" }} />
              <p style={{ color: "rgba(245,240,232,0.55)", fontSize: "13px", lineHeight: 1.8, marginTop: "16px", maxWidth: "200px", fontFamily: "'Inter', sans-serif" }}>
                Experience luxury redefined in the heart of the city.
              </p>
              {/* Social Icons */}
              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                {[Instagram, Facebook, Twitter].map((Icon, idx) => (
                  <a key={idx} href="#" target="_blank" style={{ 
                    width: "36px", height: "36px", borderRadius: "50%", border: "1px solid rgba(201,168,76,0.35)", 
                    display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                    e.currentTarget.style.background = "rgba(201,168,76,0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)";
                    e.currentTarget.style.background = "transparent";
                  }}>
                    <Icon style={{ width: "15px", height: "15px", color: "#C9A84C" }} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2 — Quick Links */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h4 style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 20px 0" }}>
                Quick Links
              </h4>
              <div style={{ width: "32px", height: "1px", background: "#C9A84C", marginBottom: "20px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Rooms & Suites", href: "#rooms" },
                  { label: "Amenities", href: "#amenities" },
                  { label: "Dining", href: "#dining" },
                  { label: "Meetings & Events", href: "#events" }
                ].map((link, idx) => (
                  <a key={idx} href={link.href} style={{ 
                    color: "rgba(245,240,232,0.55)", fontSize: "13px", lineHeight: 2.2, textDecoration: "none", 
                    fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease" 
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#C9A84C";
                    e.currentTarget.style.paddingLeft = "4px";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "rgba(245,240,232,0.55)";
                    e.currentTarget.style.paddingLeft = "0";
                  }}>
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 3 — Services */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h4 style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 20px 0" }}>
                Services
              </h4>
              <div style={{ width: "32px", height: "1px", background: "#C9A84C", marginBottom: "20px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["Concierge", "Room Service", "Spa & Wellness", "Business Center"].map((label, idx) => (
                  <span key={idx} style={{ 
                    color: "rgba(245,240,232,0.55)", fontSize: "13px", lineHeight: 2.2, 
                    fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease", cursor: "pointer"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#C9A84C";
                    e.currentTarget.style.paddingLeft = "4px";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "rgba(245,240,232,0.55)";
                    e.currentTarget.style.paddingLeft = "0";
                  }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Column 4 — Management */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <h4 style={{ color: "#C9A84C", fontSize: "11px", letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: "0 0 20px 0" }}>
                Management
              </h4>
              <div style={{ width: "32px", height: "1px", background: "#C9A84C", marginBottom: "20px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ 
                  color: "rgba(245,240,232,0.55)", fontSize: "13px", lineHeight: 2.2, 
                  fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease", cursor: "pointer"
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#C9A84C";
                  e.currentTarget.style.paddingLeft = "4px";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "rgba(245,240,232,0.55)";
                  e.currentTarget.style.paddingLeft = "0";
                }}>
                  Secure Portal Access Required
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div style={{ padding: "20px 5%", borderTop: "1px solid rgba(201,168,76,0.12)" }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <p style={{ color: "rgba(245,240,232,0.35)", fontSize: "12px", fontFamily: "'Inter', sans-serif", margin: 0 }}>
              © 2025 Mofam Hotel &amp; Apartments. All rights reserved.
            </p>
            <p style={{ color: "rgba(201,168,76,0.5)", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif", margin: 0 }}>
              Osogbo, Osun State &middot; Nigeria
            </p>
          </div>
        </div>
      </footer>

      {/* Floating AI Concierge Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="rounded-full flex items-center gap-2 px-6 py-3 transition-all duration-300 hover:scale-105"
          style={{
            background: "rgba(10,10,10,0.7)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 16px rgba(201,168,76,0.25)",
            border: "1px solid rgba(201,168,76,0.3)"
          }}
          onClick={() => setShowSupport(true)}
        >
          <MessageCircle className="h-5 w-5 text-[#C9A84C]" />
          <span className="font-medium text-white text-sm">Talk to AI Concierge</span>
        </button>
      </div>
      {/* LiveKit Widget */}
      {showSupport && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 pointer-events-none">
          <div className="pointer-events-auto">
            <LiveKitWidget setShowSupport={setShowSupport} />
          </div>
        </div>
      )}

    </div>
  );
};

export default Index;
