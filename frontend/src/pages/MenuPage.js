import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, User, UserPlus, Settings, HelpCircle, Shield, Mail, LogOut, Search, Star, Zap, Moon } from "lucide-react";
import { getUserAvatarUrl } from "@/utils/imageUtils";

export const MenuPage = ({ user, logout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-slate-300/30 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-gradient-to-tl from-slate-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-slate-200/30 to-slate-300/30 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-lg border-b border-slate-200/50 px-4 sm:px-6 py-4 flex items-center justify-between shadow-lg z-10">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 rounded-2xl hover:bg-slate-100/70 transition-all duration-300 hover:scale-105 group"
          >
            <ArrowLeft className="w-6 h-6 text-slate-600 group-hover:text-slate-700" />
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">Menu</h1>
            <div className="ml-2 w-2 h-2 bg-gradient-to-r from-slate-500 to-slate-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex items-center justify-center">
          <Moon className="w-4 h-4 text-slate-600" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* User Profile Card */}
        <Link 
          to={`/profile/${user.username}`}
          className="block bg-white/70 backdrop-blur-lg rounded-3xl p-6 mb-6 hover:shadow-2xl transition-all duration-500 border border-slate-200/50 hover:border-slate-300/70 hover:scale-[1.02] group relative overflow-hidden"
        >
          {/* Card Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex items-center space-x-4">
            <div className="relative">
              <Avatar className="w-20 h-20 ring-4 ring-white/80 shadow-xl">
                {getUserAvatarUrl(user) ? (
                  <img src={getUserAvatarUrl(user)} alt={user.name || user.username} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white text-2xl font-bold">
                    {(user.name || user.username)[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-400 to-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-xl text-slate-800">{user.name || user.username}</p>
              <p className="text-sm text-slate-600 flex items-center">
                @{user.username}
                <Star className="w-3 h-3 text-slate-400 ml-2" />
              </p>
              <p className="text-xs text-slate-500 mt-1 bg-slate-100/70 px-2 py-1 rounded-lg inline-block">{user.email}</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <span className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">View Profile</span>
            </div>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
            <Input 
              type="text" 
              placeholder="Search PenLink..." 
              className="pl-12 py-6 text-base bg-white/70 backdrop-blur-sm border-slate-200/50 rounded-2xl focus:border-slate-400 focus:ring-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300 placeholder:text-slate-400" 
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <Zap className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        </div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {/* Primary Actions */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-100/50 to-transparent p-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Personal</h3>
            </div>
            
            <Link 
              to={`/profile/${user.username}`}
              className="flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 border-b border-slate-100/50 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">My Profile</p>
                <p className="text-sm text-slate-500">View and edit your profile</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <button 
              className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 border-b border-slate-100/50 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-800 text-base">Create Group</p>
                <p className="text-sm text-slate-500">Start a new community</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>

            <Link 
              to="/settings"
              className="flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500/20 to-teal-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Settings className="w-6 h-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">Settings</p>
                <p className="text-sm text-slate-500">Privacy and account settings</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Support & Info */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-100/50 to-transparent p-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Support & Legal</h3>
            </div>
            
            <Link 
              to="/help"
              className="flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 border-b border-slate-100/50 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <HelpCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">Help & Support</p>
                <p className="text-sm text-slate-500">Get help and contact us</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link 
              to="/privacy"
              className="flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 border-b border-slate-100/50 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">Privacy Policy</p>
                <p className="text-sm text-slate-500">Review our terms and policies</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            <Link 
              to="/feedback"
              className="flex items-center space-x-4 px-6 py-5 hover:bg-slate-50/70 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-pink-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Mail className="w-6 h-6 text-pink-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-base">Feedback</p>
                <p className="text-sm text-slate-500">Share your thoughts with us</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Account Actions */}
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-xl border border-slate-200/50 overflow-hidden">
            <div className="bg-gradient-to-r from-red-50/50 to-transparent p-4">
              <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wider">Account</h3>
            </div>
            
            <button 
              onClick={logout}
              className="w-full flex items-center space-x-4 px-6 py-5 hover:bg-red-50/70 transition-all duration-300 group" 
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500/20 to-red-600/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-red-600 text-base">Sign Out</p>
                <p className="text-sm text-red-500">Sign out of your account</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom Padding */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};