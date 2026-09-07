import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../config/apiClient';
import { CART_ROUTES } from '../config/routes';

const LOCAL_CART_KEY = 'ecdkart_local_cart_v1';

export const getLocalStoredCart = async () => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_CART_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

export const saveLocalStoredCart = async (cartData) => {
  try {
    if (!cartData) {
      await AsyncStorage.removeItem(LOCAL_CART_KEY);
    } else {
      await AsyncStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cartData));
    }
  } catch (e) {
    console.warn('Failed to save cart to local storage', e);
  }
};

/**
 * Get current cart
 */
export const getCart = async () => {
  try {
    const response = await apiClient.get(CART_ROUTES.getCart);
    if (response?.data?.cart) {
      await saveLocalStoredCart(response.data);
      return response.data;
    }
  } catch (error) {
    // Return locally saved cart
  }

  const local = await getLocalStoredCart();
  if (local) return local;

  return { cart: null, bill: null, itemCount: 0 };
};

/**
 * Add item to cart
 */
export const addItemToCart = async (payload) => {
  try {
    const response = await apiClient.post(CART_ROUTES.addItem, payload);
    if (response?.data?.cart) {
      await saveLocalStoredCart(response.data);
      return response.data;
    }
  } catch (error) {
    const statusCode = error?.response?.status;
    const responseData = error?.response?.data;
    
    if (statusCode === 409 && responseData?.conflict === true) {
      return {
        conflict: true,
        currentRestaurant: responseData?.currentRestaurant,
        newRestaurant: responseData?.newRestaurant,
        message: responseData?.message,
      };
    }
  }

  return { success: true };
};

/**
 * Remove item from cart
 */
export const removeItemFromCart = async (itemId) => {
  try {
    const url = CART_ROUTES.removeItem.replace(':itemId', itemId);
    const response = await apiClient.delete(url);
    if (response?.data?.cart) {
      await saveLocalStoredCart(response.data);
      return response.data;
    }
  } catch (error) {
    // local handling
  }

  return { success: true };
};

/**
 * Update item quantity
 */
export const updateItemQuantity = async (itemId, payload) => {
  try {
    const url = CART_ROUTES.updateQuantity.replace(':itemId', itemId);
    const response = await apiClient.put(url, payload);
    if (response?.data?.cart) {
      await saveLocalStoredCart(response.data);
      return response.data;
    }
  } catch (error) {
    // local handling
  }

  return { success: true };
};

export default {
  getCart,
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
  getLocalStoredCart,
  saveLocalStoredCart,
};
