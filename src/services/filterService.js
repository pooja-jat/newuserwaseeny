import apiClient from '../config/apiClient';

/**
 * Apply filters to search results
 * @param {string} query - Search query (e.g., "pizza")
 * @param {object} filters - Filter options
 * @param {boolean} filters.isVeg - Filter vegetarian items (true/false)
 * @param {number} filters.minPrice - Minimum price
 * @param {number} filters.maxPrice - Maximum price
 * @param {number} filters.minRating - Minimum rating
 * @param {string} filters.sortBy - Sort order (price_asc, price_desc, rating_desc, newest)
 * @returns {Promise} Filtered search results
 */
export const applyFilters = async (query, filters = {}) => {
  try {
    if (!query || query.trim() === '') {
      throw new Error('Search query is required');
    }

    const params = {
      q: query.trim(),
    };

    // Add price range filters if specified
    if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice > 0) {
      params.minPrice = parseInt(filters.minPrice, 10);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice > 0) {
      params.maxPrice = parseInt(filters.maxPrice, 10);
    }

    // Add minimum rating filter if specified (backend expects minRating)
    const minRatingSource = filters.minRating ?? filters.rating;
    if (minRatingSource !== undefined && minRatingSource !== null && minRatingSource !== 'all') {
      const normalizedMinRating = parseInt(minRatingSource, 10);
      if (!isNaN(normalizedMinRating) && normalizedMinRating >= 1 && normalizedMinRating <= 5) {
        params.minRating = normalizedMinRating;
      }
    }

    // Add sort parameter if specified
    if (filters.sortBy && filters.sortBy !== 'relevance') {
      params.sortBy = filters.sortBy;
    }

    // Use axios params to properly encode the query string
    const response = await apiClient.get('/api/search', { params });

    return response.data?.results || response.data;
  } catch (error) {
    if (__DEV__) {
      console.error('Filter API error:', error?.response?.data || error?.message);
    }
    throw error;
  }
};

/**
 * Convert filter drawer data to API filter format
 * @param {object} drawerFilters - Filter data from FilterDrawer
 * @returns {object} Formatted filters for API
 */
export const convertDrawerFiltersToAPI = (drawerFilters) => {
  const apiFilters = {};

  // Check if we have valid filter data
  if (!drawerFilters) {
    return apiFilters;
  }

  // Handle sort by parameter - map UI values to API parameter names
  if (drawerFilters.sortBy && drawerFilters.sortBy !== 'relevance') {
    const sortMap = {
      'price_low_high': 'price_asc',
      'price_high_low': 'price_desc',
      'rating': 'rating_desc',
      'newest': 'newest',
      'relevance': undefined,
    };
    
    const apiSortValue = sortMap[drawerFilters.sortBy];
    if (apiSortValue) {
      apiFilters.sortBy = apiSortValue;
    }
  }

  // Handle price range
  if (drawerFilters.minPrice !== undefined && drawerFilters.minPrice !== null && drawerFilters.minPrice !== '') {
    const minPrice = typeof drawerFilters.minPrice === 'number' 
      ? drawerFilters.minPrice 
      : parseInt(drawerFilters.minPrice, 10);
    if (!isNaN(minPrice) && minPrice > 0) {
      apiFilters.minPrice = minPrice;
    }
  }

  if (drawerFilters.maxPrice !== undefined && drawerFilters.maxPrice !== null && drawerFilters.maxPrice !== '') {
    const maxPrice = typeof drawerFilters.maxPrice === 'number' 
      ? drawerFilters.maxPrice 
      : parseInt(drawerFilters.maxPrice, 10);
    if (!isNaN(maxPrice) && maxPrice > 0) {
      apiFilters.maxPrice = maxPrice;
    }
  }

  // Handle rating (minimum stars)
  if (drawerFilters.rating && drawerFilters.rating !== 'all') {
    const normalizedRating = typeof drawerFilters.rating === 'number'
      ? drawerFilters.rating
      : parseInt(drawerFilters.rating, 10);

    if (!isNaN(normalizedRating) && normalizedRating >= 1 && normalizedRating <= 5) {
      apiFilters.minRating = normalizedRating;
    }
  }

  return apiFilters;
};

/**
 * Get default filter values
 * @returns {object} Default filter object
 */
export const getDefaultFilters = () => ({
  isVeg: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
});
