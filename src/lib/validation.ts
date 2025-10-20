import { z } from "zod";

// Username validation: alphanumeric, underscore, 3-30 characters
export const usernameSchema = z.string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters" })
  .max(30, { message: "Username must be less than 30 characters" })
  .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" });

// Email validation
export const emailSchema = z.string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255, { message: "Email must be less than 255 characters" });

// Password validation
export const passwordSchema = z.string()
  .min(6, { message: "Password must be at least 6 characters" })
  .max(100, { message: "Password must be less than 100 characters" });

// Post title validation
export const postTitleSchema = z.string()
  .trim()
  .min(1, { message: "Title cannot be empty" })
  .max(200, { message: "Title must be less than 200 characters" });

// Post prompt validation
export const postPromptSchema = z.string()
  .trim()
  .min(1, { message: "Prompt cannot be empty" })
  .max(5000, { message: "Prompt must be less than 5000 characters" });

// Comment validation
export const commentSchema = z.string()
  .trim()
  .min(1, { message: "Comment cannot be empty" })
  .max(2000, { message: "Comment must be less than 2000 characters" });

// Image file validation
export const imageFileSchema = z.instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, { message: "Image must be less than 10MB" })
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
    { message: "Only JPEG, PNG, GIF, and WebP images are allowed" }
  );

// Auth form schemas
export const signUpSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// Post form schema
export const createPostSchema = z.object({
  title: postTitleSchema,
  prompt: postPromptSchema,
  image: imageFileSchema,
});

export const editPostSchema = z.object({
  title: postTitleSchema,
  prompt: postPromptSchema,
  image: imageFileSchema.optional(),
});

// Comment form schema
export const createCommentSchema = z.object({
  content: commentSchema,
});
