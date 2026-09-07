import React, { memo } from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Heart, Minus, Plus } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

export const MenuItemCard = memo(({
  item,
  quantity,
  isFavorite,
  onPress,
  onFavoritePress,
  onIncrement,
  onDecrement,
  onQuickAdd,
  showDivider,
}) => {
  const itemSubtitle = item?.subtitle || item?.shortDescription || '';
  const itemDesc = item?.detail || item?.description || '';

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={styles.itemRow}
        android_ripple={{ color: '#F5F5F5', borderless: false }}
      >
        <View style={styles.itemImgWrap}>
          <Image
            source={item.image ? { uri: item.image } : require('../../assets/images/Food.png')}
            style={styles.itemImg}
          />
          <Pressable
            style={styles.itemFavBtn}
            hitSlop={10}
            onPress={onFavoritePress}
          >
            <Heart
              size={14}
              color={isFavorite ? COLORS.accent : COLORS.textDark}
              fill={isFavorite ? COLORS.accent : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemPrice}>₹{item.price || item.basePrice || 199}</Text>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          {!!itemSubtitle && (
            <Text style={styles.itemSubtitle} numberOfLines={1}>
              {itemSubtitle}
            </Text>
          )}
          {!!itemDesc && (
            <Text style={styles.desc} numberOfLines={2}>
              {itemDesc}
            </Text>
          )}

          {item.isBestSeller && (
            <Text style={styles.bestSeller}>★ Highly Reordered</Text>
          )}
        </View>

        <View style={styles.actionWrap}>
          {quantity > 0 ? (
            <View style={styles.stepper}>
              <Pressable
                style={styles.stepBtn}
                hitSlop={10}
                onPress={onDecrement}
              >
                <Minus size={12} color={COLORS.primary} />
              </Pressable>
              <Text style={styles.stepQty}>{quantity}</Text>
              <Pressable
                style={styles.stepBtn}
                hitSlop={10}
                onPress={onIncrement}
              >
                <Plus size={12} color={COLORS.primary} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.addPlusBtn}
              hitSlop={10}
              onPress={onQuickAdd}
            >
              <Plus size={14} color="#FFFFFF" />
            </Pressable>
          )}
        </View>
      </Pressable>
      {showDivider ? <View style={styles.itemDivider} /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.xs,
  },
  itemImgWrap: {
    position: 'relative',
    marginRight: SPACING.sm,
  },
  itemFavBtn: {
    position: 'absolute',
    top: scale(-4),
    left: scale(-4),
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  itemImg: {
    width: scale(68),
    height: scale(68),
    borderRadius: scale(12),
    backgroundColor: '#F0F0F0',
  },
  itemContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  actionWrap: {
    minWidth: scale(76),
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textDark,
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: scale(2),
  },
  itemSubtitle: {
    marginTop: scale(1),
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  desc: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    marginTop: scale(2),
  },
  bestSeller: {
    color: COLORS.accentDark,
    fontSize: FONT_SIZES.xs - 1,
    marginTop: SPACING.xs,
    fontWeight: '700',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: scale(2),
    borderRadius: scale(8),
    alignSelf: 'flex-start',
  },
  addPlusBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: scale(14),
    paddingHorizontal: SPACING.xs,
    height: scale(28),
    backgroundColor: '#FFF',
  },
  stepBtn: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQty: {
    minWidth: scale(16),
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.textDark,
    fontSize: FONT_SIZES.xs,
    marginHorizontal: scale(2),
  },
});
