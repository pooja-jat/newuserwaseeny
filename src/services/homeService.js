import MOCK_HOME_DATA from '../Data/mock/homeData.json';
// import apiClient from '../config/apiClient';
// import { HOME_ROUTES } from '../config/routes';

/**
 * Get home page data including banners, categories, and restaurant sections
 * @param {Object} params - Query parameters
 * @param {number} params.lat - Latitude for location-based data
 * @param {number} params.lng - Longitude for location-based data
 * @returns {Promise<Object>} Home data with banners, categories, sections, and tabs
 */
export const getHomeData = async ({ lat, lng } = {}) => {
  try {
    /*
    // Backend API Integration:
    const params = {};
    if (lat !== undefined && lng !== undefined) {
      params.lat = lat;
      params.lng = lng;
    }
    const response = await apiClient.get(HOME_ROUTES.getHomeData, { params });
    return response?.data ?? MOCK_HOME_DATA;
    */
    return MOCK_HOME_DATA;
  } catch (error) {
    console.warn('[HomeService] Using fallback JSON mock data:', error?.message);
    return MOCK_HOME_DATA;
  }
};


