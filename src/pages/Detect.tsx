import { useState, useRef } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Camera, 
  Upload, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Stethoscope,
  Pill,
  Calendar,
  ArrowRight,
  X,
  Image as ImageIcon
} from "lucide-react";
import { Link } from "react-router-dom";

interface DetectionResult {
  disease: string;
  confidence: number;
  description: string;
  symptoms: string[];
  remedies: string[];
  whenToSeeDoctor: string;
  prevention: string[];
}

export default function Detect() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-skin", {
        body: { image: selectedImage },
      });

      if (error) throw error;

      setResult(data);

      // Save to history if user is logged in
      if (user && data) {
        await supabase.from("detection_history").insert({
          user_id: user.id,
          image_url: selectedImage.substring(0, 500), // Store truncated for demo
          detected_disease_name: data.disease,
          confidence_score: data.confidence,
          ai_response: JSON.stringify(data),
        });
      }
    } catch (error: any) {
      console.error("Detection error:", error);
      toast({
        title: "Detection failed",
        description: error.message || "Failed to analyze image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-primary mb-6">
              <Camera className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
              AI Skin Disease Detection
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload a clear photo of the affected skin area. Our AI will analyze it and 
              provide potential conditions, remedies, and recommendations.
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 mb-8 card-shadow">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Upload Area */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Upload Image</h2>
                
                {!selectedImage ? (
                  <label className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center text-center p-6">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="font-medium mb-1">Click to upload</p>
                      <p className="text-sm text-muted-foreground">or drag and drop</p>
                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative h-64 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={selectedImage}
                      alt="Selected skin image"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Guidelines */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Guidelines</h2>
                <ul className="space-y-3">
                  {[
                    "Use good lighting for clear visibility",
                    "Focus on the affected area",
                    "Include some surrounding healthy skin",
                    "Avoid blurry or dark images",
                    "Remove any jewelry or accessories",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">Disclaimer</p>
                      <p className="text-amber-700 dark:text-amber-300 mt-1">
                        This is for educational purposes only. Always consult a healthcare professional for proper diagnosis.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                onClick={handleDetect}
                disabled={!selectedImage || loading}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 px-12"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Stethoscope className="mr-2 h-5 w-5" />
                    Analyze Image
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Results Section */}
          {result && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Main Result */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 card-shadow">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                        AI Detection Result
                      </span>
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {result.confidence}% confidence
                      </span>
                    </div>
                    <h2 className="text-2xl font-display font-bold">{result.disease}</h2>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{result.description}</p>

                {/* Symptoms */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                    Common Symptoms
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.symptoms.map((symptom, i) => (
                      <span key={i} className="px-3 py-1 text-sm rounded-full bg-muted">
                        {symptom}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Remedies */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    Recommended Remedies
                  </h3>
                  <ul className="space-y-2">
                    {result.remedies.map((remedy, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {remedy}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* When to see doctor */}
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <h3 className="font-semibold mb-2 flex items-center gap-2 text-red-800 dark:text-red-200">
                    <Stethoscope className="h-4 w-4" />
                    When to See a Doctor
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{result.whenToSeeDoctor}</p>
                </div>
              </div>

              {/* Prevention Tips */}
              <div className="bg-card rounded-2xl border border-border p-6 md:p-8 card-shadow">
                <h3 className="font-semibold mb-4">Prevention Tips</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {result.prevention.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary">{i + 1}</span>
                      </div>
                      <span className="text-sm">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-primary rounded-2xl p-6 md:p-8 text-primary-foreground">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Need Professional Help?</h3>
                    <p className="text-primary-foreground/80">
                      Book an appointment with a dermatologist in your area
                    </p>
                  </div>
                  <Link to="/doctors">
                    <Button variant="secondary" size="lg">
                      <Calendar className="mr-2 h-5 w-5" />
                      Find Doctors
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
