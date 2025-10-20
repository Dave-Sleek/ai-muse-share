import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { usernameSchema, emailSchema, passwordSchema } from "@/lib/validation";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/gallery");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!isForgotPassword) {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          throw new Error(emailResult.error.errors[0].message);
        }

        if (!isForgotPassword) {
          const passwordResult = passwordSchema.safeParse(password);
          if (!passwordResult.success) {
            throw new Error(passwordResult.error.errors[0].message);
          }
        }

        if (isSignUp) {
          const usernameResult = usernameSchema.safeParse(username);
          if (!usernameResult.success) {
            throw new Error(usernameResult.error.errors[0].message);
          }
        }
      } else {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          throw new Error(emailResult.error.errors[0].message);
        }
      }

      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });

        if (error) throw error;

        toast({
          title: "Check your email",
          description: "We sent you a password reset link.",
        });
        setIsForgotPassword(false);
      } else if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Account created successfully. You can now sign in.",
        });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate("/gallery");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-effect rounded-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold">
              {isForgotPassword ? "Reset Password" : isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-muted-foreground">
              {isForgotPassword
                ? "Enter your email to receive a reset link"
                : isSignUp
                ? "Join the AI art community"
                : "Sign in to share your AI creations"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>

            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-background/50"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Loading..." : isForgotPassword ? "Send Reset Link" : isSignUp ? "Sign Up" : "Sign In"}
            </Button>
          </form>

          <div className="text-center space-y-2">
            {!isForgotPassword && !isSignUp && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors block w-full"
              >
                Forgot password?
              </button>
            )}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setIsForgotPassword(false);
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : isForgotPassword
                ? "Back to sign in"
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
