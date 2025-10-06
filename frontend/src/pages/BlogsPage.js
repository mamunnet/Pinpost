import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FileText } from "lucide-react";
import { BlogCard } from "@/components/BlogCard";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

// AdCard component for enhanced ad placement
const AdCard = ({ adIndex }) => (
  <div className="text-center p-8">
    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <span className="text-white font-bold text-xl">Ad</span>
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">Advertisement Space #{adIndex + 1}</h3>
    <p className="text-slate-600 text-sm">Your targeted ad content could appear here</p>
  </div>
);

export const BlogsPage = ({ user }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const response = await axios.get(`${API}/blogs`);
      setBlogs(response.data);
    } catch (error) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (blog) => {
    try {
      if (blog.liked_by_user) {
        await axios.delete(`${API}/likes/blog/${blog.id}`);
      } else {
        await axios.post(`${API}/likes/blog/${blog.id}`);
      }
      fetchBlogs();
    } catch (error) {
      toast.error('Failed to update like');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Futuristic Header */}
        <div className="relative mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 rounded-2xl p-6 sm:p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-y-1"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-white/20 to-white/5 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Blog Articles</h1>
                  <p className="text-slate-200 text-sm sm:text-base">Discover thoughtful long-form content</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-slate-200 text-sm">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Fresh Articles
                </span>
                <span>•</span>
                <span>{blogs.length} articles available</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Blog Grid */}
        {blogs.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 text-center py-16 px-8">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">No articles yet</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
              Be the first to share your thoughts and expertise with the community through a detailed blog article.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <div key={blog.id} className="group">
                {/* Enhanced Blog Card Container */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 hover:border-slate-300/50 transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 overflow-hidden group-hover:transform group-hover:scale-105">
                  <BlogCard blog={blog} onLike={() => handleLike(blog)} compact />
                </div>
                
                {/* Enhanced Ad Placement */}
                {(index + 1) % 6 === 0 && index < blogs.length - 1 && (
                  <div className="md:col-span-2 lg:col-span-3 mt-8">
                    <div className="bg-gradient-to-r from-slate-100 to-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-8">
                      <AdCard adIndex={Math.floor(index / 6)} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogsPage;