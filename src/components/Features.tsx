import { Share2, Heart, MessageCircle, Sparkles } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Share AI Art",
    description: "Post your AI-generated masterpieces and inspire the community with your creative prompts.",
  },
  {
    icon: Share2,
    title: "Social Sharing",
    description: "Share prompts across all major social platforms and grow your creative network.",
  },
  {
    icon: Heart,
    title: "Like & Collect",
    description: "Save your favorite prompts and images, build collections that inspire you.",
  },
  {
    icon: MessageCircle,
    title: "Engage & Discuss",
    description: "Comment on posts, discuss techniques, and learn from fellow AI artists.",
  },
];

const Features = () => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to{" "}
            <span className="gradient-text">Share Your Vision</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A complete platform designed for AI artists to showcase, share, and collaborate
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="glass-effect p-6 rounded-2xl hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
