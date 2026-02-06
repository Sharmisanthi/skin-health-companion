import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Phone
} from "lucide-react";

interface Appointment {
  id: string;
  doctorName: string;
  specialization: string;
  hospital: string;
  date: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  symptoms?: string;
}

// Sample appointments for demo
const sampleAppointments: Appointment[] = [
  {
    id: "1",
    doctorName: "Dr. Priya Sharma",
    specialization: "Dermatologist",
    hospital: "Apollo Hospital",
    date: "2024-02-15",
    time: "10:00",
    status: "confirmed",
    symptoms: "Skin rash on arms",
  },
  {
    id: "2",
    doctorName: "Dr. Rajesh Kumar",
    specialization: "Skin Specialist",
    hospital: "KG Hospital",
    date: "2024-02-20",
    time: "14:30",
    status: "pending",
    symptoms: "Acne treatment consultation",
  },
];

export default function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>(sampleAppointments);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const upcomingAppointments = appointments.filter(
    (a) => a.status === "pending" || a.status === "confirmed"
  );
  const pastAppointments = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const getStatusBadge = (status: Appointment["status"]) => {
    const styles = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      confirmed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      completed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const AppointmentCard = ({ appointment }: { appointment: Appointment }) => (
    <div className="bg-card rounded-xl border border-border p-5 card-shadow">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">{appointment.doctorName}</h3>
            <p className="text-sm text-muted-foreground">{appointment.specialization}</p>
          </div>
        </div>
        {getStatusBadge(appointment.status)}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {appointment.hospital}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {new Date(appointment.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {appointment.time}
        </div>
      </div>

      {appointment.symptoms && (
        <div className="mt-4 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Symptoms</p>
          <p className="text-sm">{appointment.symptoms}</p>
        </div>
      )}

      {(appointment.status === "pending" || appointment.status === "confirmed") && (
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <Phone className="mr-2 h-4 w-4" />
            Contact
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-destructive hover:text-destructive"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <div className="max-w-3xl mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">My Appointments</h1>
          <p className="text-muted-foreground">
            Manage your upcoming and past appointments with dermatologists
          </p>
        </div>

        <Tabs defaultValue="upcoming" className="max-w-3xl">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No upcoming appointments</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Book an appointment with a dermatologist
                </p>
                <Button
                  onClick={() => navigate("/doctors")}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  Find Doctors
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastAppointments.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium mb-2">No past appointments</h3>
                <p className="text-sm text-muted-foreground">
                  Your completed appointments will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <AppointmentCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
