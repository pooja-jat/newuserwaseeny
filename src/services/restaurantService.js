// src/services/restaurantService.js
import MOCK_RESTAURANTS from '../Data/mock/restaurants.json';
// import apiClient from '../config/apiClient';
// import { RESTAURANT_ROUTES } from '../config/routes';

const DEFAULT_RESTAURANT = MOCK_RESTAURANTS.r1.restaurant;
const DEFAULT_MENU = MOCK_RESTAURANTS.r1.menu;

export const getRestaurantDetails = async id => {
  try {
    /*
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getDetails.replace(':id', id),
    );
    return response.data || (MOCK_RESTAURANTS[id]?.restaurant || DEFAULT_RESTAURANT);
    */
    return MOCK_RESTAURANTS[id]?.restaurant || DEFAULT_RESTAURANT;
  } catch (error) {
    console.warn('[RestaurantService] Using mock details fallback');
    return MOCK_RESTAURANTS[id]?.restaurant || DEFAULT_RESTAURANT;
  }
};

export const getRestaurantMenu = async restaurantId => {
  try {
    /*
    const response = await apiClient.get(
      RESTAURANT_ROUTES.getMenu.replace(':restaurantId', restaurantId),
    );
    return response.data || (MOCK_RESTAURANTS[restaurantId]?.menu || DEFAULT_MENU);
    */
    return MOCK_RESTAURANTS[restaurantId]?.menu || DEFAULT_MENU;
  } catch (error) {
    console.warn('[RestaurantService] Using mock menu fallback');
    return MOCK_RESTAURANTS[restaurantId]?.menu || DEFAULT_MENU;
  }
};


