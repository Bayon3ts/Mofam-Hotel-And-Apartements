import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Shield,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Hotel,
  Users,
  DoorOpen,
  Lock,
  LogOut,
  Loader2,
} from "lucide-react";
import {
  getRooms,
  updateRoom,
  resetRooms,
  getAvailability,
  type RoomInventory,
} from "@/lib/roomStore";
import { toast } from "@/components/ui/sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [editState, setEditState] = useState<
    Record<string, { price: string; totalRooms: string; bookedRooms: string }>
  >({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  useEffect(() => {
    fetchRooms();
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
      setTimeout(() => setSavedId(null), 3000);
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-accent animate-spin" />
          <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            Syncing Live Inventory...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-40 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Public Site</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                Staff Management
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/booking")}
                className="hidden sm:flex gap-1.5 text-xs font-bold"
              >
                <Hotel className="h-3.5 w-3.5" />
                Booking Page
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 font-bold text-xs"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-extrabold tracking-tight">
                Live Inventory & Pricing
              </h2>
              {isRefreshing && <Loader2 className="h-5 w-5 text-accent animate-spin" />}
            </div>
            <p className="text-muted-foreground">
              Secure Supabase-powered backend. All updates reflect instantly on the public site.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchRooms(true)}
              disabled={isRefreshing}
              className="gap-1.5 text-xs font-bold"
            >
              <RotateCcw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              Reset Database
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Rooms", value: totalInventory, icon: DoorOpen, color: "text-blue-500" },
            { label: "Booked", value: totalBooked, icon: Lock, color: "text-amber-500" },
            { label: "Available", value: totalAvailable, icon: Users, color: "text-emerald-500" },
            { label: "Occupancy", value: `${occupancyRate}%`, icon: Hotel, color: "text-accent" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="shadow-sm border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn("p-2.5 rounded-xl bg-muted/50", color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-2xl font-black tracking-tight">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Room Cards */}
        <div className="space-y-4">
          {safeRoomsList.length === 0 ? (
             <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
                <p className="text-lg font-medium text-muted-foreground">No room data found in the cloud.</p>
                <Button variant="outline" className="mt-4" onClick={() => fetchRooms(true)}>Retry Sync</Button>
             </div>
          ) : safeRoomsList.map((room) => {
            const available = getAvailability(room);
            const isSoldOut = available === 0;
            const isLow = available > 0 && available <= 2;
            const state = editState[room.id];
            const error = errors[room.id];
            const justSaved = savedId === room.id;
            const savingThis = isSaving === room.id;

            return (
              <Card
                key={room.id}
                className={cn(
                  "transition-all duration-300 border-border/60",
                  isSoldOut && "border-red-500/30 bg-red-500/[0.01]",
                  isLow && "border-amber-500/30 bg-amber-500/[0.01]",
                  justSaved && "border-emerald-500/50 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5",
                  savingThis && "opacity-70 ring-1 ring-accent/20"
                )}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Room Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-black tracking-tight">
                          {room.name}
                        </h3>
                        {isSoldOut && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-red-100 text-red-600 border border-red-200">
                            Sold Out
                          </span>
                        )}
                        {isLow && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-amber-100 text-amber-600 border border-amber-200 animate-pulse">
                            <AlertCircle className="h-3 w-3" />
                            Only {available} left
                          </span>
                        )}
                        {justSaved && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 animate-in fade-in zoom-in">
                            <CheckCircle className="h-3 w-3" />
                            Database Updated
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground italic mb-2">{room.tag}</p>
                    </div>

                    <Separator
                      orientation="vertical"
                      className="h-16 hidden lg:block opacity-30"
                    />

                    {/* Editable Fields */}
                    <div className="flex flex-wrap items-end gap-5">
                      <div className="space-y-1.5 w-36">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          Room Price (₦)
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min="1"
                            value={state?.price ?? ""}
                            onChange={(e) =>
                              handleChange(room.id, "price", e.target.value)
                            }
                            disabled={savingThis}
                            className="h-11 pl-4 font-black text-accent border-accent/20 focus-visible:ring-accent"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 w-24">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Total Inv.
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={state?.totalRooms ?? ""}
                          onChange={(e) =>
                            handleChange(room.id, "totalRooms", e.target.value)
                          }
                          disabled={savingThis}
                          className="h-11 font-bold text-center"
                        />
                      </div>

                      <div className="space-y-1.5 w-24">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Booked
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          value={state?.bookedRooms ?? ""}
                          onChange={(e) =>
                            handleChange(room.id, "bookedRooms", e.target.value)
                          }
                          disabled={savingThis}
                          className="h-11 font-bold text-center"
                        />
                      </div>

                      <div className="space-y-1.5 w-24 text-center">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Live Avail.
                        </Label>
                        <div
                          className={cn(
                            "h-11 flex items-center justify-center rounded-md border font-black text-xl",
                            isSoldOut
                              ? "bg-red-500/10 text-red-600 border-red-500/20"
                              : isLow
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          )}
                        >
                          {available}
                        </div>
                      </div>

                      <Button
                        variant={justSaved ? "outline" : "luxury"}
                        className={cn(
                          "h-11 px-8 font-bold gap-2 transition-all min-w-[120px]",
                          justSaved && "border-emerald-500 text-emerald-600 bg-emerald-50 shadow-none"
                        )}
                        onClick={() => handleSave(room.id)}
                        disabled={savingThis || justSaved}
                      >
                        {savingThis ? (
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : justSaved ? (
                          <>
                            <CheckCircle className="h-4 w-4" />
                            Saved
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Update
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="mt-4 p-2.5 bg-red-50 border border-red-100 rounded-lg animate-in slide-in-from-top-2">
                       <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {error}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="mt-12 p-6 bg-accent/5 rounded-2xl border border-accent/10 border-dashed text-center">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mb-2">Security Notice</p>
            <p className="text-sm text-balance">
                You are currently in the <strong>Management Portal</strong>. All changes made here are instantly pushed to the <strong>Supabase</strong> database and reflected on the live booking site.
            </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
