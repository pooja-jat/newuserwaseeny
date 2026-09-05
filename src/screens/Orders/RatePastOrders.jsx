import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Star } from 'lucide-react-native';

import { CartContext } from '../../context/CartContext';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

const FALLBACK_IMAGE = require('../../assets/images/Noodle.png');

function formatDate(isoString) {
  if (!isoString) return 'N/A';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return 'N/A';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month}, ${year}`;
}

function getImageSource(image) {
  if (!image) return FALLBACK_IMAGE;
  if (typeof image === 'string') return { uri: image };
  return FALLBACK_IMAGE;
}

export default function RatePastOrders() {
  const navigation = useNavigation();
  const cartContext = useContext(CartContext);
  const contextOrders = cartContext?.orders || [];
  const fetchContextOrders = cartContext?.fetchOrders;
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch orders on mount
  useEffect(() => {
    const initFetch = async () => {
      console.log('🔵 RatePastOrders: Mount - Starting order fetch');
      try {
        if (fetchContextOrders) {
          console.log('🔵 RatePastOrders: Calling fetchContextOrders()...');
          await fetchContextOrders();
          console.log('🔵 RatePastOrders: fetchContextOrders() completed');
        } else {
          console.log('🔴 RatePastOrders: fetchContextOrders is not available');
        }
      } catch (error) {
        console.error('🔴 RatePastOrders: Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    initFetch();
  }, [fetchContextOrders]);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (fetchContextOrders) {
        await fetchContextOrders();
      }
    } catch (error) {
      console.error('Error refreshing orders:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchContextOrders]);

  // Filter delivered orders (updates whenever contextOrders changes)
  const deliveredOrders = contextOrders.filter(
    order => order?.status?.toLowerCase() === 'delivered'
  );
  
  const ordersToDisplay = deliveredOrders;

  console.log('🔵 RatePastOrders: Render state:', {
    contextOrdersLength: contextOrders?.length || 0,
    contextOrders: contextOrders?.map(o => ({ id: o._id || o.id, status: o.status })) || [],
    deliveredOrdersLength: deliveredOrders.length,
    deliveredOrders: deliveredOrders.map(o => ({ id: o._id || o.id, status: o.status })),
  });

  const renderOrderCard = ({ item: order }) => {
    const orderId = order?.id || order?._id || 'N/A';
    const items = Array.isArray(order?.items) ? order.items : [];
    const firstItem = items[0];
    
    const restaurantName =
      (typeof order?.restaurant?.name === 'object' 
        ? order?.restaurant?.name?.en 
        : order?.restaurant?.name) ||
      order?.restaurantName ||
      firstItem?.restaurant?.name ||
      'Restaurant';

    const itemImage =
      order?.restaurant?.image ||
      order?.restaurantImage ||
      firstItem?.product?.image ||
      firstItem?.image;

    const totalAmount = order?.totalAmount || order?.total || 0;
    const itemCount = items.length;
    const orderDate = formatDate(order?.createdAt || order?.deliveredAt);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => {
          
          navigation.navigate('OrderDetailsScreen', { 
            orderId,
            orderData: order 
          });
        }}
      >
        <View style={styles.cardContent}>
          <Image
            source={getImageSource(itemImage)}
            style={styles.orderImage}
          />
          
          <View style={styles.orderInfo}>
            <Text style={styles.restaurantName} numberOfLines={1}>
              {restaurantName}
            </Text>
            <Text style={styles.orderDetails}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'} • ₹{totalAmount.toFixed(2)}
            </Text>
            <Text style={styles.orderDate}>{orderDate}</Text>
            
            <View style={styles.ratingPrompt}>
              <Star size={14} color="#FFB800" fill="#FFB800" />
              <Text style={styles.ratingText}>Tap to rate this order</Text>
            </View>
          </View>

          <View style={styles.chevronContainer}>
            <Text style={styles.chevron}>›</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Star size={64} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Delivered Orders</Text>
      <Text style={styles.emptySubtitle}>
        Your delivered orders will appear here for rating
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate Past Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading && contextOrders.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E53935" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={ordersToDisplay}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item?.id || item?._id || Math.random().toString()}
          contentContainerStyle={ordersToDisplay.length === 0 ? styles.flatListEmpty : styles.flatListContent}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#E53935']}
              tintColor="#E53935"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: scale(40),
    height: scale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    color: '#000000',
  },
  placeholder: {
    width: scale(40),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: FONT_SIZES.sm,
    color: '#666666',
    fontWeight: '500',
  },
  scrollContent: {
    flexGrow: 1,
  },
  flatListContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  flatListEmpty: {
    flexGrow: 1,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: scale(12),
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  orderImage: {
    width: scale(80),
    height: scale(80),
    borderRadius: scale(10),
    backgroundColor: '#F5F5F5',
  },
  orderInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  restaurantName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#000000',
    marginBottom: scale(4),
  },
  orderDetails: {
    fontSize: FONT_SIZES.sm,
    color: '#666666',
    marginBottom: scale(4),
  },
  orderDate: {
    fontSize: FONT_SIZES.xs,
    color: '#999999',
    marginBottom: scale(8),
  },
  ratingPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(6),
  },
  ratingText: {
    fontSize: FONT_SIZES.xs,
    color: '#E53935',
    fontWeight: '600',
  },
  chevronContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SPACING.xs,
  },
  chevron: {
    fontSize: scale(28),
    color: '#CCCCCC',
    fontWeight: '300',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: '#333333',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: FONT_SIZES.sm,
    color: '#999999',
    textAlign: 'center',
    lineHeight: scale(20),
  },
});
