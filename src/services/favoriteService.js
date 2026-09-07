import apiClient from '../config/apiClient';
import { FAVORITE_ROUTES } from '../config/routes';

export const getFavoriteRestaurants = async () => {
  try {
    const response = await apiClient.get(FAVORITE_ROUTES.getFavoriteRestaurants);
    return response?.data?.favorites || [];
  } catch (error) {
    return [];
  }
};

export const toggleFavoriteRestaurant = async (restaurantId) => {
  try {
    const url = FAVORITE_ROUTES.toggleFavoriteRestaurant.replace(':id', restaurantId);
    const response = await apiClient.post(url);
    return response?.data || { isFavorite: true };
  } catch (error) {
    return { isFavorite: true };
  }
};

export const getFavoriteProducts = async () => {
  try {
    const response = await apiClient.get(FAVORITE_ROUTES.getFavoriteProducts);
    return response?.data?.favorites || [];
  } catch (error) {
    return [];
  }
};

export const toggleFavoriteProduct = async (productId) => {
  try {
    const url = FAVORITE_ROUTES.toggleFavoriteProduct.replace(':id', productId);
    const response = await apiClient.post(url);
    return response?.data || { isFavorite: true };
  } catch (error) {
    return { isFavorite: true };
  }
};

export default {
  getFavoriteRestaurants,
  toggleFavoriteRestaurant,
  getFavoriteProducts,
  toggleFavoriteProduct,
};
