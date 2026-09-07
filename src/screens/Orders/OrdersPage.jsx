import React, { useContext, useMemo, useState, useEffect, useCallback, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';

import { CartContext } from '../../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { wp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

const FALLBACK_ITEM_IMAGE = require('../../assets/images/Noodle.png');

function formatOrderDateTime(isoString) {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return { dateLine1: 'Recently placed', dateLine2: '' };

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];

  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = ((hours24 + 11) % 12) + 1;

  return {
    dateLine1: `Order placed on ${day} ${month},`,
    dateLine2: `${hours12}:${minutes} ${ampm}`,
  };
}

function getImageSource(image) {
  if (!image) return FALLBACK_ITEM_IMAGE;
  if (typeof image === 'number') return image;
  if (typeof image === 'string' && image.length > 0) return { uri: image };
  if (typeof image === 'object' && image.uri) return image;
  return FALLBACK_ITEM_IMAGE;
}

function deriveStatusUi(order) {
  const raw = String(order?.status || '').toUpperCase();

  if (raw.includes('DELIVERED') || raw.includes('COMPLETE')) {
    return {
      status: 'Delivered',
      statusColor: COLORS.primary,
      completed: true,
      badgeBg: COLORS.primaryLight,
    };
  }

  if (raw.includes('CANCEL')) {
    return {
      status: 'Cancelled',
      statusColor: '#8C9099',
      completed: false,
      badgeBg: '#F0F0F0',
    };
  }

  if (raw.includes('OUT_FOR_DELIVERY') || raw.includes('SHIPPING')) {
    return {
      status: 'Out for Delivery',
      statusColor: COLORS.accent,
      completed: false,
      badgeBg: COLORS.accentLight,
      note: 'Your delivery rider is on the way to your address',
    };
  }

  return {
    status: 'Preparing Food',
    statusColor: COLORS.accent,
    completed: false,
    badgeBg: COLORS.accentLight,
    note: 'The chef is preparing your delicious meal',
  };
}

export default function OrdersScreen() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { orders, fetchOrders } = useContext(CartContext);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchOrders();
    } catch (error) {
      console.log('Refresh error:', error?.message);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders]);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        await fetchOrders();
      } catch (error) {
        console.log('Orders screen error:', error?.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [fetchOrders]);

  const data = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return list
      .map(o => {
        const ui = deriveStatusUi(o);
        return {
          ...o,
          ...ui,
        };
      })
      .filter(o => {
        if (statusFilter === 'All') return true;
        if (statusFilter === 'Ongoing') return !o.completed && o.status !== 'Cancelled';
        if (statusFilter === 'Completed') return o.completed === true;
        if (statusFilter === 'Cancelled') return o.status === 'Cancelled';
        return true;
      });
  }, [orders, statusFilter]);

  const handleFilterChange = useCallback((status) => {
    setStatusFilter(status);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Your Orders</Text>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        {['All', 'Ongoing', 'Completed', 'Cancelled'].map(status => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterChip,
              statusFilter === status && styles.filterChipActive,
            ]}
            onPress={() => handleFilterChange(status)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                statusFilter === status && styles.filterChipTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : data.length === 0 ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          <Text style={styles.emptyText}>
            {statusFilter !== 'All' ? `No ${statusFilter.toLowerCase()} orders` : 'No orders yet'}
          </Text>
          <Text style={styles.emptySubText}>
            {statusFilter === 'All' ? 'Your placed orders will appear here' : 'Check other tabs or place a new order'}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => String(item._id || item.id || Math.random())}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
          renderItem={({ item }) => <OrderCard item={item} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const OrderCard = memo(function OrderCard({ item }) {
  const navigation = useNavigation();

  const handlePress = useCallback(() => {
    navigation.navigate("OrderDetailsScreen", { 
      orderId: item._id || item.id || item.orderNumber,
      orderData: item,
    });
  }, [navigation, item]);

  const restaurantName =
    item?.restaurant?.name?.en || item?.restaurant?.name || item?.restaurantName || 'Restaurant';

  const items = Array.isArray(item?.items) ? item.items : [];
  const shownItems = items.slice(0, 2);
  const remainingCount = Math.max(0, items.length - shownItems.length);

  const cuisineLine = items
    .map(it => it?.name || it?.product?.name?.en || it?.productName)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  const { dateLine1, dateLine2 } = formatOrderDateTime(item?.createdAt);

  const total =
    typeof item?.totalAmount === 'number'
      ? item.totalAmount
      : typeof item?.totals?.grandTotal === 'number'
      ? item.totals.grandTotal
      : typeof item?.grandTotal === 'number'
      ? item.grandTotal
      : typeof item?.totals?.subtotal === 'number'
      ? item.totals.subtotal
      : typeof item?.subtotal === 'number'
      ? item.subtotal
      : 350;

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Restaurant Header */}
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={styles.restaurant}>{restaurantName}</Text>
          <Text style={styles.cuisine} numberOfLines={1}>
            {cuisineLine || 'Delicious Food'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: item.badgeBg || COLORS.primaryLight }]}>
          <Text style={[styles.statusBadgeText, { color: item.statusColor || COLORS.primary }]}>
            {item.status}
          </Text>
        </View>
      </View>

      {/* Items */}
      <View style={styles.itemsWrapper}>
        {shownItems.map((it, idx) => (
          <View key={String(it?._id || it?.id || idx)} style={styles.itemRow}>
            <Image source={getImageSource(it?.image || it?.product?.image)} style={styles.itemImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {it?.name || it?.product?.name?.en || it?.productName || 'Item'}
              </Text>
              <Text style={styles.itemSub}>
                Qty: {it?.quantity || it?.qty || 1} • ₹{it?.price || 199}
              </Text>
            </View>
          </View>
        ))}

        {remainingCount > 0 && (
          <Text style={styles.moreText}>+{remainingCount} more items</Text>
        )}
      </View>

      {/* Status Note if ongoing */}
      {!!item.note && (
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{item.note}</Text>
        </View>
      )}

      {/* Date & Price Footer */}
      <View style={styles.divider} />
      <View style={styles.rowBetweenBottom}>
        <View>
          <Text style={styles.date}>{dateLine1} {dateLine2}</Text>
          <Text style={styles.orderNo}>ID: {item.orderNumber || item._id || item.id}</Text>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>₹{total}</Text>
          <ChevronRight size={18} color={COLORS.primary} />
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },
  header: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textDark,
    marginVertical: SPACING.md,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(8),
    borderRadius: scale(20),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: scale(16),
    padding: SPACING.md,
    marginBottom: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowBetweenBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  restaurant: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  cuisine: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: scale(2),
  },
  statusBadge: {
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  statusBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  itemsWrapper: {
    marginVertical: SPACING.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
  },
  itemImg: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(8),
    marginRight: SPACING.sm,
  },
  itemTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  itemSub: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: scale(2),
  },
  moreText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.accent,
    fontWeight: '600',
    marginLeft: scale(48),
  },
  noteBox: {
    backgroundColor: COLORS.accentLight,
    borderRadius: scale(8),
    padding: scale(8),
    marginVertical: scale(4),
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  noteText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.xs,
  },
  date: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
  },
  orderNo: {
    fontSize: FONT_SIZES.xs - 2,
    color: COLORS.textLight,
    marginTop: scale(2),
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
  },
  price: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingTop: hp(15),
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
});