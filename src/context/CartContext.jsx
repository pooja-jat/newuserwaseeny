import React, { createContext, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useAuth } from './AuthContext';
import { ConflictModal } from '../components/ConflictModal';
import {
  buildCartLineId,
  calculateCartLineTotals,
  calculateCartTotals,
  toNumber,
} from '../services/cartPricing';
import {
  getCart,
  addItemToCart as addItemToCartApi,
  removeItemFromCart as removeItemFromCartApi,
  updateItemQuantity as updateItemQuantityApi,
  saveLocalStoredCart,
  getLocalStoredCart,
} from '../services/cartService';
import { getOrders as fetchOrdersFromAPI, placeOrder as placeOrderApi } from '../services/orderService';
import { onSocketEvent } from '../services/realtime/socketClient';

export const CartContext = createContext({});

const CART_STORAGE_KEY = 'ecdkart_cart_items_v1';

export const CartProvider = ({ children }) => {
  const { isAuthenticated, isInitialized, realtimeReady } = useAuth();
  const [cart, setCart] = useState([]);
  const [backendCart, setBackendCart] = useState(null);
  const [bill, setBill] = useState(null);
  const [orders, setOrders] = useState([]);
  const [checkout, setCheckout] = useState({
    type: 'delivery',
    date: null,
    time: null,
  });
  const [address, setAddress] = useState({
    id: 'addr_1',
    label: 'Home',
    addressLine: '123 Main Street, Apartment 4B, City Center',
  });
  const [paymentMethod, setPaymentMethod] = useState({
    id: 'cod',
    code: 'cod',
    name: 'Cash on Delivery',
  });
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('online');

  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictData, setConflictData] = useState(null);
  const [pendingConflictPayload, setPendingConflictPayload] = useState(null);
  const [conflictModalLoading, setConflictModalLoading] = useState(false);
  const [freshCartResolvedAt, setFreshCartResolvedAt] = useState(0);

  const quantityUpdateTimers = useRef({});
  const pendingQuantities = useRef({});
  const cartRef = useRef([]);

  useEffect(() => {
    cartRef.current = cart;
  }, [cart]);

  // Save cart to local storage whenever it changes
  const persistCart = useCallback(async (newCart) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
    } catch (e) {
      console.warn('Failed to persist cart:', e);
    }
  }, []);

  // Load initial cart
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCart(parsed);
          setLoading(false);
          return;
        }
      }

      const data = await getCart();
      if (data?.cart?.items?.length) {
        const transformedItems = data.cart.items.map(item => ({
          id: item._id || item.id,
          menuItemId: item.product?._id || item.product || item.id,
          productId: item.product?._id || item.product || item.id,
          name: item.name || 'Delicious Item',
          image: item.image || item.product?.image || '',
          basePrice: item.basePrice || item.price || 199,
          price: item.price || 199,
          quantity: item.quantity || 1,
          qty: item.quantity || 1,
          selectedFlavor: item.variation || null,
          addOns: item.addOns || [],
          unitTotal: item.price || 199,
          totalPrice: (item.price || 199) * (item.quantity || 1),
          restaurantId: data.cart.restaurant?._id || data.cart.restaurant?.id || 'r1',
          restaurantName: data.cart.restaurant?.name || 'Restaurant',
          restaurant: data.cart.restaurant,
        }));
        setCart(transformedItems);
        setBackendCart(data.cart);
        setBill(data.bill);
      }
    } catch (error) {
      console.warn('CartContext fetch error:', error?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const ordersList = await fetchOrdersFromAPI();
      setOrders(Array.isArray(ordersList) ? ordersList : []);
    } catch (error) {
      console.warn('CartContext orders fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    fetchOrders();
  }, [fetchCart, fetchOrders]);

  // Add Item to Cart
  const addToCart = useCallback(async (rawItem) => {
    try {
      setLoading(true);
      const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
      const incomingRestId = rawItem.restaurantId || rawItem.restaurant?.id || rawItem.restaurant?._id || 'r1';
      const incomingRestName = rawItem.restaurantName || rawItem.restaurant?.name || 'Restaurant';

      // Check restaurant conflict
      if (currentCart.length > 0) {
        const currentRestId = currentCart[0].restaurantId;
        const currentRestName = currentCart[0].restaurantName || 'Current Restaurant';

        if (currentRestId && incomingRestId && String(currentRestId) !== String(incomingRestId)) {
          setConflictData({
            currentRestaurant: { id: currentRestId, name: currentRestName },
            newRestaurant: { id: incomingRestId, name: incomingRestName },
          });
          setPendingConflictPayload(rawItem);
          setShowConflictModal(true);
          setLoading(false);
          return { conflict: true };
        }
      }

      const itemId = rawItem.menuItemId || rawItem.productId || rawItem.id || `item_${Date.now()}`;
      const quantityToAdd = toNumber(rawItem.quantity || rawItem.qty || 1, 1);
      const unitPrice = toNumber(rawItem.price || rawItem.basePrice || 199, 199);
      const flavorPrice = toNumber(rawItem.selectedFlavor?.price || 0, 0);
      const addOnsTotal = (rawItem.addOns || []).reduce((sum, a) => sum + toNumber(a?.price || 0, 0), 0);
      const lineUnitPrice = unitPrice + flavorPrice + addOnsTotal;

      let updatedCart = [];
      const existingIndex = currentCart.findIndex(it => 
        String(it.menuItemId || it.id) === String(itemId) &&
        JSON.stringify(it.selectedFlavor || null) === JSON.stringify(rawItem.selectedFlavor || null)
      );

      if (existingIndex >= 0) {
        // Increment existing
        updatedCart = currentCart.map((it, idx) => {
          if (idx === existingIndex) {
            const newQty = it.quantity + quantityToAdd;
            return {
              ...it,
              quantity: newQty,
              qty: newQty,
              totalPrice: it.unitTotal * newQty,
            };
          }
          return it;
        });
      } else {
        // Add new line
        const newLineItem = {
          id: rawItem.id || `cart_item_${Date.now()}_${Math.random()}`,
          menuItemId: itemId,
          productId: itemId,
          name: rawItem.name || 'Food Item',
          image: rawItem.image || '',
          basePrice: unitPrice,
          price: lineUnitPrice,
          unitTotal: lineUnitPrice,
          quantity: quantityToAdd,
          qty: quantityToAdd,
          totalPrice: lineUnitPrice * quantityToAdd,
          selectedFlavor: rawItem.selectedFlavor || null,
          addOns: rawItem.addOns || [],
          restaurantId: incomingRestId,
          restaurantName: incomingRestName,
          restaurant: rawItem.restaurant || null,
        };
        updatedCart = [...currentCart, newLineItem];
      }

      setCart(updatedCart);
      await persistCart(updatedCart);

      Toast.show({
        type: 'topSuccess',
        text1: 'Added to Cart',
        text2: `${rawItem.name || 'Item'} added successfully`,
        position: 'top',
        visibilityTime: 2500,
      });

      // Background API sync
      addItemToCartApi({
        restaurantId: incomingRestId,
        productId: itemId,
        quantity: quantityToAdd,
      }).catch(() => {});

      return { success: true };
    } catch (error) {
      console.warn('Error in addToCart:', error);
      return { error: true };
    } finally {
      setLoading(false);
    }
  }, [persistCart]);

  // Conflict Resolution: Place Current Order
  const handlePlaceCurrentOrder = useCallback(() => {
    setShowConflictModal(false);
    setConflictData(null);
    setPendingConflictPayload(null);
  }, []);

  // Conflict Resolution: Fresh Cart (Replace all with new restaurant item)
  const handleFreshCart = useCallback(async () => {
    try {
      setConflictModalLoading(true);
      setShowConflictModal(false);

      if (!pendingConflictPayload) return;

      const rawItem = pendingConflictPayload;
      const incomingRestId = rawItem.restaurantId || rawItem.restaurant?.id || 'r1';
      const incomingRestName = rawItem.restaurantName || rawItem.restaurant?.name || 'Restaurant';
      const itemId = rawItem.menuItemId || rawItem.productId || rawItem.id || `item_${Date.now()}`;
      const quantityToAdd = toNumber(rawItem.quantity || 1, 1);
      const unitPrice = toNumber(rawItem.price || rawItem.basePrice || 199, 199);

      const newLineItem = {
        id: `cart_item_${Date.now()}`,
        menuItemId: itemId,
        productId: itemId,
        name: rawItem.name || 'Food Item',
        image: rawItem.image || '',
        basePrice: unitPrice,
        price: unitPrice,
        unitTotal: unitPrice,
        quantity: quantityToAdd,
        qty: quantityToAdd,
        totalPrice: unitPrice * quantityToAdd,
        selectedFlavor: rawItem.selectedFlavor || null,
        addOns: rawItem.addOns || [],
        restaurantId: incomingRestId,
        restaurantName: incomingRestName,
        restaurant: rawItem.restaurant || null,
      };

      const freshCart = [newLineItem];
      setCart(freshCart);
      await persistCart(freshCart);

      Toast.show({
        type: 'topSuccess',
        text1: 'Cart Updated',
        text2: `Started new cart from ${incomingRestName}`,
        position: 'top',
      });
    } catch (e) {
      console.warn('Fresh cart error:', e);
    } finally {
      setConflictModalLoading(false);
      setPendingConflictPayload(null);
      setConflictData(null);
    }
  }, [pendingConflictPayload, persistCart]);

  // Increment Item
  const incrementItem = useCallback((id) => {
    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i => String(i.id) === matchId || String(i.menuItemId) === matchId);
    if (!item) return;

    const newQty = item.quantity + 1;
    const updated = currentCart.map(it => {
      if (String(it.id) === String(item.id)) {
        return {
          ...it,
          quantity: newQty,
          qty: newQty,
          totalPrice: it.unitTotal * newQty,
        };
      }
      return it;
    });

    setCart(updated);
    persistCart(updated);
  }, [persistCart]);

  // Decrement Item
  const decrementItem = useCallback((id) => {
    const matchId = String(id);
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const item = currentCart.find(i => String(i.id) === matchId || String(i.menuItemId) === matchId);
    if (!item) return;

    let updated = [];
    if (item.quantity <= 1) {
      updated = currentCart.filter(it => String(it.id) !== String(item.id));
    } else {
      const newQty = item.quantity - 1;
      updated = currentCart.map(it => {
        if (String(it.id) === String(item.id)) {
          return {
            ...it,
            quantity: newQty,
            qty: newQty,
            totalPrice: it.unitTotal * newQty,
          };
        }
        return it;
      });
    }

    setCart(updated);
    persistCart(updated);
  }, [persistCart]);

  // Remove Item
  const removeFromCart = useCallback((id) => {
    const currentCart = Array.isArray(cartRef.current) ? cartRef.current : [];
    const updated = currentCart.filter(it => String(it.id) !== String(id) && String(it.menuItemId) !== String(id));
    setCart(updated);
    persistCart(updated);
  }, [persistCart]);

  // Clear Cart
  const clearCart = useCallback(async () => {
    setCart([]);
    await persistCart([]);
    setCheckout({ type: 'delivery', date: null, time: null });
  }, [persistCart]);

  // Add Order
  const addOrder = useCallback((order) => {
    if (!order) return;
    setOrders(prev => [order, ...prev.filter(o => o._id !== order._id && o.id !== order.id)]);
  }, []);

  const getOrderById = useCallback(
    orderId => orders.find(o => String(o.id) === String(orderId) || String(o._id) === String(orderId)),
    [orders],
  );

  const cartCount = useMemo(
    () => cart.reduce((s, it) => s + toNumber(it.quantity, 1), 0),
    [cart],
  );

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + toNumber(item.totalPrice, item.price * item.quantity), 0);
    const delivery = subtotal > 0 ? (subtotal > 300 ? 0 : 35) : 0;
    const tax = Math.round(subtotal * 0.05);
    const packaging = subtotal > 0 ? 15 : 0;
    const platformFee = subtotal > 0 ? 5 : 0;
    const discount = subtotal > 400 ? 50 : 0;
    const grandTotal = Math.max(0, subtotal + delivery + tax + packaging + platformFee - discount);

    return {
      subtotal,
      delivery,
      tax,
      packaging,
      platformFee,
      discount,
      grandTotal,
    };
  }, [cart]);

  const cartState = useMemo(
    () => ({
      items: cart,
      address,
      paymentMethod,
      checkout,
      totals,
      bill: totals,
      backendCart,
    }),
    [address, cart, checkout, paymentMethod, totals, backendCart],
  );

  return (
    <>
      <ConflictModal
        visible={showConflictModal}
        currentRestaurant={conflictData?.currentRestaurant}
        newRestaurant={conflictData?.newRestaurant}
        onPlaceOrder={handlePlaceCurrentOrder}
        onFreshCart={handleFreshCart}
        loading={conflictModalLoading}
      />
      <CartContext.Provider
        value={{
          cart,
          cartState,
          orders,
          cartCount,
          totals,
          bill: totals,
          backendCart,
          loading,
          backendStatus,
          addToCart,
          addOrder,
          getOrderById,
          fetchOrders,
          freshCartResolvedAt,
          checkout,
          setCheckout,
          address,
          setAddress,
          paymentMethod,
          setPaymentMethod,
          removeFromCart,
          clearCart,
          incrementItem,
          decrementItem,
          fetchCart,
        }}
      >
        {children}
      </CartContext.Provider>
    </>
  );
};

export default CartContext;
