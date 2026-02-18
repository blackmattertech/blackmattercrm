import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuthStore } from "../../store/auth.store";
import { Loader2, Mail, Lock, UserPlus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { testApiConnection } from "../../lib/api";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ testing: boolean; success: boolean | null; message: string }>({
    testing: false,
    success: null,
    message: '',
  });

  const { login, signup, isLoading, error } = useAuthStore();

  // Test backend connection on mount
  useEffect(() => {
    const testConnection = async () => {
      setConnectionStatus({ testing: true, success: null, message: 'Testing connection...' });
      const result = await testApiConnection();
      setConnectionStatus({
        testing: false,
        success: result.success,
        message: result.message,
      });
      
      if (!result.success) {
        console.error('[Login] Backend connection test failed:', result);
      } else {
        console.log('[Login] Backend connection test passed:', result);
      }
    };
    
    testConnection();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    const success = await login(email, password, rememberMe);
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
      toast.success("Account created! Please wait for admin approval before logging in.");
      // Reset form
      setEmail("");
      setPassword("");
      setFullName("");
      // Switch to login tab
      setTimeout(() => {
        const loginTab = document.querySelector('[value="login"]') as HTMLElement;
        if (loginTab) loginTab.click();
      }, 2000);
    } else {
      toast.error(error || "Failed to create account");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-soft-white dark:bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
            <img 
              src="/scissorlogo.png" 
              alt="BlackMatter ERP Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h1 className="text-3xl font-medium mb-2">BlackMatter ERP</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account
          </p>
          {/* Connection Status */}
          {connectionStatus.testing ? (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {connectionStatus.message}
            </div>
          ) : connectionStatus.success === false ? (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium mb-1">Connection Issue</p>
                <p className="text-xs">{connectionStatus.message}</p>
                <p className="text-xs mt-2">Make sure backend is running: <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded">npm run dev</code></p>
                <p className="text-xs mt-1">
                  If backend is on different IP, configure it: <br/>
                  <code className="bg-red-100 dark:bg-red-900/30 px-1 rounded text-xs">
                    localStorage.setItem('backend_ip', '192.168.1.39')
                  </code>
                  <br/>
                  <span className="text-xs text-muted-foreground">Then refresh the page</span>
                </p>
              </div>
            </div>
          ) : connectionStatus.success === true ? (
            <div className="mt-4 p-2 bg-logo-pale dark:bg-logo-primary/20 border border-logo-light dark:border-logo-light/50 rounded-lg text-xs text-logo-primary dark:text-logo-light flex items-center gap-2">
              <div className="w-2 h-2 bg-logo-primary rounded-full"></div>
              Backend connected
            </div>
          ) : null}
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
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
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
