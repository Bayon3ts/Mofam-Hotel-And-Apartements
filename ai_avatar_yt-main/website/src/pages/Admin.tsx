import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import {
  getRooms,
  updateRoom,
  resetRooms,
  getAvailability,
  type RoomInventory,
} from "@/lib/roomStore";

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const Admin = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [editState, setEditState] = useState<
    Record<string, { price: string; totalRooms: string; bookedRooms: string }>
  >({});
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Security
  const [password, setPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "mofam2024") {
      setIsAuthorized(true);
      setLoginError("");
    } else {
      setLoginError("Invalid management password");
    }
  };

  // Load rooms on mount
  useEffect(() => {
    if (!isAuthorized) return;
    const loaded = getRooms();
    setRooms(loaded);
    const initial: Record<string, { price: string; totalRooms: string; bookedRooms: string }> = {};
    loaded.forEach((r) => {
      initial[r.id] = {
        price: String(r.price),
        totalRooms: String(r.totalRooms),
        bookedRooms: String(r.bookedRooms),
      };
    });
    setEditState(initial);
  }, [isAuthorized]);

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
    
    // Simulate network delay for better UX (loading states)
    await new Promise(resolve => setTimeout(resolve, 600));

    const updated = updateRoom(id, {
      price: parseInt(state.price, 10),
      totalRooms: parseInt(state.totalRooms, 10),
      bookedRooms: parseInt(state.bookedRooms, 10),
    });
    setRooms(updated);

    // Sync edit state with validated values
    const room = updated.find((r) => r.id === id);
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

    setIsSaving(null);
    setSavedId(id);
    setTimeout(() => setSavedId(null), 3000);
  };

  // Reset all to defaults
  const handleReset = () => {
    if (!confirm("Are you sure you want to reset all data to default values?")) return;
    
    const fresh = resetRooms();
    setRooms(fresh);
    const initial: Record<string, { price: string; totalRooms: string; bookedRooms: string }> = {};
    fresh.forEach((r) => {
      initial[r.id] = {
        price: String(r.price),
        totalRooms: String(r.totalRooms),
        bookedRooms: String(r.bookedRooms),
      };
    });
    setEditState(initial);
    setErrors({});
    setSavedId(null);
  };

  // Summary stats
  const totalInventory = rooms.reduce((s, r) => s + r.totalRooms, 0);
  const totalBooked = rooms.reduce((s, r) => s + r.bookedRooms, 0);
  const totalAvailable = rooms.reduce((s, r) => s + getAvailability(r), 0);
  const occupancyRate = totalInventory > 0 ? Math.round((totalBooked / totalInventory) * 100) : 0;

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-2xl border-accent/20">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Staff Authentication</CardTitle>
            <p className="text-sm text-muted-foreground">Enter your secure password to access management</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Management Password</Label>
                <Input 
                  id="password"
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-center text-lg font-bold tracking-widest"
                  autoFocus
                />
              </div>
              {loginError && (
                <p className="text-xs font-bold text-red-500 text-center animate-bounce">
                  {loginError}
                </p>
              )}
              <Button type="submit" variant="luxury" className="w-full h-12 font-bold text-base">
                Access Panel
              </Button>
              <Button variant="ghost" onClick={() => navigate("/")} className="w-full h-10 text-xs text-muted-foreground">
                Back to Public Site
              </Button>
            </form>
          </CardContent>
        </Card>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/booking")}
              className="gap-1.5 text-xs font-bold"
            >
              <Hotel className="h-3.5 w-3.5" />
              Booking Page
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl">
        {/* Page Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-1">
              Live Inventory & Pricing
            </h2>
            <p className="text-muted-foreground">
              Update room rates and availability. Changes persist immediately.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All Data
          </Button>
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
          {rooms.map((room) => {
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
                  justSaved && "border-emerald-500/50 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5"
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
                            Updated successfully
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
                You are currently in the <strong>Management Portal</strong>. All changes made here are instantly pushed to the public booking interface. Please ensure all pricing and inventory counts are verified before updating.
            </p>
        </div>
      </main>
    </div>
  );
};

export default Admin;
