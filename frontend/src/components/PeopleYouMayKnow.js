import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, Users, TrendingUp, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { getUserAvatarUrl } from '@/utils/imageUtils';
import cache, { CacheTTL } from '@/utils/cache';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const PeopleYouMayKnow = ({ user, limit = 5 }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchSuggestions();
    }
  }, [user]);

  const fetchSuggestions = async () => {
    try {
      // Check cache first
      const cacheKey = 'people_you_may_know';
      const cached = cache.get(cacheKey);
      if (cached) {
        setSuggestions(cached);
        setLoading(false);
        return;
      }

      // Fetch smart suggestions
      const response = await axios.get(`${API}/users/suggestions?limit=${limit}`);

      // Cache the suggestions
      cache.set(cacheKey, response.data, CacheTTL.MEDIUM);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      // Fallback to trending users
      try {
        const fallback = await axios.get(`${API}/users/trending?limit=${limit}`);
        setSuggestions(fallback.data);
      } catch (fallbackError) {
        setSuggestions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId, isFollowing) => {
    try {
      if (isFollowing) {
        // Unfollow
        await axios.delete(`${API}/users/${userId}/follow`);
        toast.success('Unfollowed successfully');
      } else {
        // Follow
        await axios.post(`${API}/users/${userId}/follow`);
        toast.success('Successfully followed!');
      }

      // Update the suggestion in place
      setSuggestions(suggestions.map(s =>
        s.id === userId ? { ...s, is_following: !isFollowing } : s
      ));

      // Invalidate cache
      cache.delete('people_you_may_know');
      cache.delete('user_suggestions');
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
      toast.error('Failed to update follow status');
    }
  };

  const handleViewProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  if (!user) return null;

  return (
    <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-slate-200 bg-white">
      <CardHeader className="bg-gradient-to-r from-slate-600 via-slate-700 to-slate-600 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <CardTitle className="text-white text-lg font-bold">People You May Know</CardTitle>
          </div>
          <div className="flex items-center space-x-1 text-white/80 text-xs">
            <TrendingUp className="w-3 h-3" />
            <span>Smart picks</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-8 bg-slate-200 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium mb-1">No suggestions yet</p>
            <p className="text-slate-500 text-sm">Follow more people to get recommendations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className="group relative flex items-center space-x-3 p-3 rounded-xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-white transition-all duration-300 border border-transparent hover:border-slate-200 hover:shadow-md"
              >
                {/* Rank Badge */}
                <div className="absolute -top-1 -left-1 w-6 h-6 bg-gradient-to-br from-slate-600 to-slate-700 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white z-10">
                  {index + 1}
                </div>

                {/* Avatar */}
                <button
                  onClick={() => handleViewProfile(suggestion.username)}
                  className="relative flex-shrink-0"
                >
                  <Avatar className="w-12 h-12 ring-2 ring-slate-200 group-hover:ring-slate-300 transition-all cursor-pointer hover:scale-105">
                    {getUserAvatarUrl(suggestion) ? (
                      <img
                        src={getUserAvatarUrl(suggestion)}
                        alt={suggestion.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white font-bold text-lg">
                        {suggestion.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  {/* Mutual connections indicator */}
                  {suggestion.suggestion_score > 15 && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center border-2 border-white">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>

                {/* User Info */}
                <button
                  onClick={() => handleViewProfile(suggestion.username)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="font-semibold text-slate-800 truncate group-hover:text-slate-900 transition-colors">
                    {suggestion.name || suggestion.username}
                  </p>
                  <p className="text-sm text-slate-500 truncate">@{suggestion.username}</p>
                  {suggestion.bio && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{suggestion.bio}</p>
                  )}
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {suggestion.followers_count || 0} followers
                    </span>
                    {suggestion.suggestion_score > 15 && (
                      <>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-blue-600 font-medium">
                          Mutual connections
                        </span>
                      </>
                    )}
                  </div>
                </button>

                {/* Follow/Following Button */}
                <Button
                  onClick={() => handleFollow(suggestion.id, suggestion.is_following)}
                  size="sm"
                  className={`flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 ${suggestion.is_following
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'
                    : 'bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white'
                    }`}
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  {suggestion.is_following ? 'Following' : 'Follow'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        {suggestions.length > 0 && (
          <button
            onClick={() => navigate('/social')}
            className="w-full mt-4 py-2.5 text-center text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all duration-300 border border-slate-200 hover:border-slate-300 hover:shadow-md"
          >
            View All Suggestions
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default PeopleYouMayKnow;
