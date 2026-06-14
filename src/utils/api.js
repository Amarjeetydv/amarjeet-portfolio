export function getApiBaseUrl() {
  let baseUrl = import.meta.env.VITE_API_URL;
  if (!baseUrl) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:5000';
    } else {
      baseUrl = 'https://amarjeet-portfolio.onrender.com';
    }
  }
  return baseUrl.replace(/\/$/, '');
}
