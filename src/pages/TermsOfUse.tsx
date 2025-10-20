import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";

const TermsOfUse = () => {
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
            <h1 className="text-4xl font-bold gradient-text mb-4">Terms of Use</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using AI Gallery, you accept and agree to be bound by these Terms of Use. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. User Accounts</h2>
            <p className="text-muted-foreground">
              To use certain features of the platform, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Ensuring your account information is accurate and current</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Content Guidelines</h2>
            <p className="text-muted-foreground">When posting content on AI Gallery, you agree not to:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Upload content that violates intellectual property rights</li>
              <li>Post content that is illegal, harmful, or offensive</li>
              <li>Impersonate others or misrepresent your affiliation</li>
              <li>Share spam, malware, or malicious content</li>
              <li>Violate the privacy rights of others</li>
              <li>Post content that contains explicit or adult material</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. AI-Generated Content</h2>
            <p className="text-muted-foreground">
              AI Gallery is a platform for sharing AI-generated images. By uploading content, you represent that:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>You have the right to share the content</li>
              <li>The content complies with the terms of the AI service used (ChatGPT, Gemini, etc.)</li>
              <li>You understand that AI-generated content may have specific usage restrictions</li>
              <li>You will provide accurate prompts and attribution when required</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. License and Ownership</h2>
            <p className="text-muted-foreground">
              By posting content, you grant AI Gallery a non-exclusive, worldwide, royalty-free license to:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Display, reproduce, and distribute your content on the platform</li>
              <li>Create derivative works for platform operations</li>
              <li>Use your content for promotional purposes</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You retain all ownership rights to your content. Other users may view and use prompts 
              according to fair use principles.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Prohibited Activities</h2>
            <p className="text-muted-foreground">You may not:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Attempt to gain unauthorized access to the platform</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Use automated tools to scrape or collect data</li>
              <li>Reverse engineer or attempt to extract source code</li>
              <li>Use the platform for commercial purposes without permission</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Content Moderation</h2>
            <p className="text-muted-foreground">
              We reserve the right to remove content that violates these terms or is deemed inappropriate. 
              We may also suspend or terminate accounts that repeatedly violate our policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              AI Gallery is provided "as is" without warranties of any kind. We do not guarantee that the 
              service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, AI Gallery shall not be liable for any indirect, 
              incidental, special, or consequential damages arising from your use of the platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these terms at any time. Continued use of the platform after changes constitutes 
              acceptance of the modified terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Termination</h2>
            <p className="text-muted-foreground">
              We reserve the right to suspend or terminate your access to the platform at any time, with or 
              without cause or notice.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Contact Information</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Use, please contact us at legal@aigallery.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
