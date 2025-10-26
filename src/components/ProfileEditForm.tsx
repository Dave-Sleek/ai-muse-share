import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateUsername } from "@/lib/validation";

const profileSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  location: z.string().max(100, "Location must be less than 100 characters").optional(),
  twitter: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagram: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  currentProfile: {
    username: string;
    bio?: string | null;
    location?: string | null;
    social_links?: any;
  };
  userId: string;
  onSuccess: () => void;
}

export const ProfileEditForm = ({ currentProfile, userId, onSuccess }: ProfileEditFormProps) => {
  const { toast } = useToast();
  
  const socialLinks = currentProfile.social_links || {};
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: currentProfile.username,
      bio: currentProfile.bio || "",
      location: currentProfile.location || "",
      twitter: socialLinks.twitter || "",
      instagram: socialLinks.instagram || "",
      linkedin: socialLinks.linkedin || "",
      website: socialLinks.website || "",
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      // Check if username is available (if changed)
      if (data.username !== currentProfile.username) {
        const isAvailable = await validateUsername(data.username);
        if (!isAvailable) {
          toast({
            title: "Username taken",
            description: "This username is already in use. Please choose another.",
            variant: "destructive",
          });
          return;
        }
      }

      // Prepare social links object
      const social_links: any = {};
      if (data.twitter) social_links.twitter = data.twitter;
      if (data.instagram) social_links.instagram = data.instagram;
      if (data.linkedin) social_links.linkedin = data.linkedin;
      if (data.website) social_links.website = data.website;

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          username: data.username,
          bio: data.bio || null,
          location: data.location || null,
          social_links,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          {...register("username")}
          placeholder="Enter your username"
        />
        {errors.username && (
          <p className="text-sm text-destructive">{errors.username.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          {...register("bio")}
          placeholder="Tell us about yourself"
          rows={4}
        />
        {errors.bio && (
          <p className="text-sm text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          {...register("location")}
          placeholder="City, Country"
        />
        {errors.location && (
          <p className="text-sm text-destructive">{errors.location.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Social Media Links</h3>
        
        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter / X</Label>
          <Input
            id="twitter"
            {...register("twitter")}
            placeholder="https://twitter.com/username"
          />
          {errors.twitter && (
            <p className="text-sm text-destructive">{errors.twitter.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <Input
            id="instagram"
            {...register("instagram")}
            placeholder="https://instagram.com/username"
          />
          {errors.instagram && (
            <p className="text-sm text-destructive">{errors.instagram.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <Input
            id="linkedin"
            {...register("linkedin")}
            placeholder="https://linkedin.com/in/username"
          />
          {errors.linkedin && (
            <p className="text-sm text-destructive">{errors.linkedin.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            {...register("website")}
            placeholder="https://yourwebsite.com"
          />
          {errors.website && (
            <p className="text-sm text-destructive">{errors.website.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
};
