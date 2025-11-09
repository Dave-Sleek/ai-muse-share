import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import { User } from "@supabase/supabase-js";
import { postTitleSchema, postPromptSchema, imageFileSchema } from "@/lib/validation";

const CreatePost = () => {
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tags, setTags] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const AI_MODELS = [
    "Midjourney",
    "DALL-E 3",
    "DALL-E 2",
    "Stable Diffusion",
    "Stable Diffusion XL",
    "Leonardo AI",
    "Adobe Firefly",
    "Google Imagen",
    "Flux",
    "Other"
  ];

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    // Check if we're remixing a template
    if (location.state) {
      const { templateId: tid, prompt: p, title: t, aiModel: am } = location.state as any;
      if (tid) {
        setTemplateId(tid);
        setPrompt(p || "");
        setTitle(t || "");
        setAiModel(am || "");
      }
    }

    return () => subscription.unsubscribe();
  }, [navigate, location]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile || !title.trim() || !prompt.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields and select an image",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Validate inputs
      const titleResult = postTitleSchema.safeParse(title);
      if (!titleResult.success) {
        throw new Error(titleResult.error.errors[0].message);
      }

      const promptResult = postPromptSchema.safeParse(prompt);
      if (!promptResult.success) {
        throw new Error(promptResult.error.errors[0].message);
      }

      const imageResult = imageFileSchema.safeParse(imageFile);
      if (!imageResult.success) {
        throw new Error(imageResult.error.errors[0].message);
      }
      // Upload image to storage
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("post-images")
        .getPublicUrl(fileName);

      // Parse tags
      const tagsArray = tags
        .split(",")
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10); // Limit to 10 tags

      // Create post
      const { data: newPost, error: insertError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          title,
          prompt,
          image_url: publicUrl,
          tags: tagsArray,
          ai_model: aiModel || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // If this is a remix, create the remix record
      if (templateId && newPost) {
        await supabase
          .from("post_remixes")
          .insert({
            post_id: newPost.id,
            template_id: templateId,
            user_id: user.id,
          });
      }

      toast({
        title: "Success!",
        description: templateId ? "Your remix has been created" : "Your post has been created",
      });
      
      navigate("/gallery");
    } catch (error: any) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="glass-effect rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create Post</h1>
                <p className="text-muted-foreground">Share your AI art with the community</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image">Image *</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="image" className="cursor-pointer">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload an image
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your creation a title"
                  required
                  className="bg-background/50"
                />
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Prompt *</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Share the prompt you used to generate this image"
                  required
                  rows={4}
                  className="bg-background/50"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags / Categories</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g., cyberpunk, anime, photorealistic (comma-separated, max 10)"
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">
                  Add up to 10 tags to help others discover your work. Separate with commas.
                </p>
              </div>

              {/* AI Model */}
              <div className="space-y-2">
                <Label htmlFor="aiModel">AI Tool Used</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger id="aiModel" className="bg-background/50">
                    <SelectValue placeholder="Select AI tool (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {AI_MODELS.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Help others discover what tools work best for different styles.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Create Post
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
