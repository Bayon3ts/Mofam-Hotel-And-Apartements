import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
}

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

// ─── Component ───────────────────────────────────────────────────────────────
const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  const state = location.state as BookingState | null;

  useEffect(() => {
    setIsVisible(true);
    if (!state) {
      const timer = setTimeout(() => navigate("/booking"), 3000);
      return () => clearTimeout(timer);
    }
  }, [state, navigate]);

  // ── Fallback screen ──────────────────────────────────────────────────────
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 px-4">
          <div className="flex justify-center mb-4">
            <Calendar className="h-16 w-16 text-muted-foreground opacity-40" />
          </div>
          <h2 className="text-2xl font-bold">No booking data found</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            It looks like you navigated here directly. Redirecting you back to the booking page…
          </p>
          <Button variant="luxury" onClick={() => navigate("/booking")}>
            Go to Booking
          </Button>
        </div>
      </div>
    );
  }

  // ── Destructure state ────────────────────────────────────────────────────
  const {
    checkIn,
    checkOut,
    nights,
    numRooms,
    adults,
    children,
    totalGuests,
    selectedRoom,
    totalPrice,
  } = state;

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-accent/5">
      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Hotel
            </Button>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-luxury bg-clip-text text-transparent">
              Mofam Hotel And Apartements
            </h1>
            <div className="w-28 hidden sm:block" />
          </div>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main className="container mx-auto px-4 py-8">
        <div
          className={cn(
            "max-w-5xl mx-auto transition-all duration-700",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Confirmation header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
                <CheckCircle className="relative h-20 w-20 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground text-lg max-w-lg mx-auto">
              Thank you for choosing Mofam Hotel And Apartements. Your reservation has been successfully processed.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
            {/* ── LEFT COLUMN ──────────────────────────────────────────── */}
            <div className="space-y-6">
              {/* Dates & Stay Summary */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-5 w-5 text-accent" />
                    Your Stay
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Check-In
                      </p>
                      <p className="text-xl font-bold">{format(checkInDate, "EEE, MMM dd")}</p>
                      <p className="text-sm text-muted-foreground">{format(checkInDate, "yyyy")}</p>
                      <p className="text-xs text-muted-foreground mt-1">From 3:00 PM</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Check-Out
                      </p>
                      <p className="text-xl font-bold">{format(checkOutDate, "EEE, MMM dd")}</p>
                      <p className="text-sm text-muted-foreground">{format(checkOutDate, "yyyy")}</p>
                      <p className="text-xs text-muted-foreground mt-1">Until 11:00 AM</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: "Nights", value: nights },
                      { label: "Rooms", value: numRooms },
                      { label: "Adults", value: adults },
                      { label: "Children", value: children },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-3 bg-muted rounded-xl">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-xl font-bold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Selected Room */}
              <Card className="shadow-elegant border-accent/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="h-5 w-5 text-accent" />
                    Room Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{selectedRoom.name} Room</h3>
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      </div>
                      <p className="text-sm text-muted-foreground">{selectedRoom.tag}</p>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-sm">
                        {selectedRoom.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-accent">{fmt(selectedRoom.price)}</p>
                      <p className="text-xs text-muted-foreground">per night</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hotel Information */}
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="h-5 w-5 text-accent" />
                    Hotel Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Address</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        19 Ofatedo Road,<br />
                        Osogbo,<br />
                        Osun State, Nigeria
                      </p>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm mb-2">Contact</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-accent shrink-0" />
                        +234 (0) 800-MOFAM-HOTEL
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 text-accent shrink-0" />
                        reservations@mofamhotel.com
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/60">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p><span className="font-semibold text-foreground">Check-In:</span> From 3:00 PM</p>
                      <p><span className="font-semibold text-foreground">Check-Out:</span> By 11:00 AM</p>
                      <p className="mt-1">Early check-in and late check-out may be available upon request.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── RIGHT COLUMN: Price Summary ───────────────────────────── */}
            <div className="space-y-4">
              <Card className="shadow-elegant border-accent/20 sticky top-24">
                <CardHeader className="bg-accent/5 border-b border-border">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5 text-accent" />
                    Price Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{selectedRoom.name} Room</span>
                      <span>{fmt(selectedRoom.price)} / night</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">× {nights} nights</span>
                    </div>
                    {numRooms > 1 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">× {numRooms} rooms</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total guests</span>
                      <span>{totalGuests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes & fees</span>
                      <span className="text-emerald-600 font-medium">Included</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-bold">Total Amount</span>
                    <div className="text-right">
                      <p className="text-3xl font-black text-accent">{fmt(totalPrice)}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        Paid via online reservation
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3 pt-1">
                    <Button
                      variant="luxury"
                      size="lg"
                      className="w-full"
                      onClick={() => navigate("/")}
                    >
                      Return to Homepage
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full"
                      onClick={() => window.print()}
                    >
                      Print Confirmation
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingConfirmation;