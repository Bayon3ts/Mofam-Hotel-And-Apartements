import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Shield,
  RotateCcw,
  AlertTriangle,
  Hotel,
  Users,
  DoorOpen,
  Lock,
  LogOut,
  Loader2,
  Search as SearchIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  CalendarCheck,
  Sun,
  Moon,
} from "lucide-react";
import {
  getRooms,
  updateRoom,
  resetRooms,
  getAvailability,
  type RoomInventory,
} from "@/lib/roomStore";
import { useTheme } from "@/hooks/useTheme";
import { toast } from "@/components/ui/sonner";
import { format } from "date-fns";

const Admin = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const t = {
    bg:       isDark ? '#0F0D08'               : '#FAF7F2',
    surface:  isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    border:   isDark ? 'rgba(201,168,76,0.20)'  : 'rgba(180,145,60,0.35)',
    text:     isDark ? '#F5F0E8'               : '#1A1510',
    textMuted:isDark ? 'rgba(245,240,232,0.45)': 'rgba(26,21,16,0.60)',
    inputBg:  isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBorder: isDark ? 'rgba(201,168,76,0.2)' : 'rgba(180,145,60,0.4)',
    inputText: isDark ? '#F5F0E8' : '#1A1510',
    headerBg: isDark ? '#0F0D08'               : 'rgba(250,247,242,0.97)',
    labelColor: isDark ? 'rgba(201,168,76,0.6)' : 'rgba(180,145,60,0.8)',
    inactiveTab: isDark ? 'rgba(245,240,232,0.4)' : 'rgba(26,21,16,0.45)',
    subtext: isDark ? 'rgba(245,240,232,0.45)' : 'rgba(26,21,16,0.55)',
    noticeBg: isDark ? 'rgba(201,168,76,0.05)' : 'rgba(180,145,60,0.06)',
    noticeBorder: isDark ? 'rgba(201,168,76,0.15)' : 'rgba(180,145,60,0.2)',
    noticeText: isDark ? 'rgba(245,240,232,0.5)' : 'rgba(26,21,16,0.55)',
  };
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [editState, setEditState] = useState<
    Record<string, { price: string; totalRooms: string; bookedRooms: string }>
  >({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Tab State
  const [activeTab, setActiveTab] = useState<"inventory" | "bookings">("inventory");
  const [bookings, setBookings] = useState<any[]>([]);
  const [isBookingsLoading, setIsBookingsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch rooms on mount
  const fetchRooms = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const data = await getRooms();
      console.log("[Admin] Fetched rooms:", data);

      const safeData = Array.isArray(data) ? data : [];
      setRooms(safeData);

      const initial: Record<string, { price: string; totalRooms: string; bookedRooms: string }> = {};
      safeData.forEach((r) => {
        initial[r.id] = {
          price: String(r.price),
          totalRooms: String(r.totalRooms),
          bookedRooms: String(r.bookedRooms),
        };
      });
      setEditState(initial);
    } catch (err) {
      console.error("[Admin] Fetch error:", err);
      toast.error("Failed to load inventory data");
      setRooms([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchBookings = async () => {
    setIsBookingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error("[Admin] Fetch bookings error:", err);
      toast.error("Failed to load bookings");
    } finally {
      setIsBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Successfully logged out");
    navigate("/admin/login");
  };

  // Validate a single room's inputs
  const validate = (id: string, price: string, total: string, booked: string): string | null => {
    const p = parseInt(price, 10);
    const t = parseInt(total, 10);
    const b = parseInt(booked, 10);
    if (isNaN(p) || p <= 0) return "Price must be greater than 0";
    if (isNaN(t) || t < 1) return "Total rooms must be at least 1";
    if (isNaN(b) || b < 0) return "Booked rooms cannot be negative";
    if (b > t) return "Booked rooms cannot exceed total rooms";
    return null;
  };

  // Handle field changes
  const handleChange = (
    id: string,
    field: "price" | "totalRooms" | "bookedRooms",
    value: string
  ) => {
    setEditState((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
    // Clear errors on edit
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSavedId(null);
  };

  // Save a single room
  const handleSave = async (id: string) => {
    const state = editState[id];
    if (!state) return;

    const err = validate(id, state.price, state.totalRooms, state.bookedRooms);
    if (err) {
      setErrors((prev) => ({ ...prev, [id]: err }));
      return;
    }

    setIsSaving(id);

    try {
      const updatedRooms = await updateRoom(id, {
        price: parseInt(state.price, 10),
        totalRooms: parseInt(state.totalRooms, 10),
        bookedRooms: parseInt(state.bookedRooms, 10),
      });

      const safeUpdatedRooms = Array.isArray(updatedRooms) ? updatedRooms : [];
      setRooms(safeUpdatedRooms);

      // Sync edit state with validated values for the updated room
      const room = safeUpdatedRooms.find((r) => r.id === id);
      if (room) {
        setEditState((prev) => ({
          ...prev,
          [id]: {
            price: String(room.price),
            totalRooms: String(room.totalRooms),
            bookedRooms: String(room.bookedRooms),
          },
        }));
      }

      setSavedId(id);
      toast.success(`${room?.name} updated successfully`);
      setTimeout(() => setSavedId(null), 1500);
    } catch (err) {
      console.error("[Admin] Save error:", err);
      toast.error("Database update failed. Please try again.");
    } finally {
      setIsSaving(null);
    }
  };

  // Reset all to defaults
  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all data to default values?")) return;

    setIsRefreshing(true);
    try {
      const fresh = await resetRooms();
      const safeFresh = Array.isArray(fresh) ? fresh : [];
      setRooms(safeFresh);

      const initial: Record<string, { price: string; totalRooms: string; bookedRooms: string }> = {};
      safeFresh.forEach((r) => {
        initial[r.id] = {
          price: String(r.price),
          totalRooms: String(r.totalRooms),
          bookedRooms: String(r.bookedRooms),
        };
      });
      setEditState(initial);
      setErrors({});
      setSavedId(null);
      toast.success("Inventory reset to factory defaults");
    } catch (err) {
      console.error("[Admin] Reset error:", err);
      toast.error("Reset failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // ── SAFE SUMMARY STATS ───────────────────────────────────────────────────
  const safeRoomsList = Array.isArray(rooms) ? rooms : [];
  const totalInventory = safeRoomsList.reduce((s, r) => s + (r.totalRooms || 0), 0);
  const totalBooked = safeRoomsList.reduce((s, r) => s + (r.bookedRooms || 0), 0);
  const totalAvailable = safeRoomsList.reduce((s, r) => s + getAvailability(r), 0);
  const occupancyRate = totalInventory > 0 ? Math.round((totalBooked / totalInventory) * 100) : 0;

  if (isLoading) {
    return (
      <div style={{ backgroundColor: t.bg }} className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 style={{ color: '#C9A84C' }} className="h-10 w-10 animate-spin" />
          <p style={{ color: t.textMuted }} className="text-sm font-bold uppercase tracking-widest animate-pulse">
            Syncing Live Inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: t.bg, fontFamily: 'Inter, sans-serif' }} className="min-h-screen pb-20 font-sans">
      {/* Top Navigation Bar */}
      <header style={{ backgroundColor: t.headerBg, borderBottom: '1px solid rgba(201,168,76,0.15)' }} className="sticky top-0 z-40">
        <div style={{ padding: '0 40px', maxWidth: '1200px', margin: '0 auto', height: '70px', position: 'relative' }} className="flex items-center justify-between">
          <div className="flex items-center gap-6 z-10">
            <button
              onClick={() => navigate("/")}
              style={{ color: t.textMuted, fontSize: '12px' }}
              className="flex items-center gap-2 hover:text-[#C9A84C] transition-colors group"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#C9A84C] group-hover:-translate-x-0.5 transition-transform" />
              Public Site
            </button>
            <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(201,168,76,0.15)' }}></div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" style={{ color: '#C9A84C' }} />
              <h1 style={{ fontSize: '18px', color: t.text, fontWeight: 600 }}>
                Staff Management
              </h1>
            </div>
          </div>

          {/* Centered Logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none">
            <img src="/mofam.webp" alt="Mofam Hotel Logo" style={{ width: '44px', height: '44px', objectFit: 'contain' }} />
          </div>

          <div className="flex items-center gap-3 z-10">
            <button
              onClick={() => navigate("/booking")}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(201,168,76,0.4)',
                color: '#C9A84C',
                fontSize: '12px',
                padding: '8px 16px',
                borderRadius: '6px'
              }}
              className="hover:bg-[#C9A84C]/10 transition-colors flex items-center gap-2"
            >
              <Hotel className="h-3.5 w-3.5" />
              Booking Page
            </button>
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
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
              className="hover:border-[#C9A84C] transition-colors"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid rgba(255,80,80,0.3)',
                color: 'rgba(255,100,100,0.8)',
                fontSize: '12px',
                padding: '8px 16px',
                borderRadius: '6px'
              }}
              className="hover:border-[rgba(255,80,80,0.7)] hover:text-[rgba(255,80,80,0.7)] transition-colors flex items-center gap-2"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={{ padding: '32px 40px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Tab Navigation */}
        <div style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }} className="flex gap-6 mb-8">
          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              color: activeTab === "inventory" ? '#C9A84C' : t.inactiveTab,
              fontSize: '14px',
              borderBottom: activeTab === "inventory" ? '2px solid #C9A84C' : '2px solid transparent',
              fontWeight: activeTab === "inventory" ? 600 : 400,
              paddingBottom: '12px'
            }}
            className="transition-colors hover:text-[#C9A84C]"
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            style={{
              color: activeTab === "bookings" ? '#C9A84C' : t.inactiveTab,
              fontSize: '14px',
              borderBottom: activeTab === "bookings" ? '2px solid #C9A84C' : '2px solid transparent',
              fontWeight: activeTab === "bookings" ? 600 : 400,
              paddingBottom: '12px'
            }}
            className="transition-colors hover:text-[#C9A84C]"
          >
            Active Bookings
          </button>
        </div>

        {activeTab === "inventory" ? (
          <>
            {/* Section Heading */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 style={{ fontSize: '22px', color: t.text, fontWeight: 700 }} className="mb-1">
                  Live Inventory & Pricing
                </h2>
                <p style={{ color: t.subtext, fontSize: '13px' }}>
                  Manage room rates and availability. Changes reflect immediately on the public booking engine.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleReset}
                  style={{ color: 'rgba(255,80,80,0.5)', fontSize: '11px', background: 'transparent', border: 'none' }}
                  className="hover:text-red-400 transition-colors flex items-center gap-1 uppercase tracking-wider"
                >
                  <AlertTriangle className="h-3 w-3" />
                  ⚠ Reset
                </button>
                <button
                  onClick={() => fetchRooms(true)}
                  disabled={isRefreshing}
                  style={{ border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C', fontSize: '12px', padding: '8px 16px', borderRadius: '6px' }}
                  className="flex items-center gap-2 hover:bg-[#C9A84C]/10 transition-colors"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ gap: '16px' }} className="grid grid-cols-4 mb-10">
              {[
                { label: "Total Rooms", value: totalInventory, icon: DoorOpen },
                { label: "Booked", value: totalBooked, icon: Lock },
                { label: "Live Available", value: totalAvailable, icon: Users },
                {
                  label: "Occupancy",
                  value: `${occupancyRate}%`,
                  icon: Hotel,
                  specialColor: occupancyRate < 30 ? 'rgba(255,180,80,1)' : occupancyRate > 70 ? '#4CAF50' : t.text
                },
              ].map(({ label, value, icon: Icon, specialColor }) => (
                <div
                  key={label}
                  style={{
                    background: t.surface,
                    border: `1px solid ${t.border}`,
                    borderRadius: '10px',
                    padding: '20px 24px',
                    boxShadow: isDark ? 'none' : '0 2px 12px rgba(180,145,60,0.08)'
                  }}
                  className="flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <p style={{ color: '#C9A84C', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
                      {label}
                    </p>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(201,168,76,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ color: '#C9A84C', width: '16px', height: '16px' }} />
                    </div>
                  </div>
                  <p style={{ color: specialColor || t.text, fontSize: '32px', fontWeight: 700, lineHeight: 1 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>

            {/* Room Inventory Rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {safeRoomsList.length === 0 ? (
                <div style={{ padding: '60px 0', textAlign: 'center', background: t.surface, border: `1px dashed ${t.border}`, borderRadius: '10px' }}>
                  <p style={{ color: t.textMuted }}>No room data found.</p>
                </div>
              ) : safeRoomsList.map((room) => {
                const available = getAvailability(room);
                const isSoldOut = available === 0;
                const isLow = available > 0 && available <= 4;
                const state = editState[room.id];
                const error = errors[room.id];
                const justSaved = savedId === room.id;
                const savingThis = isSaving === room.id;

                let availColor = t.text;
                if (available >= 5) availColor = '#4CAF50';
                else if (available >= 2 && available <= 4) availColor = '#FFA032';
                else if (available <= 1) availColor = '#FF5252';

                return (
                  <div
                    key={room.id}
                    style={{
                      background: t.surface,
                      border: `1px solid ${t.border}`,
                      borderRadius: '10px',
                      padding: '20px 24px',
                      position: 'relative',
                      boxShadow: isDark ? 'none' : '0 1px 8px rgba(180,145,60,0.06)'
                    }}
                  >
                    <div className={`flex items-center justify-between ${savingThis ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col gap-2 w-1/4">
                      <div className="flex items-center gap-3">
                        <h3 style={{ fontSize: '16px', color: t.text, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {room.name}
                        </h3>
                        {isLow && !isSoldOut && (
                          <span style={{
                            background: 'rgba(255,160,50,0.12)',
                            border: '1px solid rgba(255,160,50,0.4)',
                            color: '#FFA032',
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            borderRadius: '4px',
                            padding: '3px 10px'
                          }}>
                            Only {available} Left
                          </span>
                        )}
                        {isSoldOut && (
                          <span style={{
                            background: 'rgba(255,82,82,0.12)',
                            border: '1px solid rgba(255,82,82,0.4)',
                            color: '#FF5252',
                            fontSize: '10px',
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            borderRadius: '4px',
                            padding: '3px 10px'
                          }}>
                            Sold Out
                          </span>
                        )}
                      </div>
                      {error && <p style={{ color: '#FF5252', fontSize: '11px' }}>{error}</p>}
                    </div>

                    <div className="flex items-center gap-12 flex-1 justify-end">
                      <div className="flex flex-col gap-2">
                        <label style={{ color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          Room Price (₦)
                        </label>
                        <input
                          type="number"
                          value={state?.price ?? ""}
                          onChange={(e) => handleChange(room.id, "price", e.target.value)}
                          disabled={savingThis}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            borderRadius: '6px',
                            color: t.inputText,
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 600,
                            padding: '10px',
                            width: '120px',
                            outline: 'none'
                          }}
                          className="focus:border-[#C9A84C] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label style={{ color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          Total Inv.
                        </label>
                        <input
                          type="number"
                          value={state?.totalRooms ?? ""}
                          onChange={(e) => handleChange(room.id, "totalRooms", e.target.value)}
                          disabled={savingThis}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            borderRadius: '6px',
                            color: t.inputText,
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 600,
                            padding: '10px',
                            width: '90px',
                            outline: 'none'
                          }}
                          className="focus:border-[#C9A84C] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2 items-center">
                        <label style={{ color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          Booked
                        </label>
                        <input
                          type="number"
                          value={state?.bookedRooms ?? ""}
                          onChange={(e) => handleChange(room.id, "bookedRooms", e.target.value)}
                          disabled={savingThis}
                          style={{
                            background: t.inputBg,
                            border: `1px solid ${t.inputBorder}`,
                            borderRadius: '6px',
                            color: t.inputText,
                            textAlign: 'center',
                            fontSize: '16px',
                            fontWeight: 600,
                            padding: '10px',
                            width: '90px',
                            outline: 'none'
                          }}
                          className="focus:border-[#C9A84C] transition-colors"
                        />
                      </div>

                      <div className="flex flex-col gap-2 items-center w-20">
                        <label style={{ color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                          Live Avail.
                        </label>
                        <div style={{ color: availColor, fontSize: '20px', fontWeight: 700, padding: '8px 0' }}>
                          {available}
                        </div>
                      </div>

                      <div className="flex items-center ml-4">
                        <button
                          onClick={() => handleSave(room.id)}
                          disabled={savingThis || justSaved}
                          style={{
                            background: justSaved ? 'rgba(76,175,80,0.1)' : '#C9A84C',
                            color: justSaved ? '#4CAF50' : '#0F0D08',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            padding: '10px 24px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            border: justSaved ? '1px solid rgba(76,175,80,0.3)' : '1px solid transparent',
                            width: '110px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          className={justSaved ? "" : "hover:bg-[#b8963e]"}
                        >
                          {savingThis ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : justSaved ? (
                            <span className="flex items-center gap-1.5">✓ Updated</span>
                          ) : (
                            "Update"
                          )}
                        </button>
                      </div>
                    </div>
                    </div>
                    {isSoldOut && (
                      <p style={{ color: 'rgba(255,160,50,0.6)', fontSize: '11px', marginTop: '6px', paddingLeft: '2px' }}>
                        Set Booked Rooms below Total to restore availability
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            {/* Bookings Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h2 style={{ fontSize: '22px', color: t.text, fontWeight: 700 }} className="mb-1">
                  Active Reservations
                </h2>
                <p style={{ color: t.subtext, fontSize: '13px' }}>Monitor and manage guest bookings in real-time.</p>
              </div>
              <div className="relative w-full md:w-72">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: t.textMuted }} />
                <input
                  placeholder="Search name or email..."
                  className="pl-10 h-10 w-full outline-none transition-colors"
                  style={{
                    background: t.inputBg,
                    border: `1px solid ${t.inputBorder}`,
                    borderRadius: '6px',
                    color: t.inputText,
                    fontSize: '13px'
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div style={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: '10px', overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: t.noticeBg, borderBottom: `1px solid ${t.noticeBorder}` }}>
                      <th style={{ padding: '16px 24px', color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Guest / Contact</th>
                      <th style={{ padding: '16px 24px', color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Stay Details</th>
                      <th style={{ padding: '16px 24px', color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Revenue</th>
                      <th style={{ padding: '16px 24px', color: t.labelColor, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: t.noticeBorder }}>
                    {isBookingsLoading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" style={{ color: '#C9A84C' }} />
                          <p style={{ color: t.textMuted, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Loading bookings...</p>
                        </td>
                      </tr>
                    ) : bookings.filter(b =>
                      b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      b.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center">
                          <p style={{ color: t.textMuted }}>No reservations found.</p>
                        </td>
                      </tr>
                    ) : bookings
                      .filter(b =>
                        b.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((booking) => (
                        <tr key={booking.id} className={isDark ? "hover:bg-white/[0.02] transition-colors" : "hover:bg-black/[0.02] transition-colors"}>
                          <td style={{ padding: '16px 24px' }}>
                            <div className="space-y-1">
                              <p style={{ color: t.text, fontWeight: 600, fontSize: '14px' }}>{booking.full_name}</p>
                              <div className="flex items-center gap-3" style={{ fontSize: '11px', color: t.textMuted }}>
                                <span className="flex items-center gap-1"><MailIcon className="h-3 w-3" /> {booking.email}</span>
                                <span className="flex items-center gap-1"><PhoneIcon className="h-3 w-3" /> {booking.phone}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div className="space-y-1">
                              <p style={{ color: '#C9A84C', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{booking.room_type}</p>
                              <div className="flex items-center gap-2" style={{ fontSize: '12px', color: t.textMuted }}>
                                <CalendarCheck className="h-3 w-3" style={{ opacity: 0.5 }} />
                                <span>{format(new Date(booking.check_in), "MMM dd")}</span>
                                <span style={{ opacity: 0.3 }}>→</span>
                                <span>{format(new Date(booking.check_out), "MMM dd")}</span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <p style={{ color: t.text, fontWeight: 600, fontSize: '14px' }}>₦{Number(booking.total_price).toLocaleString()}</p>
                            <p style={{ color: t.textMuted, fontSize: '10px', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>{booking.guests} Guests</p>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 600,
                              textTransform: 'uppercase',
                              letterSpacing: '0.1em',
                              background: booking.status === "pending" ? 'rgba(255,160,50,0.1)' :
                                booking.status === "confirmed" ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.05)',
                              color: booking.status === "pending" ? '#FFA032' :
                                booking.status === "confirmed" ? '#4CAF50' : t.textMuted,
                              border: `1px solid ${booking.status === "pending" ? 'rgba(255,160,50,0.3)' :
                                booking.status === "confirmed" ? 'rgba(76,175,80,0.3)' : t.border}`
                            }}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: '48px',
          background: t.noticeBg,
          border: `1px solid ${t.noticeBorder}`,
          borderRadius: '8px',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Shield style={{ color: '#C9A84C', width: '20px', height: '20px' }} />
          <p style={{ color: t.noticeText, fontSize: '12px', margin: 0 }}>
            You are currently in the Management Portal. All changes made here are instantly pushed to the <strong style={{ color: '#C9A84C', fontWeight: 600 }}>Supabase</strong> database and reflected on the live booking site.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
