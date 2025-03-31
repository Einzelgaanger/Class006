import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Key, UserCheck, BookOpen, Info, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Redirect } from "wouter";

const loginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  password: z.string().min(1, "Password is required"),
});

const forgotPasswordSchema = z.object({
  name: z.string().min(1, "Name is required"),
  admissionNumber: z.string().min(1, "Admission number is required"),
  secretKey: z.string().min(1, "Secret key provided by administrator is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("login");
  const [resetSuccess, setResetSuccess] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(true);
  
  // Set up form with more flexible login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      name: "",
      admissionNumber: "",
      password: "sds#website", // Pre-fill with default password for convenience
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      name: "",
      admissionNumber: "",
      secretKey: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };
  
  const onForgotPasswordSubmit = async (data: ForgotPasswordValues) => {
    try {
      const response = await apiRequest("POST", "/api/forgot-password", data);
      const result = await response.json();
      
      if (result.success) {
        setResetSuccess(true);
        toast({
          title: "Password Reset",
          description: "Your password has been reset to the default password.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reset password. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  // Playful onboarding UI
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-100 to-indigo-100">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
              Welcome to SDS Year 2 Portal
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              Your hub for academic excellence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <UserCheck className="h-8 w-8 text-green-500" />
                <h3 className="font-medium">Easy Access</h3>
                <p className="text-sm text-muted-foreground">Sign in with your name and admission number</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <h3 className="font-medium">Course Materials</h3>
                <p className="text-sm text-muted-foreground">Access notes, assignments, and past papers</p>
              </div>
              <div className="flex flex-col items-center text-center space-y-2 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <Info className="h-8 w-8 text-indigo-500" />
                <h3 className="font-medium">Track Progress</h3>
                <p className="text-sm text-muted-foreground">Monitor your performance and rankings</p>
              </div>
            </div>
            
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertTitle className="text-amber-700">Login Tip</AlertTitle>
              <AlertDescription className="text-amber-600">
                Use your full name, admission number, and default password: <strong>sds#website</strong>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => setShowOnboarding(false)}
            >
              Get Started
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">SDS Year 2 Group B</CardTitle>
          <CardDescription>Sign in to access your academic portal</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign In</TabsTrigger>
              <TabsTrigger value="forgot-password">Forgot Password</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="admissionNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admission Number</FormLabel>
                        <FormControl>
                          <Input placeholder="ADM123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">Default password: sds#website</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="forgot-password">
              {resetSuccess ? (
                <div className="py-6 space-y-4">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-medium">Password Reset Successful</h3>
                    <p className="text-muted-foreground">
                      Your password has been reset to the default: <strong>sds#website</strong>
                    </p>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      setActiveTab("login");
                      setResetSuccess(false);
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </div>
              ) : (
                <Form {...forgotPasswordForm}>
                  <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 mb-4">
                      <p className="text-sm text-blue-700 flex items-start">
                        <Key className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        To reset your password, enter your details and the administrator provided secret key.
                      </p>
                    </div>
                    
                    <FormField
                      control={forgotPasswordForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={forgotPasswordForm.control}
                      name="admissionNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Admission Number</FormLabel>
                          <FormControl>
                            <Input placeholder="ADM123456" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={forgotPasswordForm.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Administrator Secret Key</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter the secret key provided by admin" 
                              {...field} 
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground mt-1">
                            Contact the administrator for this secret key
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full"
                      variant="outline"
                    >
                      Reset Password
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <div className="px-8 py-4 bg-muted text-center">
          <p className="text-xs text-muted-foreground">
            This is a secure academic portal. Login credentials are provided by your institution.
            <br />If you cannot access your account, please contact the administrator.
          </p>
          {!showOnboarding && (
            <Button 
              variant="link" 
              className="text-xs mt-2 h-auto p-0" 
              onClick={() => setShowOnboarding(true)}
            >
              View Onboarding Guide
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
