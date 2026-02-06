import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { DISEASE_CATEGORIES } from "@/lib/constants";
import { 
  Bug, 
  Flame, 
  Droplet, 
  Palette, 
  Dna, 
  Shield, 
  Scissors, 
  Hand, 
  AlertTriangle, 
  MoreHorizontal,
  ArrowRight,
  ChevronRight
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Bug,
  Flame,
  Droplet,
  Palette,
  Dna,
  Shield,
  Scissors,
  Hand,
  AlertTriangle,
  MoreHorizontal,
};

export default function Categories() {
  const getDiseaseCount = (category: typeof DISEASE_CATEGORIES[0]) => {
    if (category.subcategories) {
      return category.subcategories.reduce((acc, sub) => acc + sub.diseases.length, 0);
    }
    return category.diseases?.length || 0;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container py-12">
        <div className="max-w-3xl mb-12">
          <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Disease Categories
          </h1>
          <p className="text-lg text-muted-foreground">
            Explore our comprehensive database of skin conditions organized by category. 
            Select a category to learn more about specific conditions and their treatments.
          </p>
        </div>

        <div className="grid gap-6">
          {DISEASE_CATEGORIES.map((category, index) => {
            const IconComponent = iconMap[category.icon] || Bug;
            const diseaseCount = getDiseaseCount(category);
            
            return (
              <Link
                key={category.id}
                to={`/categories/${category.id}`}
                className="group relative overflow-hidden rounded-2xl bg-card border border-border p-6 md:p-8 card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <IconComponent className="h-7 w-7 text-primary-foreground" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h2>
                        <p className="text-muted-foreground mb-3">
                          {category.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories ? (
                        category.subcategories.slice(0, 4).map((sub, i) => (
                          <span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                            {sub.name} ({sub.diseases.length})
                          </span>
                        ))
                      ) : (
                        category.diseases?.slice(0, 5).map((disease, i) => (
                          <span key={i} className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                            {disease}
                          </span>
                        ))
                      )}
                      {diseaseCount > 5 && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
                          +{diseaseCount - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
