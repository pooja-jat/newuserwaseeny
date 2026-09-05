import React, { memo } from 'react';
import { View, Image, Text, Pressable, StyleSheet } from 'react-native';
import { Heart, Minus, Plus } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';

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
          <Image source={{ uri: item.image }} style={styles.itemImg} />
          <Pressable
            style={styles.itemFavBtn}
            hitSlop={10}
            onPress={onFavoritePress}
          >
            <Heart
              size={14}
              color={isFavorite ? '#FF3D3D' : '#111'}
              fill={isFavorite ? '#FF3D3D' : 'transparent'}
            />
          </Pressable>
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
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
            <Text style={styles.bestSeller}>Highly Reordered</Text>
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
                <Minus size={12} color="#111" />
              </Pressable>
              <Text style={styles.stepQty}>{quantity}</Text>
              <Pressable
                style={styles.stepBtn}
                hitSlop={10}
                onPress={onIncrement}
              >
                <Plus size={12} color="#111" />
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.addPlusBtn}
              hitSlop={10}
              onPress={onQuickAdd}
            >
              <Plus size={14} color="#111" />
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
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#EDEDED',
    marginHorizontal: SPACING.md,
    marginVertical: SPACING.sm,
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
    width: scale(64),
    height: scale(64),
    borderRadius: scale(12),
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
    color: '#111',
    flex: 1,
  },
  itemPrice: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '800',
    color: '#111',
    marginBottom: scale(2),
  },
  itemSubtitle: {
    marginTop: scale(1),
    fontSize: FONT_SIZES.xs,
    color: '#222',
    fontWeight: '600',
  },
  desc: {
    fontSize: FONT_SIZES.xs,
    color: '#777',
    marginTop: scale(2),
  },
  bestSeller: {
    color: '#D84C4C',
    fontSize: FONT_SIZES.xs,
    marginTop: SPACING.xs,
    fontWeight: '700',
    backgroundColor: '#FFE8E8',
    paddingHorizontal: SPACING.sm,
    paddingVertical: scale(3),
    borderRadius: scale(10),
    alignSelf: 'flex-start',
  },
  addPlusBtn: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(5),
    backgroundColor: '#E6E6E6',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: scale(12),
    paddingHorizontal: SPACING.sm,
    height: scale(24),
    backgroundColor: '#FFF',
  },
  stepBtn: {
    width: scale(22),
    height: scale(22),
    borderRadius: scale(11),
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepQty: {
    minWidth: scale(16),
    textAlign: 'center',
    fontWeight: '900',
    color: '#111',
    fontSize: FONT_SIZES.xs,
    marginHorizontal: scale(2),
  },
});
