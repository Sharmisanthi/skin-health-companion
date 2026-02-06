import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LOCATIONS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Calendar,
  User,
  Loader2,
  Filter
} from "lucide-react";
import { BookAppointmentDialog } from "@/components/BookAppointmentDialog";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience_years: number;
  hospital: string | null;
  location: string;
  phone: string;
  rating: number;
  consultation_fee: number | null;
  avatar_url: string | null;
}

// Sample doctors data for demo
const sampleDoctors: Doctor[] = [
  {
    id: "1",
    name: "Dr. Priya Sharma",
    specialization: "Dermatologist",
    experience_years: 15,
    hospital: "Apollo Hospital",
    location: "Coimbatore",
    phone: "+91 98765 43210",
    rating: 4.8,
    consultation_fee: 500,
    avatar_url: null,
  },
  {
    id: "2",
    name: "Dr. Rajesh Kumar",
    specialization: "Skin Specialist",
    experience_years: 12,
    hospital: "KG Hospital",
    location: "Coimbatore",
    phone: "+91 98765 43211",
    rating: 4.6,
    consultation_fee: 400,
    avatar_url: null,
  },
  {
    id: "3",
    name: "Dr. Lakshmi Narayanan",
    specialization: "Dermatologist & Cosmetologist",
    experience_years: 20,
    hospital: "PSG Hospital",
    location: "Coimbatore",
    phone: "+91 98765 43212",
    rating: 4.9,
    consultation_fee: 600,
    avatar_url: null,
  },
  {
    id: "4",
    name: "Dr. Arun Prakash",
    specialization: "Dermatologist",
    experience_years: 8,
    hospital: "KMCH",
    location: "Coimbatore",
    phone: "+91 98765 43213",
    rating: 4.5,
    consultation_fee: 350,
    avatar_url: null,
  },
  {
    id: "5",
    name: "Dr. Meena Krishnan",
    specialization: "Pediatric Dermatologist",
    experience_years: 10,
    hospital: "Ganga Hospital",
    location: "Coimbatore",
    phone: "+91 98765 43214",
    rating: 4.7,
    consultation_fee: 450,
    avatar_url: null,
  },
  {
    id: "6",
    name: "Dr. Venkat Subramanian",
    specialization: "Dermatologist",
    experience_years: 18,
    hospital: "Kovai Medical Center",
    location: "Coimbatore",
    phone: "+91 98765 43215",
    rating: 4.8,
    consultation_fee: 550,
    avatar_url: null,
  },
];

export default function Doctors() {
  const [doctors, setDoctors] = useState<Doctor[]>(sampleDoctors);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("Coimbatore");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.hospital?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = !selectedLocation || doctor.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Find Dermatologists
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect with verified skin specialists in your area. Book appointments 
            and get expert care for your skin conditions.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search doctors, specializations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-full sm:w-[200px] h-12">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-20">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No doctors found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or location filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDoctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="bg-card rounded-2xl border border-border p-6 card-shadow hover:card-shadow-hover transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-primary flex-shrink-0">
                    {doctor.avatar_url ? (
                      <img
                        src={doctor.avatar_url}
                        alt={doctor.name}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary-foreground" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{doctor.name}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="font-medium">{doctor.rating}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      {doctor.hospital && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {doctor.hospital}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {doctor.experience_years} years exp.
                      </span>
                      {doctor.consultation_fee && (
                        <span className="font-medium text-foreground">
                          ₹{doctor.consultation_fee} consultation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 md:mt-0">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`tel:${doctor.phone}`}>
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-gradient-primary hover:opacity-90"
                      onClick={() => handleBookAppointment(doctor)}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BookAppointmentDialog
        doctor={selectedDoctor}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />
    </div>
  );
}
