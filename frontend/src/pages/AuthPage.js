import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { FileText, Users, TrendingUp, Sparkles, User, MessageCircle, ChevronRight } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AuthPage = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin
        ? { email, password }
        : { email, password, username };

      const response = await axios.post(`${API}${endpoint}`, data);
      onLogin(response.data.token, response.data.user);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-slate-200/30 to-slate-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-br from-slate-300/20 to-slate-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-br from-slate-200/40 to-slate-300/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float-slow"></div>
      </div>

      {/* Futuristic Header */}
      <header className="relative z-10 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Animated Logo */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 via-slate-700 to-slate-600 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
                  <span className="text-white font-bold text-2xl animate-pulse">P</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 opacity-20 blur-lg animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 bg-clip-text text-transparent">
                  PenLink
                </h1>
                <p className="text-sm text-slate-500 font-medium">Where thoughts meet community</p>
              </div>
            </div>
            
            {/* Live Status Indicator */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600">Live Platform</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-100px)] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Enhanced Branding */}
            <div className="hidden lg:block">
              <div className="max-w-lg space-y-8">
                {/* Main Heading */}
                <div className="space-y-4">
                  <h2 className="text-5xl font-bold text-slate-800 leading-tight">
                    Where thoughts meet 
                    <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
                      community
                    </span>
                  </h2>
                  
                  <p className="text-xl text-slate-600 leading-relaxed">
                    PenLink bridges professional blogging with social connection. Share expertise, engage in conversations, and build meaningful relationships.
                  </p>
                </div>

                {/* Feature Highlights Card */}
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-200/50 shadow-xl">
                  <h3 className="font-bold text-slate-800 text-xl mb-6 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    What makes us special?
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Hybrid Platform:</span>
                        <span className="text-slate-600 ml-1">Long-form blogs + quick social posts unified</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Smart Discovery:</span>
                        <span className="text-slate-600 ml-1">AI-powered trending finds the best content</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">Creator Focus:</span>
                        <span className="text-slate-600 ml-1">Purpose-built for writers and thought leaders</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Cards */}
                <div className="grid gap-6">
                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Rich Blogging</h3>
                      <p className="text-slate-600">Create beautiful posts with advanced formatting</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Social Connection</h3>
                      <p className="text-slate-600">Build meaningful relationships with creators</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 p-4 bg-white/40 backdrop-blur-sm rounded-xl border border-slate-200/30 hover:bg-white/60 transition-all duration-300 group">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">Trending Discovery</h3>
                      <p className="text-slate-600">Stay updated with popular conversations</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Enhanced Auth Form */}
            <div className="w-full flex flex-col items-center justify-center">
              {/* Enhanced Mobile Hero Section */}
              <div className="lg:hidden w-full max-w-md mb-8">
                <div className="text-center mb-8">
                  <div className="mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-2xl mx-auto mb-4">
                      <span className="text-white font-bold text-2xl">P</span>
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-3">
                      Where thoughts meet 
                      <span className="bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">community</span>
                    </h2>
                    <p className="text-base text-slate-600 leading-relaxed">
                      Share expertise through blogs, engage in conversations, and connect with creators worldwide.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-4 mb-8">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800">Rich Blogging</h3>
                    </div>
                    <p className="text-sm text-slate-600">Create beautiful posts with advanced formatting</p>
                  </div>

                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-5 border border-slate-200/50 shadow-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shadow-lg">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-800">Social Connect</h3>
                    </div>
                    <p className="text-sm text-slate-600">Build meaningful relationships with creators</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Auth Card */}
              <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-lg shadow-2xl border border-slate-200/50 rounded-3xl overflow-hidden">
                  {/* Card Header with Gradient */}
                  <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 px-8 py-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <User className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        {isLogin ? 'Welcome back!' : 'Join PenLink'}
                      </h3>
                      <p className="text-slate-200 text-base">
                        {isLogin 
                          ? 'Sign in to continue your journey' 
                          : 'Create your account and start sharing'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Form Content */}
                  <div className="px-8 py-8 space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {!isLogin && (
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-sm font-semibold text-slate-700 flex items-center">
                            <User className="w-4 h-4 mr-2 text-slate-600" />
                            Username
                          </Label>
                          <Input
                            id="username"
                            placeholder="Choose your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                            data-testid="username-input"
                          />
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-slate-600" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                          data-testid="email-input"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-semibold text-slate-700 flex items-center">
                          <div className="w-4 h-4 mr-2 text-slate-600 flex items-center justify-center">
                            <div className="w-3 h-3 border-2 border-slate-600 rounded-sm"></div>
                          </div>
                          Password
                        </Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Create a secure password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="h-12 text-base border-slate-300 focus:border-slate-500 focus:ring-slate-500 bg-white/80 backdrop-blur-sm"
                          data-testid="password-input"
                        />
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full h-12 text-base font-semibold bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105 shadow-lg" 
                        disabled={loading} 
                        data-testid="auth-submit-btn"
                      >
                        {loading ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Please wait...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </Button>
                    </form>

                    <div className="text-center pt-4 border-t border-slate-200">
                      <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-base text-slate-600 hover:text-slate-800 font-medium hover:underline transition-colors flex items-center justify-center space-x-2 mx-auto"
                        data-testid="toggle-auth-btn"
                      >
                        <span>
                          {isLogin 
                            ? "Don't have an account? Sign up" 
                            : 'Already have an account? Sign in'
                          }
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add custom animations to the global styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(-5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(3deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;