/**
 * Get API Base URL based on environment
 * - Development: http://localhost:5000/api
 * - Production: https://api.mazaadati.com/api
 * - Can be overridden with VITE_BASE_URL environment variable
 * 
 * @returns {string} API base URL
 */
export function getBaseUrl() {
  // Check if explicitly set via environment variable (highest priority)
  const envUrl = import.meta.env?.VITE_BASE_URL || import.meta.env?.REACT_APP_BASE_URL;
  if (envUrl) {
    if (typeof console !== 'undefined') {
      console.log('🌐 [Admin Panel] Using API URL from environment:', envUrl);
    }
    return envUrl;
  }

  // Check if in development mode
  const isDevelopment = 
    import.meta.env?.MODE === 'development' || 
    import.meta.env?.DEV || 
    (typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ));

  if (isDevelopment) {
    const localUrl = 'http://localhost:5000/api';
    if (typeof console !== 'undefined') {
      console.log('🌐 [Admin Panel] Development mode - Using LOCAL API:', localUrl);
      console.log('   Make sure backend is running on http://localhost:5000');
    }
    return localUrl;
  }

  // Production mode
  const productionUrl = 'https://api.mazaadati.com/api';
  if (typeof console !== 'undefined') {
    console.log('🌐 [Admin Panel] Production mode - Using PRODUCTION API:', productionUrl);
  }
  return productionUrl;
}

/**
 * Get base URL without /api suffix (for image URLs, etc.)
 * @returns {string} Base URL without /api
 */
export function getBaseUrlWithoutApi() {
  return getBaseUrl().replace('/api', '');
}

