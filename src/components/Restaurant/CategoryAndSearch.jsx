import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { scale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

export const SearchBar = memo(({ value, onChangeText, placeholder = 'Search Dish Name....' }) => {
  return (
    <View style={styles.searchBox}>
      <Search size={18} color={COLORS.primary} />
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
});

export const CategoryPills = memo(({ categories, activeCategory, onCategoryPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.catRow}
    >
      {(categories || []).map(cat => (
        <TouchableOpacity key={cat.id} onPress={() => onCategoryPress(cat.id)} activeOpacity={0.8}>
          <View
            style={[
              styles.catPill,
              activeCategory === cat.id && styles.catPillActive,
            ]}
          >
            <Text
              style={[
                styles.catText,
                activeCategory === cat.id && styles.catTextActive,
              ]}
            >
              {cat.name || cat}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  searchBox: {
    margin: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textDark,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    paddingVertical: scale(2),
  },
  catRow: {
    paddingLeft: SPACING.md,
    marginBottom: SPACING.sm,
  },
  catPill: {
    marginRight: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: scale(8),
    borderRadius: scale(18),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: FONT_SIZES.xs,
  },
  catTextActive: {
    color: '#FFFFFF',
  },
});
