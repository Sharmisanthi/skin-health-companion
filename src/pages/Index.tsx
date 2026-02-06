import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { 
  Stethoscope, 
  Camera, 
  Calendar, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Users,
  Activity,
  Star
} from "lucide-react";

export default function Index() {
  const features = [
    {
      icon: Camera,
      title: "AI-Powered Detection",
      description: "Upload a photo and get instant AI analysis of potential skin conditions"
    },
    {
      icon: Stethoscope,
      title: "Expert Remedies",
      description: "Get personalized treatment recommendations and home remedies"
    },
    {
      icon: Calendar,
      title: "Book Appointments",
      description: "Find and book appointments with dermatologists in your area"
    },
    {
      icon: Shield,
      title: "100+ Conditions",
      description: "Comprehensive database covering all major skin diseases and disorders"
    }
  ];

  const stats = [
    { value: "100+", label: "Skin Conditions" },
    { value: "10+", label: "Disease Categories" },
    { value: "24/7", label: "AI Detection" },
    { value: "1000+", label: "Doctors Listed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container relative py-20 lg:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-sm font-medium rounded-full bg-primary/10 text-primary animate-fade-in">
              <Activity className="h-4 w-4" />
              AI-Powered Skin Disease Detection
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 animate-fade-in-up">
              Detect Skin Diseases
              <span className="block text-gradient-primary">Instantly with AI</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Upload a photo of your skin condition and get instant AI analysis, remedies, 
              and connect with top dermatologists in your area.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <Link to="/detect">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8 h-14 shadow-glow">
                  <Camera className="mr-2 h-5 w-5" />
                  Start Detection
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/categories">
                <Button variant="outline" size="lg" className="text-lg px-8 h-14">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl md:text-4xl font-display font-bold text-gradient-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform makes it easy to identify skin conditions and get the help you need
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-card border border-border card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Disease Categories
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl">
                Explore our comprehensive database of skin conditions organized by category
              </p>
            </div>
            <Link to="/categories">
              <Button variant="outline" className="mt-4 md:mt-0">
                View All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Infectious Diseases", count: 20, color: "from-red-500 to-orange-500" },
              { name: "Inflammatory & Allergic", count: 8, color: "from-orange-500 to-yellow-500" },
              { name: "Hair & Scalp Disorders", count: 6, color: "from-pink-500 to-rose-500" },
              { name: "Nail Disorders", count: 6, color: "from-amber-500 to-orange-500" },
              { name: "Skin Cancers", count: 8, color: "from-red-600 to-red-500" },
              { name: "Other Conditions", count: 7, color: "from-gray-500 to-gray-400" },
            ].map((category, index) => (
              <Link
                key={index}
                to="/categories"
                className="group relative overflow-hidden rounded-2xl p-6 bg-card border border-border card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${category.color} opacity-10 rounded-bl-full`} />
                <h3 className="font-semibold mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground">{category.count} conditions</p>
                <ArrowRight className="absolute bottom-6 right-6 h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-8 md:p-12 lg:p-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Create a free account to save your detection history, book appointments, 
                and get personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/register">
                  <Button size="lg" variant="secondary" className="text-lg px-8">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/doctors">
                  <Button size="lg" variant="ghost" className="text-lg px-8 text-primary-foreground hover:bg-white/10">
                    <Users className="mr-2 h-5 w-5" />
                    Find Doctors
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-muted/30">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
                <Stethoscope className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold">SkinCare Detection</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 SkinCare Detection. For educational purposes only. Always consult a healthcare professional.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
