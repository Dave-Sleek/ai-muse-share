import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Sparkles, Image, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

const HowToUse = () => {
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

        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold gradient-text">How to Use AI Gallery</h1>
            <p className="text-muted-foreground text-lg">
              Learn how to share your AI-generated images and discover amazing artwork
            </p>
          </div>

          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Step 1: Generate Your AI Image
              </CardTitle>
              <CardDescription>
                Use ChatGPT or Gemini to create stunning AI-generated images
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Using ChatGPT:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Go to <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">chat.openai.com</a></li>
                  <li>Copy the prompt from our gallery or create your own</li>
                  <li>Paste it into ChatGPT and ask it to generate an image</li>
                  <li>Download the generated image to your device</li>
                </ol>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Using Google Gemini:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                  <li>Go to <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">gemini.google.com</a></li>
                  <li>Copy the prompt from our gallery</li>
                  <li>Paste it into Gemini and request image generation</li>
                  <li>Save the generated image</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5 text-secondary" />
                Step 2: Share Your Creation
              </CardTitle>
              <CardDescription>
                Upload your AI-generated image to the gallery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Click on "Create" in the navigation menu</li>
                <li>Upload your AI-generated image</li>
                <li>Add a title and description</li>
                <li>Include the prompt you used (this helps others recreate similar images)</li>
                <li>Click "Publish" to share with the community</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-accent" />
                Step 3: Discover & Copy Prompts
              </CardTitle>
              <CardDescription>
                Browse the gallery and use prompts from other creators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Browse the gallery to find images you like</li>
                <li>Click on an image to view full details</li>
                <li>Click the "Copy Prompt" button to copy the prompt</li>
                <li>Use the copied prompt in ChatGPT or Gemini</li>
                <li>Generate your own unique version of the image</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-primary" />
                Step 4: Engage with the Community
              </CardTitle>
              <CardDescription>
                Follow creators and discover new content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-4">
                <li>Follow other creators to see their latest work</li>
                <li>Check the "Discover" page for suggested users to follow</li>
                <li>View your profile to see your follower count and post statistics</li>
                <li>Track how many views your posts are getting</li>
              </ul>
            </CardContent>
          </Card>

          <div className="text-center pt-8">
            <h3 className="text-xl font-semibold mb-4">Ready to get started?</h3>
            <div className="flex gap-4 justify-center">
              <Link to="/gallery">
                <Button size="lg">Browse Gallery</Button>
              </Link>
              <Link to="/create">
                <Button size="lg" variant="outline">Create Post</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToUse;
