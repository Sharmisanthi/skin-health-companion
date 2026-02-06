import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { CalendarIcon, Loader2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital: string | null;
  consultation_fee: number | null;
}

interface BookAppointmentDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
];

export function BookAppointmentDialog({
  doctor,
  open,
  onOpenChange,
}: BookAppointmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to book an appointment",
        variant: "destructive",
      });
      return;
    }

    if (!date || !time) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // For demo purposes, we'll just show success
      // In production, this would insert into the appointments table
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSuccess(true);
      toast({
        title: "Appointment Requested!",
        description: `Your appointment with ${doctor?.name} is pending confirmation.`,
      });
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after closing
    setTimeout(() => {
      setDate(undefined);
      setTime("");
      setSymptoms("");
      setSuccess(false);
    }, 200);
  };

  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {success ? (
          <div className="text-center py-8">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Appointment Requested!</h2>
            <p className="text-muted-foreground mb-6">
              Your appointment with {doctor.name} on{" "}
              {date && format(date, "MMMM d, yyyy")} at {time} is pending confirmation.
              You'll receive a notification once confirmed.
            </p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
              <DialogDescription>
                Schedule an appointment with {doctor.name}
              </DialogDescription>
            </DialogHeader>

            {!user ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">
                  Please sign in to book an appointment
                </p>
                <Link to="/login">
                  <Button>Sign In</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                {/* Doctor Info */}
                <div className="p-4 rounded-lg bg-muted/50">
                  <h3 className="font-medium">{doctor.name}</h3>
                  <p className="text-sm text-muted-foreground">{doctor.specialization}</p>
                  {doctor.hospital && (
                    <p className="text-sm text-muted-foreground">{doctor.hospital}</p>
                  )}
                  {doctor.consultation_fee && (
                    <p className="text-sm font-medium mt-2">
                      Consultation Fee: ₹{doctor.consultation_fee}
                    </p>
                  )}
                </div>

                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Select Date</Label>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date() || date.getDay() === 0}
                    className="rounded-md border"
                  />
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                  <Label>Select Time</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Symptoms */}
                <div className="space-y-2">
                  <Label htmlFor="symptoms">Describe your symptoms (optional)</Label>
                  <Textarea
                    id="symptoms"
                    placeholder="Briefly describe your skin condition or symptoms..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading || !date || !time}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  )}
                </Button>
              </form>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
