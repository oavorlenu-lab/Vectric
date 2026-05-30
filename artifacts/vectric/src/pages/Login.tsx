import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useLoginUser, useRegisterUser, useGetSettings } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PublicLayout } from "@/components/layout/PublicLayout";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [, setLocation] = useLocation();

  const loginUser = useLoginUser();
  const registerUser = useRegisterUser();
  const { data: settings } = useGetSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      loginUser.mutate(
        { data: { username: email, password } },
        {
          onSuccess: () => {
            toast.success("Logged in successfully");
            setLocation("/");
          },
          onError: () => toast.error("Invalid credentials"),
        }
      );
    } else {
      registerUser.mutate(
        { data: { email, password, username } },
        {
          onSuccess: () => {
            toast.success("Registered successfully. Please log in.");
            setIsLogin(true);
          },
          onError: () => toast.error("Registration failed. Email or username might be taken."),
        }
      );
    }
  };

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-20 flex justify-center min-h-[70vh]">
        <div className="w-full max-w-md bg-card p-8 rounded-xl shadow-lg border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold mb-2">
              {isLogin ? "Welcome Back" : "Join Vectric"}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? "Sign in to interact with stories" 
                : "Create an account to save your favorite stories"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <Link href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full font-bold" 
              disabled={loginUser.isPending || registerUser.isPending}
            >
              {isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          {settings?.enableUserRegistration !== false && (
            <div className="mt-8 text-center text-sm">
              <span className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </span>{" "}
              <button
                type="button"
                className="text-primary font-medium hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Sign up" : "Log in"}
              </button>
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
