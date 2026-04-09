import { useState, useEffect } from "react";
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
  Loader2
} from "lucide-react";
import { getRooms, getAvailability, type RoomInventory } from "@/lib/roomStore";
import { cn } from "@/lib/utils";

// Import images
import heroImage from "@/assets/hero-hotel.jpg";
import suiteImage from "@/assets/suite-room.jpg";
import diningImage from "@/assets/dining-restaurant.jpg";
import meetingImage from "@/assets/meeting-room.jpg";
import spaImage from "@/assets/spa-amenities.jpg";
import loungeImage from "@/assets/lounge-area.jpg";

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

const fmt = (n: number) => `₦${n.toLocaleString("en-NG")}`;

const Index = () => {
  const [activeSection, setActiveSection] = useState("home");
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [rooms, setRooms] = useState<RoomInventory[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  
  const { scrollY } = useScroll();
  const parallaxY = useTransform(scrollY, [0, 1000], [0, 200]);

  const navItems = [
    { id: "home", label: "Home" },
    { id: "rooms", label: "Rooms & Suites" },
    { id: "amenities", label: "Amenities" },
    { id: "dining", label: "Dining" },
    { id: "events", label: "Meetings & Events" },
    { id: "contact", label: "Contact" }
  ];
  
  const refreshRooms = async () => {
    try {
      const data = await getRooms();
      console.log("Rooms data received:", data);
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to refresh rooms:", err);
      setRooms([]);
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
      if (window.scrollY > window.innerHeight * 0.8) {
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

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Helper to get image for room
  const getRoomImage = (id: string, index: number) => {
    if (id.includes("suite")) return suiteImage;
    if (id.includes("apartment")) return loungeImage;
    if (id.includes("royal") || id.includes("presidential") || id.includes("vvip")) return suiteImage;
    return index % 2 === 0 ? loungeImage : suiteImage;
  };

  // ── SAFE FILTER GUARDS ───────────────────────────────────────────────────
  const safeRooms = Array.isArray(rooms) ? rooms : [];

  // Select featured rooms (top 3: Royal, Royal Apartment, Presidential/VVIP)
  const featuredRooms = safeRooms.filter(r => 
    ["royal", "royal-apartment", "presidential", "vvip", "executive-suite"].includes(r.id)
  ).sort((a, b) => {
    const order = ["royal", "royal-apartment", "executive-suite", "vvip", "presidential"];
    return order.indexOf(a.id) - order.indexOf(b.id);
  });

  // Fallback if filter returns empty (show first 3)
  const displayRooms = featuredRooms.length > 0 ? featuredRooms.slice(0, 3) : safeRooms.slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${
          isScrolled 
            ? "translate-y-0 opacity-100 bg-background/95 backdrop-blur-md border-b border-border shadow-sm pointer-events-auto" 
            : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <img src="/mofam.webp" alt="Mofam Hotel And Apartements" className="h-10 md:h-12 w-auto object-contain" />
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors hover:text-accent ${
                    activeSection === item.id ? "text-accent" : "text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="hidden md:block">
              <Button variant="luxury" size="sm" onClick={() => navigate('/booking')}>Book Now</Button>
            </div>
            
            {/* Mobile Toggle Button */}
            <button 
              className="md:hidden text-foreground p-2 -mr-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background border-b border-border shadow-lg animate-fade-in">
             <div className="container mx-auto px-6 py-4 flex flex-col space-y-4">
               {navItems.map((item) => (
                 <button
                   key={item.id}
                   onClick={() => {
                     scrollToSection(item.id);
                     setIsMobileMenuOpen(false);
                   }}
                   className={`text-left text-base font-medium transition-colors hover:text-accent ${
                     activeSection === item.id ? "text-accent" : "text-foreground"
                   }`}
                 >
                   {item.label}
                 </button>
               ))}
               <Button variant="luxury" className="w-full mt-2" onClick={() => navigate('/booking')}>Book Now</Button>
             </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})`, y: parallaxY }}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <motion.div 
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="relative z-10 text-center text-white px-6 max-w-4xl mx-auto"
        >
          <motion.h1 variants={fadeUpItem} className="text-5xl md:text-7xl font-bold mb-6">
            Experience 
            <span className="block bg-gradient-gold bg-clip-text text-transparent">
              Luxury Redefined
            </span>
          </motion.h1>
          <motion.p variants={fadeUpItem} className="text-xl md:text-2xl mb-8 text-white/90">
            Where elegance meets comfort in the heart of the city
          </motion.p>
          <motion.div variants={fadeUpItem} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" onClick={() => scrollToSection("rooms")}>
              Explore Rooms <ArrowRight className="ml-2" />
            </Button>
            <Button variant="luxury" size="xl" onClick={() => navigate('/booking')}>
              Book Your Stay
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Rooms & Suites */}
      <section id="rooms" className="py-20 px-6">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Rooms & Suites</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover our collection of meticulously designed accommodations
            </p>
          </motion.div>

          {isLoadingRooms ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="h-10 w-10 animate-spin text-accent" />
              <p className="text-muted-foreground animate-pulse font-medium">Curating your experience...</p>
            </div>
          ) : safeRooms.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed border-border">
              <p className="text-lg font-medium text-muted-foreground">Our rooms are being prepared. Please check back shortly.</p>
              <Button variant="outline" className="mt-4" onClick={refreshRooms}>Try Refreshing</Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayRooms.map((room, index) => {
                const available = getAvailability(room);
                const isSoldOut = available === 0;
                
                return (
                  <motion.div variants={fadeScaleItem} key={room.id}>
                    <Card className={cn(
                      "overflow-hidden h-full shadow-luxury hover:shadow-hover transition-all duration-300 group",
                      isSoldOut && "opacity-80"
                    )}>
                    <div className="relative h-64 overflow-hidden">
                      <img 
                        src={getRoomImage(room.id, index)} 
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-4 right-4 bg-accent text-primary px-3 py-1 rounded-full text-sm font-semibold">
                        {fmt(room.price)}/night
                      </div>
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-1 rounded-full font-black uppercase tracking-widest text-xs">
                            Sold Out Today
                          </span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-2xl font-bold">{room.name}</h3>
                        {available > 0 && available <= 2 && (
                          <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter bg-red-100 px-2 py-0.5 rounded animate-pulse">
                            Only {available} left!
                          </span>
                        )}
                      </div>
                      <ul className="space-y-2 mb-6">
                        {room.amenities.map((feature, idx) => (
                          <li key={idx} className="flex items-center text-muted-foreground whitespace-nowrap">
                            <Star className="h-4 w-4 text-accent mr-2" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                        <li className="flex items-center text-muted-foreground">
                          <Users className="h-4 w-4 text-accent mr-2" />
                          <span className="text-sm">Max {room.maxGuests} Guests</span>
                        </li>
                      </ul>
                      <Button 
                        variant={isSoldOut ? "outline" : "elegant"} 
                        className="w-full" 
                        onClick={() => navigate('/booking')}
                        disabled={isSoldOut}
                      >
                        {isSoldOut ? "Join Waiting List" : "Book Now"}
                      </Button>
                    </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {!isLoadingRooms && safeRooms.length > 0 && (
            <motion.div variants={fadeUpItem} className="mt-12 text-center">
               <Button variant="luxury" size="lg" onClick={() => navigate('/booking')}>
                 View All Room Types
               </Button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Amenities */}
      <section id="amenities" className="py-20 px-6 bg-muted/30">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">World-Class Amenities</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Indulge in our premium facilities designed for your comfort and convenience
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div variants={fadeUpItem} className="space-y-8">
              {[
                { icon: Waves, title: "Spa & Wellness", desc: "Rejuvenate in our award-winning spa with premium treatments", link: "/spa-wellness" },
                { icon: Dumbbell, title: "Fitness Center", desc: "State-of-the-art equipment available 24/7", link: "/fitness-center" },
                { icon: Wifi, title: "High-Speed WiFi", desc: "Complimentary internet throughout the property", link: null },
                { icon: Car, title: "Valet Parking", desc: "Secure parking with professional valet service", link: "/valet-parking" }
              ].map((amenity, index) => (
                <div 
                  key={index} 
                  className={`flex items-start space-x-4 ${amenity.link ? 'cursor-pointer hover:bg-muted/50 p-4 rounded-lg transition-colors' : 'p-4'}`}
                  onClick={() => amenity.link && navigate(amenity.link)}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-gold rounded-lg flex items-center justify-center">
                    <amenity.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{amenity.title}</h3>
                    <p className="text-muted-foreground">{amenity.desc}</p>
                    {amenity.link && (
                      <p className="text-sm text-primary mt-2 hover:underline">Learn more →</p>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
            <motion.div variants={fadeScaleItem} className="overflow-hidden rounded-lg shadow-luxury">
              <motion.img 
                src={spaImage} 
                alt="Spa Amenities"
                className="w-full h-96 object-cover"
                initial={{ scale: 1.1 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                viewport={{ once: true }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Dining */}
      <section id="dining" className="py-20 px-6">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Exquisite Dining</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Savor culinary excellence at our award-winning restaurants
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={fadeScaleItem}>
              <Card className="overflow-hidden shadow-luxury">
                <div className="relative h-64 overflow-hidden">
                  <motion.img 
                    src={diningImage} 
                    alt="Fine Dining Restaurant"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <ChefHat className="h-5 w-5 text-accent mr-2" />
                  <h3 className="text-2xl font-bold">Le Jardin</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Award-winning fine dining with innovative cuisine and impeccable service
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open: 6 PM - 11 PM</span>
                  <Button variant="luxury" size="sm">Reserve Table</Button>
                </div>
              </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeScaleItem}>
              <Card className="overflow-hidden shadow-luxury">
                <div className="relative h-64 overflow-hidden">
                  <motion.img 
                    src={loungeImage} 
                    alt="Café & Lounge"
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  />
              </div>
              <CardContent className="p-6">
                <div className="flex items-center mb-3">
                  <Coffee className="h-5 w-5 text-accent mr-2" />
                  <h3 className="text-2xl font-bold">Sky Lounge</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Casual dining with panoramic city views and artisan coffee
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Open: 7 AM - 10 PM</span>
                  <Button variant="elegant" size="sm">View Menu</Button>
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Meetings & Events */}
      <section id="events" className="py-20 px-6 bg-muted/30">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Meetings & Events</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Host memorable events in our sophisticated venues
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Grand Ballroom",
                capacity: "300 guests",
                image: meetingImage,
                features: ["Crystal chandeliers", "Premium AV equipment", "Dedicated event planning"]
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
              <motion.div variants={fadeScaleItem} key={index}>
                <Card className="overflow-hidden h-full shadow-luxury hover:shadow-hover transition-all duration-300">
                  <div className="relative h-48 overflow-hidden group">
                    <motion.img 
                      src={venue.image} 
                      alt={venue.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold">{venue.title}</h3>
                    <div className="flex items-center text-accent">
                      <Users className="h-4 w-4 mr-1" />
                      <span className="text-sm">{venue.capacity}</span>
                    </div>
                  </div>
                  <ul className="space-y-1 mb-6 text-sm text-muted-foreground">
                    {venue.features.map((feature, idx) => (
                      <li key={idx}>• {feature}</li>
                    ))}
                  </ul>
                  <Button variant="elegant" className="w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check Availability
                  </Button>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-6">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUpItem} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're here to make your stay exceptional
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12">
            <motion.div variants={fadeUpItem} className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">19 Ofatedo Road, Osogbo,  Osun State, Nigeria</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-muted-foreground">+234 (706) 920-6935</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-muted-foreground">reservations@mofamhotel.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeScaleItem}>
              <Card className="shadow-luxury">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold mb-6">Send us a Message</h3>
                  <form className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input placeholder="First Name" />
                      <Input placeholder="Last Name" />
                    </div>
                    <Input placeholder="Email Address" type="email" />
                    <Input placeholder="Phone Number" type="tel" />
                    <Textarea placeholder="How can we assist you?" rows={4} />
                    <Button variant="luxury" size="lg" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <img src="/mofam.webp" alt="Mofam Hotel And Apartements" className="h-10 md:h-12 w-auto object-contain mb-4" />
              <p className="text-primary-foreground/80">
                Experience luxury redefined in the heart of the city.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li><a href="#rooms" className="hover:text-accent transition-colors">Rooms & Suites</a></li>
                <li><a href="#amenities" className="hover:text-accent transition-colors">Amenities</a></li>
                <li><a href="#dining" className="hover:text-accent transition-colors">Dining</a></li>
                <li><a href="#events" className="hover:text-accent transition-colors">Events</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-primary-foreground/80">
                <li>Concierge</li>
                <li>Room Service</li>
                <li>Spa & Wellness</li>
                <li>Business Center</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Management</h4>
              <div className="space-y-2 text-primary-foreground/80">
                 <p className="text-sm">Secure Portal Access Required</p>
              </div>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60">
            <p>&copy; 2025 Mofam Hotel And Apartements. All rights reserved. Designed by Bayonet Lab</p>
          </div>
        </div>
      </footer>

      {/* Floating AI Concierge Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button 
          variant="luxury" 
          size="lg"
          className="rounded-full shadow-elegant hover:shadow-glow transition-all duration-300 hover:scale-105 flex items-center gap-2 px-6 py-3"
          onClick={() => setShowSupport(true)}
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Talk to AI Concierge</span>
        </Button>
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