import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../../store/auth.store";
import { Loader2, Mail, Lock, Shield, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const { login, signup, isLoading, error } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success("Login successful!");
    } else {
      toast.error(error || "Invalid email or password");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    const success = await signup(email, password, fullName);
    if (success) {
      toast.success("Account created successfully!");
    } else {
      toast.error(error || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-white dark:bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent mb-4">
            <Shield className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="text-3xl font-medium mb-2">BlackMatter ERP</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>

        {/* Login/Signup Card */}
        <div className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-lg">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl mb-6">
              <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-lg">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="login-email" className="text-sm font-medium mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="login-password" className="text-sm font-medium mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-accent hover:text-accent/80 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full rounded-xl h-12 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
              </form>
            </TabsContent>

            {/* Signup Tab */}
            <TabsContent value="signup">
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <Label htmlFor="signup-name" className="text-sm font-medium mb-2 block">
                    Full Name (Optional)
                  </Label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-email" className="text-sm font-medium mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="signup-password" className="text-sm font-medium mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 rounded-xl h-12"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Password must be at least 6 characters
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !email || !password || password.length < 6}
                  className="w-full rounded-xl h-12 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>

                {error && (
                  <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                    {error}
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}
