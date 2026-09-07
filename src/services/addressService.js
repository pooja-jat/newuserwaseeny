import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../config/apiClient';
import { USER_ROUTES } from '../config/routes';
import MOCK_USER from '../Data/mock/user.json';

const LOCAL_ADDRESSES_KEY = 'ecdkart_user_addresses_v1';

export const getAddresses = async () => {
  try {
    const localRaw = await AsyncStorage.getItem(LOCAL_ADDRESSES_KEY);
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { addresses: parsed };
      }
    }

    try {
      const response = await apiClient.get(USER_ROUTES.profile);
      const saved = response?.data?.savedAddresses || response?.data?.addresses || [];
      if (saved.length > 0) {
        await AsyncStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(saved));
        return { addresses: saved };
      }
    } catch (e) {}

    const defaultAddresses = MOCK_USER.addresses || [
      {
        _id: 'addr_1',
        id: 'addr_1',
        label: 'Home',
        street: '123 Main Street, Apartment 4B',
        addressLine: '123 Main Street, Apartment 4B, City Center',
        city: 'City Center',
        isDefault: true,
      },
      {
        _id: 'addr_2',
        id: 'addr_2',
        label: 'Work',
        street: 'Tech Park, Building 2, Floor 5',
        addressLine: 'Tech Park, Building 2, Floor 5, Cyber City',
        city: 'Cyber City',
        isDefault: false,
      },
    ];

    await AsyncStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(defaultAddresses));
    return { addresses: defaultAddresses };
  } catch (error) {
    return { addresses: MOCK_USER.addresses || [] };
  }
};

export const addAddress = async payload => {
  try {
    const { addresses } = await getAddresses();
    const newAddr = {
      _id: `addr_${Date.now()}`,
      id: `addr_${Date.now()}`,
      label: payload.label || 'Other',
      street: payload.street || payload.addressLine || '',
      addressLine: payload.addressLine || payload.street || '',
      city: payload.city || 'City Center',
      isDefault: addresses.length === 0 || !!payload.isDefault,
      ...payload,
    };

    const updated = [...addresses, newAddr];
    await AsyncStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(updated));

    try {
      const response = await apiClient.post(USER_ROUTES.addresses, payload);
      if (response?.data) return response.data;
    } catch (e) {}

    return { success: true, address: newAddr };
  } catch (error) {
    return { success: true, address: payload };
  }
};

export const updateAddress = async (id, payload) => {
  try {
    const { addresses } = await getAddresses();
    const updated = addresses.map(a =>
      String(a._id || a.id) === String(id) ? { ...a, ...payload } : a,
    );
    await AsyncStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(updated));

    try {
      const endpoint = USER_ROUTES.addressById.replace(':id', id);
      const response = await apiClient.put(endpoint, payload);
      if (response?.data) return response.data;
    } catch (e) {}

    return { success: true };
  } catch (error) {
    return { success: true };
  }
};

export const deleteAddress = async id => {
  try {
    const { addresses } = await getAddresses();
    const updated = addresses.filter(a => String(a._id || a.id) !== String(id));
    await AsyncStorage.setItem(LOCAL_ADDRESSES_KEY, JSON.stringify(updated));

    try {
      const endpoint = USER_ROUTES.addressById.replace(':id', id);
      const response = await apiClient.delete(endpoint);
      if (response?.data) return response.data;
    } catch (e) {}

    return { success: true };
  } catch (error) {
    return { success: true };
  }
};

export default {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
};
