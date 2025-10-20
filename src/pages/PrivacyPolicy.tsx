import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="prose prose-invert max-w-none space-y-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              We collect information you provide directly to us when you create an account, upload images, 
              or interact with our platform. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Account information (email address, username)</li>
              <li>Profile information and preferences</li>
              <li>Images and content you upload</li>
              <li>Prompts and descriptions associated with your posts</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and display your uploaded content</li>
              <li>Enable social features like following and viewing posts</li>
              <li>Send you technical notices and support messages</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Information Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell your personal information. We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>With your consent or at your direction</li>
              <li>With service providers who assist in operating our platform</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud or abuse</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Content You Share</h2>
            <p className="text-muted-foreground">
              When you post content on AI Gallery, it becomes publicly visible. This includes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Images you upload</li>
              <li>Titles, descriptions, and prompts</li>
              <li>Your username and profile information</li>
              <li>View counts and engagement metrics</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your personal 
              information. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Access and update your personal information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of promotional communications</li>
              <li>Request a copy of your data</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Cookies and Tracking</h2>
            <p className="text-muted-foreground">
              We use cookies and similar technologies to provide and improve our services, analyze usage, 
              and personalize content. You can control cookies through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this privacy policy from time to time. We will notify you of any changes by 
              posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this privacy policy, please contact us at privacy@aigallery.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
