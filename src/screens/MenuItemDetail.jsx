import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, ShoppingBag } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../context/CartContext';
import { COLORS } from '../theme/colors';
import { scale } from '../utils/scale';
import { SPACING } from '../theme/spacing';
import { FONT_SIZES } from '../theme/typography';

export default function MenuItemDetail() {
  const navigation = useNavigation();
  const route = useRoute();
  const { menuItem, restaurant } = route.params || {};
  const [qty, setQty] = useState(1);
  const { addToCart } = useContext(CartContext);

  if (!menuItem) return null;

  const handleAddToCart = () => {
    addToCart({
      ...menuItem,
      quantity: qty,
      qty,
      restaurantId: restaurant?.id || restaurant?._id || menuItem.restaurantId || 'r1',
      restaurantName: restaurant?.name || menuItem.restaurantName || 'Restaurant',
      restaurant,
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TouchableOpacity
        style={styles.close}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <X size={22} color={COLORS.textDark} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <Image
          source={
            menuItem.image
              ? { uri: menuItem.image }
              : require('../assets/images/Food.png')
          }
          style={styles.image}
        />
        
        <View style={styles.contentWrap}>
          <Text style={styles.title}>{menuItem.name}</Text>
          <Text style={styles.price}>₹{menuItem.price || menuItem.basePrice || 199}</Text>
          
          {menuItem.description ? (
            <Text style={styles.desc}>{menuItem.description}</Text>
          ) : null}

          {menuItem.isVeg !== undefined && (
            <View style={styles.vegBadge}>
              <Text style={[styles.vegText, { color: menuItem.isVeg ? COLORS.primary : COLORS.accent }]}>
                {menuItem.isVeg ? '🌱 Pure Veg' : '🍗 Non-Veg'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <View style={styles.qtyBox}>
          <TouchableOpacity
            style={styles.qtyBtnWrap}
            onPress={() => qty > 1 && setQty(qty - 1)}
          >
            <Text style={styles.qtyBtn}>−</Text>
          </TouchableOpacity>

          <Text style={styles.qty}>{qty}</Text>

          <TouchableOpacity
            style={styles.qtyBtnWrap}
            onPress={() => setQty(qty + 1)}
          >
            <Text style={styles.qtyBtn}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.85}
          onPress={handleAddToCart}
        >
          <ShoppingBag size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.addText}>
            Add to Cart • ₹{((menuItem.price || menuItem.basePrice || 199) * qty).toFixed(0)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  close: {
    position: 'absolute',
    top: 44,
    right: 16,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: scale(280),
    backgroundColor: '#F0F0F0',
  },
  contentWrap: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  price: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: scale(6),
  },
  desc: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: scale(10),
    lineHeight: 22,
  },
  vegBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(12),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginTop: scale(12),
  },
  vegText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(14),
    borderTopWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: '#FFFFFF',
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(22),
    paddingHorizontal: scale(8),
    height: scale(44),
    backgroundColor: '#FFFFFF',
  },
  qtyBtnWrap: {
    width: scale(28),
    height: scale(28),
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtn: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  qty: {
    marginHorizontal: scale(8),
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDark,
  },
  addBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    height: scale(44),
    borderRadius: scale(22),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: scale(12),
    elevation: 3,
  },
  addText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
  },
});
