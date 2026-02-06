import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, 
  History, 
  Calendar, 
  User, 
  ArrowRight,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle
} from "lucide-react";

interface DetectionRecord {
  id: string;
  detected_disease_name: string;
  confidence_score: number;
  created_at: string;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [detections, setDetections] = useState<DetectionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchDetections();
    }
  }, [user]);

  const fetchDetections = async () => {
    try {
      const { data, error } = await supabase
        .from("detection_history")
        .select("id, detected_disease_name, confidence_score, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setDetections(data || []);
    } catch (error) {
      console.error("Error fetching detections:", error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const quickActions = [
    {
      title: "Detect Disease",
      description: "Upload an image for AI analysis",
      icon: Camera,
      href: "/detect",
      color: "from-teal-500 to-cyan-500",
    },
    {
      title: "Browse Categories",
      description: "Explore skin conditions",
      icon: History,
      href: "/categories",
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "Find Doctors",
      description: "Book an appointment",
      icon: Calendar,
      href: "/doctors",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        {/* Welcome */}
        <div className="mb-12">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back, {user.email?.split("@")[0]}!
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your skin health journey
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="group relative overflow-hidden rounded-2xl p-6 bg-card border border-border card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${action.color} opacity-10 rounded-bl-full`} />
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} mb-4 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>

        {/* Recent Detections */}
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 card-shadow">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Detections</h2>
            <Link to="/detect">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : detections.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">No detections yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start by uploading an image for analysis
              </p>
              <Link to="/detect">
                <Button className="bg-gradient-primary hover:opacity-90">
                  <Camera className="mr-2 h-4 w-4" />
                  Start Detection
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {detections.map((detection) => (
                <div
                  key={detection.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">
                      {detection.detected_disease_name || "Unknown Condition"}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(detection.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-primary">
                    {detection.confidence_score}% confidence
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
