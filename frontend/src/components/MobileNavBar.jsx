import { Link, useLocation } from "react-router-dom";
import { Home, Users, FileText, TrendingUp, MessageCircle, Menu } from "lucide-react";

/**
 * MobileNavBar - Bottom navigation tabs for mobile devices
 * Sized for touch with safe-area padding
 */
const MobileNavBar = ({ user }) => {
    const location = useLocation();

    // Check if current path matches the nav item
    const isActive = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/social', icon: Users, label: 'Social' },
        { path: '/blogs', icon: FileText, label: 'Blogs' },
        { path: '/trending', icon: TrendingUp, label: 'Trending' },
        { path: '/messages', icon: MessageCircle, label: 'Messages' },
        { path: '/menu', icon: Menu, label: 'Menu' },
    ];

    if (!user) return null;

    return (
        <nav
            className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-50 shadow-lg"
            style={{
                paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <div className="flex items-center justify-around h-16 px-1">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const active = isActive(path);
                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center flex-1 py-2 min-w-0 rounded-lg transition-all duration-200 ${active
                                    ? 'text-slate-900'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            data-testid={`mobile-nav-${label.toLowerCase()}`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all duration-200 ${active
                                    ? 'bg-slate-200'
                                    : ''
                                }`}>
                                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                            </div>
                            <span className={`text-[10px] mt-0.5 font-medium truncate ${active ? 'font-semibold' : ''
                                }`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export { MobileNavBar };
export default MobileNavBar;
