import AsyncStorage from '@react-native-async-storage/async-storage';
import MOCK_ORDERS from '../Data/mock/orders.json';
import apiClient from '../config/apiClient';
import { ORDER_ROUTES } from '../config/routes';

const LOCAL_ORDERS_KEY = 'ecdkart_user_orders_v1';

export function generateOrderId(prefix = 'ECD') {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${yyyy}${mm}${dd}-${rand}`;
}

export const getOrders = async () => {
  try {
    const localRaw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const localOrders = localRaw ? JSON.parse(localRaw) : [];

    try {
      const response = await apiClient.get(ORDER_ROUTES.getOrders);
      if (Array.isArray(response?.data?.orders)) {
        return [...localOrders, ...response.data.orders];
      }
    } catch (apiErr) {
      // Backend not running, use local + mock
    }

    const merged = [...localOrders];
    const seenIds = new Set(localOrders.map(o => o._id || o.id));

    (MOCK_ORDERS || []).forEach(mOrder => {
      const id = mOrder._id || mOrder.id;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        merged.push(mOrder);
      }
    });

    return merged;
  } catch (error) {
    console.warn('[OrderService] Using mock orders fallback');
    return MOCK_ORDERS;
  }
};

export const getOrderById = async (orderId) => {
  try {
    const all = await getOrders();
    const order = all.find(
      o =>
        String(o._id) === String(orderId) ||
        String(o.id) === String(orderId) ||
        String(o.orderNumber) === String(orderId)
    );
    return order || all[0] || MOCK_ORDERS[0];
  } catch (error) {
    return MOCK_ORDERS[0];
  }
};

export const placeOrder = async (orderPayload = {}) => {
  const newOrderId = generateOrderId('ECD');
  const nowIso = new Date().toISOString();
  
  const deliveryAddr = orderPayload.deliveryAddress || orderPayload.address || {
    label: 'Home',
    addressLine: '123 Main Street, Apartment 4B, City Center',
    city: 'City Center',
  };

  const newOrder = {
    _id: newOrderId,
    id: newOrderId,
    orderId: newOrderId,
    orderNumber: newOrderId,
    status: 'PREPARING',
    createdAt: nowIso,
    restaurant: orderPayload.restaurant || {
      id: 'r1',
      _id: 'r1',
      name: orderPayload.restaurantName || 'The Food Haven',
      logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500',
      address: '124 Food Street, City Center',
      phone: '+91 98765 11223',
    },
    items: (orderPayload.items || []).map(it => ({
      ...it,
      name: it.name || 'Delicious Dish',
      quantity: it.quantity || it.qty || 1,
      qty: it.quantity || it.qty || 1,
      price: it.price || it.unitTotal || 199,
      image: it.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    })),
    itemTotal: orderPayload.totals?.subtotal || orderPayload.totalAmount || 398,
    totalAmount: orderPayload.totals?.grandTotal || orderPayload.totalAmount || 428,
    totals: orderPayload.totals || {},
    deliveryFee: orderPayload.totals?.delivery || 0,
    tax: orderPayload.totals?.tax || 20,
    platformFee: orderPayload.totals?.platformFee || 5,
    packaging: orderPayload.totals?.packaging || 15,
    discount: orderPayload.totals?.discount || 0,
    paymentMethod: orderPayload.paymentMethod?.name || orderPayload.paymentMethod || 'Cash on Delivery',
    deliveryAddress: deliveryAddr,
    address: deliveryAddr,
    rider: {
      name: 'Santosh Rawat',
      phone: '+91 98936 78524',
    },
  };

  try {
    // Attempt backend sync
    const response = await apiClient.post(ORDER_ROUTES.placeOrder, orderPayload);
    if (response?.data?.order) {
      const apiOrder = response.data.order;
      await saveLocalOrder(apiOrder);
      return response.data;
    }
  } catch (apiErr) {
    // Fallback: save locally
  }

  await saveLocalOrder(newOrder);
  return {
    success: true,
    order: newOrder,
  };
};

async function saveLocalOrder(order) {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const updated = [order, ...list.filter(o => o._id !== order._id && o.id !== order.id)];
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save order to local storage', e);
  }
}

export const cancelOrder = async (orderId) => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const updated = list.map(o => {
      if (String(o._id) === String(orderId) || String(o.id) === String(orderId)) {
        return { ...o, status: 'CANCELLED' };
      }
      return o;
    });
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (e) {
    return { success: false };
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_ORDERS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const updated = list.map(o => {
      if (String(o._id) === String(orderId) || String(o.id) === String(orderId)) {
        return { ...o, status };
      }
      return o;
    });
    await AsyncStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));
    return { success: true };
  } catch (e) {
    return { success: false };
  }
};

export default {
  getOrders,
  getOrderById,
  placeOrder,
  cancelOrder,
  updateOrderStatus,
  generateOrderId,
};
