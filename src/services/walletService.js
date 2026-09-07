import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../config/apiClient';
import { WALLET_ROUTES } from '../config/routes';

const LOCAL_WALLET_KEY = 'ecdkart_wallet_balance_v1';

const MOCK_WALLET = {
  balance: 1250,
  walletBalance: 1250,
  currency: '₹',
  transactions: [
    {
      id: 'tx_1',
      _id: 'tx_1',
      type: 'CREDIT',
      amount: 500,
      title: 'Cashback Added',
      description: 'Order cashback for ECD-2026-8921',
      date: '2026-09-06T19:35:00.000Z',
    },
    {
      id: 'tx_2',
      _id: 'tx_2',
      type: 'DEBIT',
      amount: 250,
      title: 'Paid for Order',
      description: 'Used for order payment',
      date: '2026-09-05T12:20:00.000Z',
    },
    {
      id: 'tx_3',
      _id: 'tx_3',
      type: 'CREDIT',
      amount: 1000,
      title: 'Wallet Top-up',
      description: 'Added via UPI',
      date: '2026-09-01T08:00:00.000Z',
    },
  ],
};

export const getWallet = async () => {
  try {
    const localRaw = await AsyncStorage.getItem(LOCAL_WALLET_KEY);
    const balance = localRaw !== null ? Number(localRaw) : MOCK_WALLET.balance;

    try {
      const response = await apiClient.get(WALLET_ROUTES.getWallet);
      if (response?.data?.balance !== undefined) {
        return response.data;
      }
    } catch (e) {}

    return {
      ...MOCK_WALLET,
      balance,
      walletBalance: balance,
    };
  } catch (error) {
    return MOCK_WALLET;
  }
};

export const getWalletBalance = async () => {
  try {
    const localRaw = await AsyncStorage.getItem(LOCAL_WALLET_KEY);
    if (localRaw !== null) {
      return { balance: Number(localRaw) };
    }
    const data = await getWallet();
    return { balance: data.balance || 1250 };
  } catch (error) {
    return { balance: 1250 };
  }
};

export const getWalletTransactions = async (params = {}) => {
  try {
    const data = await getWallet();
    return { transactions: data.transactions || [] };
  } catch (error) {
    return { transactions: MOCK_WALLET.transactions };
  }
};

export default {
  getWallet,
  getWalletBalance,
  getWalletTransactions,
};
