import { ArrowRight } from "lucide-react";

interface ResourceCardProps {
  title: string;
  description: string;
  imageUrl: string;
  linkText: string;
  linkUrl: string;
}

function ResourceCard({ title, description, imageUrl, linkText, linkUrl }: ResourceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-3">{description}</p>
        <a 
          href={linkUrl} 
          className="text-sm text-primary font-medium flex items-center"
        >
          {linkText} <ArrowRight className="ml-1 h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

export default function FeaturedResources() {
  const resources = [
    {
      title: "Anti-Inflammatory Recipe Guide",
      description: "30 easy recipes to reduce inflammation and boost healing",
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=300",
      linkText: "View Guide",
      linkUrl: "/nutrition"
    },
    {
      title: "10-Minute Healing Meditations",
      description: "Quick daily practices to reduce stress and promote healing",
      imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&h=300",
      linkText: "Start Meditation",
      linkUrl: "/mind-body"
    },
    {
      title: "Gentle Movement Series",
      description: "Low-impact exercises designed for treatment recovery",
      imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&h=300",
      linkText: "View Exercises",
      linkUrl: "/movement"
    }
  ];
  
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Featured Resources</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <ResourceCard
            key={index}
            title={resource.title}
            description={resource.description}
            imageUrl={resource.imageUrl}
            linkText={resource.linkText}
            linkUrl={resource.linkUrl}
          />
        ))}
      </div>
    </div>
  );
}
