const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/api/users/login`,
  REGISTER: `${API_BASE_URL}/api/users/register`,
  PROFILE: `${API_BASE_URL}/api/users/profile`,
  ARTISTS: `${API_BASE_URL}/api/artists`,
  ARTWORKS: `${API_BASE_URL}/api/artworks`,
  LOGOUT: `${API_BASE_URL}/api/users/logout`,
};

export const getApiUrl = (endpoint: string) => `${API_BASE_URL}${endpoint}`;
export default API_BASE_URL;
