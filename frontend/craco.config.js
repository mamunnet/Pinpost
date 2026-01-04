// Load configuration from environment or config file
const path = require('path');

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === 'true',
};

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      
      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });
        
        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }
      
      return webpackConfig;
    },
  },
  // Fix webpack-dev-server deprecation warnings by using setupMiddlewares
  devServer: (devServerConfig) => {
    // Remove deprecated options
    delete devServerConfig.onBeforeSetupMiddleware;
    delete devServerConfig.onAfterSetupMiddleware;
    
    // Use the new setupMiddlewares API
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Add any custom before middlewares here if needed
      // middlewares.unshift({ ... });
      
      // Add any custom after middlewares here if needed
      // middlewares.push({ ... });
      
      return middlewares;
    };
    
    return devServerConfig;
  },
};