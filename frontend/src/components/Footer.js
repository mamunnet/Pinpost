import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          
          {/* Brand */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-slate-700 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">PenLink</h3>
              <p className="text-slate-400 text-xs">Where thoughts meet community</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/social" className="hover:text-white transition-colors">Social</Link>
            <Link to="/blogs" className="hover:text-white transition-colors">Blogs</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-3">
            <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
              <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
            </a>
            <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
              <div className="w-4 h-4 bg-sky-400 rounded-sm"></div>
            </a>
            <a href="#" className="w-8 h-8 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors">
              <div className="w-4 h-4 bg-pink-500 rounded-sm"></div>
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-800 mt-6 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-slate-400">
          <p>&copy; 2025 PenLink. All rights reserved.</p>
          <div className="flex items-center mt-2 md:mt-0">
            <span>Built with</span>
            <Heart className="w-4 h-4 text-red-400 mx-1" />
            <span>for creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};