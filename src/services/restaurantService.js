// src/services/restaurantService.js
import MOCK_RESTAURANTS from '../Data/mock/restaurants.json';
import MOCK_HOME_DATA from '../Data/mock/homeData.json';
import apiClient from '../config/apiClient';
import { RESTAURANT_ROUTES } from '../config/routes';

const DEFAULT_ENTRY = MOCK_RESTAURANTS.r1;

function findRestaurantInMocks(id) {
  if (!id) return DEFAULT_ENTRY.restaurant;

  const strId = String(id);
  if (MOCK_RESTAURANTS[strId]?.restaurant) {
    return MOCK_RESTAURANTS[strId].restaurant;
  }

  for (const key of Object.keys(MOCK_RESTAURANTS)) {
    const r = MOCK_RESTAURANTS[key]?.restaurant;
    if (r && (String(r._id) === strId || String(r.id) === strId || key === strId)) {
      return r;
    }
  }

  const allHome = [
    ...(MOCK_HOME_DATA?.sections?.recommendedForYou || []),
    ...(MOCK_HOME_DATA?.sections?.exploreRestaurants || []),
  ];
  const found = allHome.find(r => String(r._id) === strId || String(r.id) === strId);
  if (found) return found;

  return DEFAULT_ENTRY.restaurant;
}

function findMenuInMocks(restaurantId) {
  if (!restaurantId) return DEFAULT_ENTRY.menu;

  const strId = String(restaurantId);
  if (MOCK_RESTAURANTS[strId]?.menu) {
    return MOCK_RESTAURANTS[strId].menu;
  }

  for (const key of Object.keys(MOCK_RESTAURANTS)) {
    const entry = MOCK_RESTAURANTS[key];
    if (
      entry?.restaurant &&
      (String(entry.restaurant._id) === strId ||
        String(entry.restaurant.id) === strId ||
        key === strId)
    ) {
      return entry.menu || DEFAULT_ENTRY.menu;
    }
  }

  return DEFAULT_ENTRY.menu;
}

export const getRestaurantDetails = async id => {
  try {
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getDetails.replace(':id', id),
    );
    if (response?.data?.restaurant || response?.data?.name) {
      return response.data.restaurant || response.data;
    }
  } catch (error) {
    // Fallback to local mock data
  }

  return findRestaurantInMocks(id);
};

export const getRestaurantMenu = async restaurantId => {
  try {
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getMenu.replace(':restaurantId', restaurantId),
    );
    if (response?.data?.categories || response?.data?.menu || response?.data?.products) {
      return response.data;
    }
  } catch (error) {
    // Fallback to local mock data
  }

  const restaurant = findRestaurantInMocks(restaurantId);
  const menuArray = findMenuInMocks(restaurantId);

  const categories = menuArray.map(cat => ({
    _id: cat._id || `cat_${cat.name}`,
    id: cat._id || `cat_${cat.name}`,
    name: cat.name,
  }));

  const products = menuArray.flatMap(cat =>
    (cat.items || []).map(item => ({
      ...item,
      id: item._id || item.id,
      _id: item._id || item.id,
      categoryId: cat._id,
      restaurantId: restaurant._id || restaurant.id || restaurantId,
      restaurantName: restaurant.name || 'Restaurant',
      available: true,
      price: item.price || 199,
      basePrice: item.price || 199,
    })),
  );

  const menuByCategoryId = {};
  menuArray.forEach(cat => {
    menuByCategoryId[cat._id || cat.name] = {
      name: cat.name,
      items: (cat.items || []).map(item => ({
        ...item,
        id: item._id || item.id,
        _id: item._id || item.id,
        categoryId: cat._id,
        restaurantId: restaurant._id || restaurant.id || restaurantId,
      })),
    };
  });

  return {
    restaurant,
    categories,
    products,
    menu: menuArray,
    menuByCategoryId,
  };
};

export default {
  getRestaurantDetails,
  getRestaurantMenu,
};
