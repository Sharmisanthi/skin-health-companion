import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { DISEASE_CATEGORIES } from "@/lib/constants";
import { ArrowLeft, Camera, Info, Stethoscope } from "lucide-react";

export default function CategoryDetail() {
  const { categoryId } = useParams();
  const category = DISEASE_CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Link to="/categories">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getAllDiseases = () => {
    if (category.subcategories) {
      return category.subcategories.flatMap((sub) =>
        sub.diseases.map((disease) => ({ name: disease, subcategory: sub.name }))
      );
    }
    return category.diseases?.map((disease) => ({ name: disease, subcategory: null })) || [];
  };

  const diseases = getAllDiseases();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container py-12">
        <Link
          to="/categories"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Categories
        </Link>

        <div className="max-w-4xl">
          <div className="flex items-start gap-4 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary flex-shrink-0">
              <Stethoscope className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-lg text-muted-foreground">{category.description}</p>
            </div>
          </div>

          <div className="flex gap-4 mb-12">
            <Link to="/detect">
              <Button className="bg-gradient-primary hover:opacity-90">
                <Camera className="mr-2 h-4 w-4" />
                Detect Disease
              </Button>
            </Link>
            <Link to="/doctors">
              <Button variant="outline">
                Find Specialists
              </Button>
            </Link>
          </div>

          {category.subcategories ? (
            <div className="space-y-8">
              {category.subcategories.map((sub, index) => (
                <div key={index}>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    {sub.name} Diseases
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sub.diseases.map((disease, i) => (
                      <DiseaseCard key={i} name={disease} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diseases.map((disease, i) => (
                <DiseaseCard key={i} name={disease.name} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DiseaseCard({ name }: { name: string }) {
  return (
    <Link
      to={`/detect?disease=${encodeURIComponent(name)}`}
      className="group p-5 rounded-xl bg-card border border-border card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium group-hover:text-primary transition-colors">{name}</h3>
        <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Click to detect or learn more
      </p>
    </Link>
  );
}
