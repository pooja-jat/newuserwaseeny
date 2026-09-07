import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

export const CartBottomBar = memo(({ cartCount, subtotal, onPress }) => {
  if (cartCount <= 0) {
    return null;
  }

  return (
    <View style={styles.cartBar}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cartBarTitle}>Items in cart: {cartCount}</Text>
        <Text style={styles.cartBarSub}>Subtotal ₹{subtotal}</Text>
      </View>

      <TouchableOpacity
        style={styles.cartBtn}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <Text style={styles.cartBtnText}>View Cart</Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  cartBar: {
    position: 'absolute',
    left: SPACING.md,
    right: SPACING.md,
    bottom: SPACING.md,
    backgroundColor: COLORS.textDark,
    borderRadius: scale(16),
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cartBarTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZES.sm,
  },
  cartBarSub: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: FONT_SIZES.xs,
    marginTop: scale(2),
  },
  cartBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: scale(12),
  },
  cartBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: FONT_SIZES.xs,
  },
});
