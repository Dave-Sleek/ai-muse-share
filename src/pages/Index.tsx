import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import PostsCarousel from "@/components/PostsCarousel";
import FeaturedTemplates from "@/components/FeaturedTemplates";
import SuggestedUsers from "@/components/SuggestedUsers";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <PostsCarousel />
      <FeaturedTemplates />
      <SuggestedUsers />
      <Features />
      <Footer />
      <CookieConsent />
    </div>
  );
};

export default Index;
