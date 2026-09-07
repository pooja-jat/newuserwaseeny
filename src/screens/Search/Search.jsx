import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import { Search as SearchIcon, RotateCcw, X, Utensils, Store } from 'lucide-react-native';
import { searchRestaurantsAndProducts, getSearchSuggestions } from '../../services/searchService';
import { getRestaurantDetails } from '../../services/restaurantService';
import { wp, hp } from '../../utils/responsive';
import { scale, fontScale } from '../../utils/scale';
import { FONT_SIZES } from '../../theme/typography';
import { SPACING } from '../../theme/spacing';
import { COLORS } from '../../theme/colors';

const FALLBACK_IMAGE = require('../../assets/images/Noodle.png');
const SEARCH_DEBOUNCE_DELAY = 300;

export default function SearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const skipDebounceRef = useRef(false);
  const abortControllerRef = useRef(null);
  const currentRequestIdRef = useRef(0);
  
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ restaurants: [], products: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['Burger', 'Pizza', 'Biryani']);
  const [fetchingRestaurantId, setFetchingRestaurantId] = useState(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    }, []),
  );

  useEffect(() => {
    if (route?.params?.autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus?.();
      }, 80);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [route?.params?.autoFocus]);

  // Handle initial category/query from route params
  useEffect(() => {
    const initialQuery = route?.params?.initialQuery || route?.params?.category;
    if (initialQuery) {
      skipDebounceRef.current = true;
      setQuery(initialQuery);
      triggerSearch(initialQuery);
    }
  }, [route?.params?.initialQuery, route?.params?.category]);

  const triggerSearch = async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length === 0) return;

    try {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const currentRequestId = ++currentRequestIdRef.current;
      
      setLoading(true);
      const trimmedQuery = searchQuery.trim();
      
      const [sug, results] = await Promise.all([
        getSearchSuggestions(trimmedQuery).catch(() => []),
        searchRestaurantsAndProducts(trimmedQuery).catch(() => ({ restaurants: [], products: [] })),
      ]);

      if (currentRequestId === currentRequestIdRef.current) {
        setSuggestions(Array.isArray(sug) ? sug : []);
        const rList = results?.restaurants || results?.results?.restaurants || [];
        const pList = results?.products || results?.results?.products || [];
        setSearchResults({
          restaurants: rList,
          products: pList,
        });
      }
    } catch (e) {
      console.warn('Search execution error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length === 0) {
      setSuggestions([]);
      setSearchResults({ restaurants: [], products: [] });
      setLoading(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      triggerSearch(query);
    }, SEARCH_DEBOUNCE_DELAY);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  // Combine and format results
  const results = useMemo(() => {
    if (query.trim().length === 0) return [];

    const list = [];
    const addedIds = new Set();

    // Add matching restaurants first
    if (Array.isArray(searchResults.restaurants)) {
      searchResults.restaurants.forEach(restaurant => {
        const id = restaurant._id || restaurant.id;
        if (!id || addedIds.has(id)) return;
        addedIds.add(id);

        const cuisines = Array.isArray(restaurant.cuisines)
          ? restaurant.cuisines.join(', ')
          : restaurant.cuisines || 'Multi-Cuisine';

        list.push({
          type: 'restaurant',
          id: id,
          restaurant,
          title: restaurant.name?.en || restaurant.name || 'Restaurant',
          subtitle: cuisines,
          image: restaurant.logo || restaurant.coverImage || restaurant.image,
          rating: restaurant.rating || 4.8,
        });
      });
    }

    // Add matching products / dishes
    if (Array.isArray(searchResults.products)) {
      searchResults.products.forEach(product => {
        const id = product._id || product.id;
        if (!id || addedIds.has(id)) return;
        addedIds.add(id);

        const restId = product.restaurantId || product.restaurant_id || product.restaurant?._id || 'r1';

        list.push({
          type: 'dish',
          id: id,
          product: {
            ...product,
            restaurantId: restId,
          },
          restaurantId: restId,
          title: product.name?.en || product.name || 'Dish',
          subtitle: product.restaurantName || product.restaurant?.name || 'Restaurant Special',
          image: product.image,
          price: product.price || product.basePrice || 199,
          rating: product.rating || 4.7,
        });
      });
    }

    return list;
  }, [query, searchResults]);

  const handleResultPress = async (item) => {
    if (item.title && !recentSearches.includes(item.title)) {
      setRecentSearches(prev => [item.title, ...prev].slice(0, 5));
    }

    if (item.type === 'restaurant' && item.restaurant) {
      navigation.navigate('RestaurantDetail', {
        restaurant: item.restaurant,
      });
    } else if (item.type === 'dish') {
      const restId = item.restaurantId || item.product?.restaurantId || 'r1';
      try {
        setFetchingRestaurantId(item.id);
        const restDetails = await getRestaurantDetails(restId);
        navigation.navigate('RestaurantDetail', {
          restaurant: restDetails,
        });
      } catch (e) {
        console.warn('Error fetching restaurant for dish:', e);
      } finally {
        setFetchingRestaurantId(null);
      }
    }
  };

  const handleTagPress = (tag) => {
    skipDebounceRef.current = true;
    setQuery(tag);
    triggerSearch(tag);
    if (!recentSearches.includes(tag)) {
      setRecentSearches(prev => [tag, ...prev].slice(0, 5));
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* HEADER */}
      <Text style={styles.title}>Search Dishes & Restaurants</Text>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
        <SearchIcon size={18} color={COLORS.primary} />
        <TextInput
          placeholder="Search by Dish, Cuisine or Restaurant..."
          placeholderTextColor={COLORS.textMuted}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          ref={inputRef}
          returnKeyType="search"
          onSubmitEditing={() => triggerSearch(query)}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
              }
              if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
              }
              setQuery('');
              setSuggestions([]);
              setSearchResults({ restaurants: [], products: [] });
            }}
          >
            <X size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: SPACING.xxl }}>
        {query.trim().length > 0 ? (
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Searching menu & restaurants...</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No results found for "{query}"</Text>
                <Text style={styles.emptySubText}>Try searching for Pizza, Burger, Biryani, or Chinese</Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Results ({results.length})
                </Text>
                {results.map(item => (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.resultRow}
                    activeOpacity={0.85}
                    onPress={() => handleResultPress(item)}
                    disabled={fetchingRestaurantId === item.id}
                  >
                    <Image
                      source={
                        item.image && typeof item.image === 'string'
                          ? { uri: item.image }
                          : FALLBACK_IMAGE
                      }
                      style={styles.resultImage}
                    />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.resultSub} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                      {typeof item.price === 'number' ? (
                        <Text style={styles.resultPrice}>
                          ₹{item.price.toFixed(0)}
                        </Text>
                      ) : null}
                    </View>
                    <View style={styles.resultTypeContainer}>
                      {fetchingRestaurantId === item.id ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                      ) : (
                        <View style={[styles.typeBadge, item.type === 'restaurant' ? styles.restaurantBadge : styles.dishBadge]}>
                          {item.type === 'restaurant' ? (
                            <Store size={12} color={COLORS.primary} />
                          ) : (
                            <Utensils size={12} color={COLORS.accent} />
                          )}
                          <Text style={[styles.resultType, { color: item.type === 'restaurant' ? COLORS.primary : COLORS.accent }]}>
                            {item.type === 'restaurant' ? 'Restaurant' : 'Dish'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* RECENT SEARCH */}
            {recentSearches.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your Recent Searches</Text>

                {recentSearches.map((search, index) => (
                  <TouchableOpacity
                    key={String(index)}
                    style={styles.recentItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      setQuery(search);
                      triggerSearch(search);
                    }}
                  >
                    <RotateCcw size={15} color={COLORS.textMuted} />
                    <Text style={styles.recentText}>{search}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* POPULAR SEARCH */}
            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>
              Popular Cuisines & Dishes
            </Text>

            <View style={styles.tagWrapper}>
              <Tag label="🍕 Pizza" onPress={() => handleTagPress('Pizza')} />
              <Tag label="🍔 Burgers" onPress={() => handleTagPress('Burger')} />
              <Tag label="🍛 Biryani" onPress={() => handleTagPress('Biryani')} />
              <Tag label="🍜 Chinese" onPress={() => handleTagPress('Chinese')} />
              <Tag label="🥗 Healthy Bowls" onPress={() => handleTagPress('Healthy')} />
              <Tag label="🍰 Desserts" onPress={() => handleTagPress('Dessert')} />
              <Tag label="🥤 Cold Drinks" onPress={() => handleTagPress('Drinks')} />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* TAG COMPONENT */
const Tag = ({ label, onPress }) => (
  <TouchableOpacity style={styles.tag} activeOpacity={0.8} onPress={onPress}>
    <Text style={styles.tagText}>{label}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.md,
  },

  title: {
    marginTop: hp(1.5),
    marginBottom: SPACING.md,
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
    color: COLORS.textDark,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: scale(46),
    borderRadius: scale(23),
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(14),
    marginBottom: SPACING.lg,
    elevation: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  input: {
    flex: 1,
    marginLeft: scale(10),
    fontSize: fontScale(13),
    color: COLORS.textDark,
    fontWeight: '600',
  },
  clearBtn: {
    width: scale(28),
    height: scale(28),
    borderRadius: scale(14),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
  },

  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: SPACING.sm,
  },

  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: scale(40),
  },

  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.xs,
    color: COLORS.textMuted,
    fontWeight: '600',
  },

  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(10),
    paddingHorizontal: scale(8),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },

  recentText: {
    marginLeft: scale(10),
    fontSize: FONT_SIZES.sm,
    color: COLORS.textDark,
    fontWeight: '500',
  },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: scale(12),
    paddingHorizontal: scale(10),
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    marginBottom: scale(10),
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  resultImage: {
    width: scale(52),
    height: scale(52),
    borderRadius: scale(10),
    backgroundColor: '#F4F4F4',
  },
  resultContent: {
    flex: 1,
    marginLeft: scale(12),
  },
  resultTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  resultSub: {
    marginTop: scale(2),
    fontSize: fontScale(11),
    color: COLORS.textMuted,
  },
  resultPrice: {
    marginTop: scale(4),
    fontSize: fontScale(12),
    color: COLORS.primary,
    fontWeight: '800',
  },
  resultTypeContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: scale(8),
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(4),
    paddingHorizontal: scale(8),
    paddingVertical: scale(4),
    borderRadius: scale(12),
  },
  restaurantBadge: {
    backgroundColor: COLORS.primaryLight,
  },
  dishBadge: {
    backgroundColor: COLORS.accentLight,
  },
  resultType: {
    fontSize: fontScale(10),
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: hp(8),
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

  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(8),
  },

  tag: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderRadius: scale(20),
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },

  tagText: {
    fontSize: fontScale(12),
    color: COLORS.textDark,
    fontWeight: '600',
  },
});
