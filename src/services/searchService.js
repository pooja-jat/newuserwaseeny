import apiClient from '../config/apiClient';
import { SEARCH_ROUTES } from '../config/routes';
import MOCK_RESTAURANTS from '../Data/mock/restaurants.json';
import MOCK_HOME_DATA from '../Data/mock/homeData.json';

// Helper to gather all dishes/products across all restaurants
function getAllMockProducts() {
  const allProducts = [];
  
  Object.keys(MOCK_RESTAURANTS).forEach(restKey => {
    const entry = MOCK_RESTAURANTS[restKey];
    const restaurant = entry?.restaurant || {};
    const menu = entry?.menu || [];
    
    menu.forEach(category => {
      (category.items || []).forEach(item => {
        allProducts.push({
          ...item,
          id: item._id || item.id,
          _id: item._id || item.id,
          categoryName: category.name,
          restaurantId: restaurant._id || restaurant.id || restKey,
          restaurant_id: restaurant._id || restaurant.id || restKey,
          restaurantName: restaurant.name || 'Restaurant',
          restaurantImage: restaurant.logo || restaurant.coverImage,
          restaurant: restaurant,
          rating: item.rating || 4.5,
          price: item.price || 199,
          basePrice: item.price || 199,
          isVeg: item.isVeg !== undefined ? item.isVeg : true,
        });
      });
    });
  });

  return allProducts;
}

function getAllMockRestaurants() {
  const list = [];
  const seen = new Set();

  // From homeData
  const homeRestaurants = [
    ...(MOCK_HOME_DATA?.sections?.recommendedForYou || []),
    ...(MOCK_HOME_DATA?.sections?.exploreRestaurants || []),
  ];

  homeRestaurants.forEach(r => {
    const id = r._id || r.id;
    if (!seen.has(id)) {
      seen.add(id);
      list.push({
        ...r,
        id: id,
        _id: id,
        cuisines: r.cuisines || ['Multi-Cuisine'],
      });
    }
  });

  // From restaurants.json
  Object.keys(MOCK_RESTAURANTS).forEach(restKey => {
    const r = MOCK_RESTAURANTS[restKey]?.restaurant;
    if (r && !seen.has(r._id || r.id || restKey)) {
      const id = r._id || r.id || restKey;
      seen.add(id);
      list.push({
        ...r,
        id: id,
        _id: id,
        cuisines: r.cuisines || ['Multi-Cuisine'],
      });
    }
  });

  return list;
}

/**
 * Search for restaurants and products with filters
 * @param {string} query - Search query
 * @param {object} filters - Filter options (isVeg, minPrice, maxPrice, etc.)
 * @returns {Promise} Search results with restaurants and products
 */
export const searchRestaurantsAndProducts = async (query = '', filters = {}) => {
  try {
    const queryParams = new URLSearchParams({ q: query, ...filters });
    const url = `${SEARCH_ROUTES.search}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    const data = response?.data;
    if (data?.results?.products || data?.results?.restaurants) {
      return {
        restaurants: data.results.restaurants || [],
        products: data.results.products || [],
      };
    }
    if (data?.products || data?.restaurants) {
      return {
        restaurants: data.restaurants || [],
        products: data.products || [],
      };
    }
  } catch (error) {
    // Graceful fallback to rich local search
  }

  const q = (query || '').toLowerCase().trim();
  const allProducts = getAllMockProducts();
  const allRestaurants = getAllMockRestaurants();

  if (!q && Object.keys(filters).length === 0) {
    return {
      restaurants: allRestaurants.slice(0, 6),
      products: allProducts.slice(0, 10),
    };
  }

  // Filter products
  let matchedProducts = allProducts.filter(p => {
    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const descMatch = (p.description || '').toLowerCase().includes(q);
    const catMatch = (p.categoryName || '').toLowerCase().includes(q);
    const restMatch = (p.restaurantName || '').toLowerCase().includes(q);
    return nameMatch || descMatch || catMatch || restMatch;
  });

  // Filter restaurants
  let matchedRestaurants = allRestaurants.filter(r => {
    const nameMatch = (r.name || '').toLowerCase().includes(q);
    const cuisines = Array.isArray(r.cuisines) ? r.cuisines.join(' ') : (r.cuisines || '');
    const cuisineMatch = cuisines.toLowerCase().includes(q);
    const addressMatch = (r.address || '').toLowerCase().includes(q);
    return nameMatch || cuisineMatch || addressMatch;
  });

  // Apply extra filters if provided
  if (filters.isVeg !== undefined && filters.isVeg !== null) {
    const isVegBool = String(filters.isVeg) === 'true';
    matchedProducts = matchedProducts.filter(p => p.isVeg === isVegBool);
    matchedRestaurants = matchedRestaurants.filter(r => r.isVeg === isVegBool);
  }

  if (filters.minPrice !== undefined) {
    matchedProducts = matchedProducts.filter(p => p.price >= Number(filters.minPrice));
  }

  if (filters.maxPrice !== undefined) {
    matchedProducts = matchedProducts.filter(p => p.price <= Number(filters.maxPrice));
  }

  return {
    restaurants: matchedRestaurants,
    products: matchedProducts,
  };
};

/**
 * Get search suggestions based on query
 * @param {string} query - Search query
 * @returns {Promise} Array of suggestions
 */
export const getSearchSuggestions = async (query = '') => {
  try {
    const queryParams = new URLSearchParams({ q: query });
    const url = `${SEARCH_ROUTES.suggestions}?${queryParams.toString()}`;
    const response = await apiClient.get(url);
    if (Array.isArray(response?.data) && response.data.length > 0) {
      return response.data;
    }
  } catch (error) {
    // Fallback to local suggestions
  }

  const q = (query || '').toLowerCase().trim();
  const allProducts = getAllMockProducts();
  const allRestaurants = getAllMockRestaurants();

  if (!q) {
    return [
      { id: 's1', type: 'dish', name: 'Crispy Cheese Burger', text: 'Crispy Cheese Burger', restaurantId: 'r1' },
      { id: 's2', type: 'dish', name: 'Farmhouse Margherita Pizza', text: 'Farmhouse Margherita Pizza', restaurantId: 'r1' },
      { id: 's3', type: 'dish', name: 'Hyderabadi Chicken Dum Biryani', text: 'Hyderabadi Chicken Dum Biryani', restaurantId: 'r3' },
      { id: 's4', type: 'restaurant', name: 'The Food Haven', text: 'The Food Haven', id: 'r1', _id: 'r1' },
      { id: 's5', type: 'restaurant', name: 'Burger Club', text: 'Burger Club', id: 'r2', _id: 'r2' },
    ];
  }

  const matchedProducts = allProducts
    .filter(p => (p.name || '').toLowerCase().includes(q))
    .map(p => ({
      id: p.id,
      _id: p.id,
      type: 'dish',
      name: p.name,
      text: p.name,
      price: p.price,
      image: p.image,
      restaurantId: p.restaurantId,
      restaurantName: p.restaurantName,
      restaurant: p.restaurant,
    }));

  const matchedRestaurants = allRestaurants
    .filter(r => (r.name || '').toLowerCase().includes(q))
    .map(r => ({
      id: r.id || r._id,
      _id: r.id || r._id,
      type: 'restaurant',
      name: r.name,
      text: r.name,
      image: r.logo || r.coverImage,
      cuisines: r.cuisines,
      restaurant: r,
    }));

  return [...matchedRestaurants, ...matchedProducts].slice(0, 8);
};

export default {
  searchRestaurantsAndProducts,
  getSearchSuggestions,
};
