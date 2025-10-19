import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, User, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getUserAvatarUrl } from '@/utils/imageUtils';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const SearchBar = ({ className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API}/users/search?q=${encodeURIComponent(query)}&limit=8`);
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delaySearch);
  }, [query]);

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`);
    setQuery('');
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-10 pr-10 w-full bg-white border-slate-300 focus:border-slate-400 focus:ring-slate-300"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden z-50 max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              <User className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No users found</p>
              <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Users ({results.length})
              </div>
              {results.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserClick(user.username)}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-slate-50 transition-colors text-left group"
                >
                  {/* Avatar */}
                  <Avatar className="w-10 h-10 ring-2 ring-slate-100 group-hover:ring-slate-200 transition-all">
                    {user.avatar ? (
                      <img src={getUserAvatarUrl({ avatar: user.avatar })} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-semibold">
                        {user.username[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 truncate group-hover:text-slate-900">
                      {user.name || user.username}
                    </p>
                    <p className="text-sm text-slate-500 truncate">@{user.username}</p>
                    {user.bio && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">{user.bio}</p>
                    )}
                  </div>

                  {/* Follow Status */}
                  {user.is_following && (
                    <div className="flex-shrink-0">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                        Following
                      </span>
                    </div>
                  )}

                  {/* Followers Count */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-500">
                      {user.followers_count || 0} followers
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
