import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Animated,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';

const { width: screenWidth } = Dimensions.get('window');

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price_low_high', label: 'Price: Low to High' },
  { id: 'price_high_low', label: 'Price: High to Low' },
  { id: 'rating', label: 'Most Popular' },
  { id: 'newest', label: 'Newest' },
];

const MIN_PRICE_RANGE = 0;
const MAX_PRICE_RANGE = 5000;
const MIN_PRICE_GAP = 50;

export default function FilterDrawer({ visible, onClose, onReset, onApply }) {
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const drawerWidth = useMemo(() => Math.min(screenWidth, 360), []);

  const [minPrice, setMinPrice] = useState(MIN_PRICE_RANGE);
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE_RANGE);
  const [sortBy, setSortBy] = useState('relevance');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      translateX.setValue(screenWidth);
      overlayOpacity.setValue(0);
      
  
      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth - drawerWidth,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(overlayOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: screenWidth,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth, translateX, overlayOpacity]);



  const handleReset = () => {
    setMinPrice(MIN_PRICE_RANGE);
    setMaxPrice(MAX_PRICE_RANGE);
    setSortBy('relevance');
    setSearchQuery('');
    if (onReset) {
      onReset();
    }
  };

  const handleApply = () => {
    if (!searchQuery.trim()) {
      Alert.alert('Search Required', 'Please enter a search query (e.g., pizza, burger, restaurant name)');
      return;
    }

    const safeMinPrice = Math.max(MIN_PRICE_RANGE, Number(minPrice) || MIN_PRICE_RANGE);
    const safeMaxPrice = Math.min(MAX_PRICE_RANGE, Number(maxPrice) || MAX_PRICE_RANGE);
    const normalizedMinPrice = Math.min(safeMinPrice, safeMaxPrice - MIN_PRICE_GAP);
    const normalizedMaxPrice = Math.max(safeMaxPrice, normalizedMinPrice + MIN_PRICE_GAP);

    const hasCustomPriceRange =
      normalizedMinPrice > MIN_PRICE_RANGE || normalizedMaxPrice < MAX_PRICE_RANGE;

    const filterData = {
      searchQuery: searchQuery.trim(),
      sortBy,
      minPrice: hasCustomPriceRange ? normalizedMinPrice : null,
      maxPrice: hasCustomPriceRange ? normalizedMaxPrice : null,
    };
    
    if (onApply) {
      onApply(filterData);
    }
    if (onClose) {
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View
        style={[
          styles.drawer,
          {
            width: drawerWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={onClose} style={styles.headerBack}>
            <Text style={styles.headerBackText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Filter</Text>
          <Pressable onPress={handleReset} hitSlop={10}>
            <Text style={styles.headerReset}>Reset</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search (e.g., pizza, burger)"
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map(option => {
                const isActive = sortBy === option.id;
                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setSortBy(option.id)}
                    style={[
                      styles.sortOption,
                      isActive && styles.sortOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        isActive && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Price range</Text>
            
            <View style={styles.sliderContainer}>
              <View>
                <Text style={styles.sliderLabel}>Min Price</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={MIN_PRICE_RANGE}
                  maximumValue={maxPrice - 100}
                  value={minPrice}
                  onValueChange={value => setMinPrice(Math.round(value))}
                  step={50}
                  minimumTrackTintColor="#FF6B35"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#FF6B35"
                />
                <Text style={styles.sliderValueText}>₹{minPrice}</Text>
              </View>

              <View>
                <Text style={styles.sliderLabel}>Max Price</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={minPrice + 100}
                  maximumValue={MAX_PRICE_RANGE}
                  value={maxPrice}
                  onValueChange={value => setMaxPrice(Math.round(value))}
                  step={50}
                  minimumTrackTintColor="#FF6B35"
                  maximumTrackTintColor="#ccc"
                  thumbTintColor="#FF6B35"
                />
                <Text style={styles.sliderValueText}>₹{maxPrice}</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={String(minPrice)}
                  onChangeText={val => {
                    const num = parseInt(val, 10) || MIN_PRICE_RANGE;
                    if (num >= MIN_PRICE_RANGE && num < maxPrice) {
                      setMinPrice(num);
                    }
                  }}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                  placeholder="Min"
                />
              </View>
              <Text style={styles.priceDash}>-</Text>
              <View style={styles.priceInputWrap}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={String(maxPrice)}
                  onChangeText={val => {
                    const num = parseInt(val, 10) || MAX_PRICE_RANGE;
                    if (num > minPrice && num <= MAX_PRICE_RANGE) {
                      setMaxPrice(num);
                    }
                  }}
                  keyboardType="number-pad"
                  style={styles.priceInput}
                  placeholder="Max"
                />
              </View>
            </View>
          </View>

          <Pressable style={styles.searchBtn} onPress={handleApply}>
            <Text style={styles.searchBtnText}>Search</Text>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingTop: Platform.OS === 'ios' ? 56 : 28,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F2F2F2',
  },
  headerBackText: {
    fontSize: 16,
    color: '#111111',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
  },
  headerReset: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#F9F9F9',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  optionLabel: {
    fontSize: 13,
    color: '#4A4A4A',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.4,
    borderColor: '#9E9E9E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#111111',
  },
  checkMark: {
    fontSize: 12,
    color: '#111111',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  sortOptionActive: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFECEC',
  },
  sortOptionText: {
    fontSize: 13,
    color: '#6E6E6E',
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  sliderContainer: {
    marginBottom: 16,
    gap: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#6E6E6E',
    marginBottom: 6,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValueText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '700',
    marginTop: 6,
  },
  loadingText: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EFEFEF',
    marginTop: 6,
    marginBottom: 12,
    position: 'relative',
  },
  sliderActive: {
    position: 'absolute',
    left: '18%',
    right: '18%',
    height: 4,
    borderRadius: 2,
    backgroundColor: '#111111',
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#111111',
  },
  sliderThumbLeft: {
    left: '18%',
  },
  sliderThumbRight: {
    right: '18%',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
    width: (screenWidth - 120) / 2,
  },
  currency: {
    color: '#6E6E6E',
    fontSize: 13,
  },
  priceInput: {
    flex: 1,
    paddingLeft: 4,
    fontSize: 13,
    color: '#111111',
    paddingVertical: 0,
  },
  priceDash: {
    color: '#6E6E6E',
    fontSize: 16,
    paddingHorizontal: 8,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#6E6E6E',
    marginBottom: 6,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#EFEFEF',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: '#6E6E6E',
  },
  dropdownIcon: {
    fontSize: 14,
    color: '#6E6E6E',
  },
  searchBtn: {
    marginTop: 6,
    marginBottom: 20,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
