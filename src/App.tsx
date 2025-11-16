import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Gallery from "./pages/Gallery";
import Auth from "./pages/Auth";
import PostDetail from "./pages/PostDetail";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import Profile from "./pages/Profile";
import Discover from "./pages/Discover";
import Community from "./pages/Community";
import Collections from "./pages/Collections";
import CollectionDetail from "./pages/CollectionDetail";
import Leaderboards from "./pages/Leaderboards";
import Templates from "./pages/Templates";
import Challenges from "./pages/Challenges";
import ChallengeDetail from "./pages/ChallengeDetail";
import HowToUse from "./pages/HowToUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import About from "./components/About";
import CookieConsent from "./components/CookieConsent";
import RouteChangeLoader from "./components/RouteChangeLoader";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteChangeLoader /> {/* 👈 Add this here */}
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gallery" element={<><Gallery /><Footer /><CookieConsent /></>} />
            <Route path="/auth" element={<><Auth /><Footer /><CookieConsent /></>} />
            <Route path="/post/:id" element={<><PostDetail /><Footer /><CookieConsent /></>} />
            <Route path="/create" element={<><CreatePost /><Footer /><CookieConsent /></>} />
            <Route path="/edit/:id" element={<><EditPost /><Footer /><CookieConsent /></>} />
            <Route path="/profile" element={<><Profile /><Footer /><CookieConsent /></>} />
            <Route path="/profile/:userId" element={<><Profile /><Footer /><CookieConsent /></>} />
            <Route path="/discover" element={<><Discover /><Footer /><CookieConsent /></>} />
            <Route path="/community" element={<><Community /><Footer /><CookieConsent /></>} />
            <Route path="/collections" element={<><Collections /><Footer /><CookieConsent /></>} />
            <Route path="/collections/:id" element={<><CollectionDetail /><Footer /><CookieConsent /></>} />
            <Route path="/leaderboards" element={<><Leaderboards /><Footer /><CookieConsent /></>} />
            <Route path="/templates" element={<><Templates /><Footer /><CookieConsent /></>} />
            <Route path="/challenges" element={<><Challenges /><Footer /><CookieConsent /></>} />
            <Route path="/challenges/:id" element={<><ChallengeDetail /><Footer /><CookieConsent /></>} />
            <Route path="/how-to-use" element={<><HowToUse /><Footer /><CookieConsent /></>} />
            <Route path="/privacy-policy" element={<><PrivacyPolicy /><Footer /><CookieConsent /></>} />
            <Route path="/terms-of-use" element={<><TermsOfUse /><Footer /><CookieConsent /></>} />
            <Route path="/about" element={<><About /><Footer /><CookieConsent /></>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider >
);

export default App;
