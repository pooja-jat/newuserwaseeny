import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useRoute, useNavigation } from '@react-navigation/native';
import { applyFilters, convertDrawerFiltersToAPI } from '../services/filterService';
import { ProductCard } from '../components/ProductCard';
import { SkeletonCard } from '../components/Home/SkeletonLoaders';
import { wp, hp } from '../utils/responsive';
import { scale } from '../utils/scale';
import { FONT_SIZES as FONT } from '../theme/typography';

export default function FilteredResultsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { drawerFilters, searchQuery, apiFilters: propsApiFilters } = route.params || {};

  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNum, setPageNum] = useState(0);
  const itemsPerPage = 8;

  const parseNumeric = useCallback((value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }, []);

  const resolveRestaurantRatingAverage = useCallback((product) => {
    const candidates = [
      product?.restaurantRating,
      product?.restaurantRatingAverage,
      product?.restaurant?.rating?.average,
      product?.restaurant?.ratingAverage,
      product?.restaurant?.rating,
      product?.restaurantData?.rating?.average,
      product?.restaurantData?.ratingAverage,
      product?.restaurantData?.rating,
      product?.rating,
      product?.ratingAverage,
    ];

    for (const candidate of candidates) {
      const parsed = parseNumeric(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }, [parseNumeric]);

  const resolveRestaurantRatingCount = useCallback((product) => {
    const candidates = [
      product?.restaurantRatingCount,
      product?.restaurant?.rating?.count,
      product?.restaurant?.ratingCount,
      product?.restaurantData?.rating?.count,
      product?.restaurantData?.ratingCount,
      product?.ratingCount,
      product?.reviewsCount,
    ];

    for (const candidate of candidates) {
      const parsed = parseNumeric(candidate);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }, [parseNumeric]);

  // Sort function to apply frontend sorting
  const applySorting = useCallback((products, sortBy) => {
    if (!products || products.length === 0) {
      return products || [];
    }

    if (!sortBy || sortBy === 'relevance') {
      return products;
    }

    const sortedProducts = [...products];

    switch (sortBy) {
      case 'price_asc':
      case 'price_low_high':
        sortedProducts.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceA - priceB;
        });
        return sortedProducts;

      case 'price_desc':
      case 'price_high_low':
        sortedProducts.sort((a, b) => {
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          return priceB - priceA;
        });
        return sortedProducts;

      case 'rating_desc':
      case 'rating':
        sortedProducts.sort((a, b) => {
          const ratingA = a.ratingAverage || 0;
          const ratingB = b.ratingAverage || 0;
          return ratingB - ratingA;
        });
        return sortedProducts;

      case 'newest':
        sortedProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        return sortedProducts;

      default:
        return sortedProducts;
    }
  }, []);

  // Fetch filtered results
  const fetchFilteredResults = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!searchQuery) {
        console.error('❌ No search query provided');
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Search query not provided',
          duration: 2000,
        });
        navigation.goBack();
        return;
      }

      setPageNum(0);

      // Convert drawer filters to API format (prefer precomputed filters from route)
      const apiFilters = propsApiFilters || convertDrawerFiltersToAPI(drawerFilters || {});

      // Call the filter API
      const results = await applyFilters(searchQuery, apiFilters);

      const restaurantsList = Array.isArray(results?.restaurants) ? results.restaurants : [];
      const restaurantRatingMap = new Map();

      restaurantsList.forEach(restaurant => {
        const restaurantId = String(restaurant?._id || restaurant?.id || '');
        if (!restaurantId) {
          return;
        }

        const resolvedAverage = parseNumeric(
          restaurant?.rating?.average ?? restaurant?.ratingAverage ?? restaurant?.restaurantRating ?? restaurant?.rating
        );
        const resolvedCount = parseNumeric(
          restaurant?.rating?.count ?? restaurant?.ratingCount ?? restaurant?.restaurantRatingCount
        );

        restaurantRatingMap.set(restaurantId, {
          ratingAverage: resolvedAverage,
          ratingCount: resolvedCount,
        });
      });

      // Map products for display
      if (results?.products && Array.isArray(results.products)) {
        const mappedProducts = results.products.map(product => {
          const restaurantId = String(product.restaurantId || product.restaurant?._id || product.restaurant || '');
          const restaurantRatingMeta = restaurantRatingMap.get(restaurantId);

          const restaurantRatingAverage = resolveRestaurantRatingAverage(product);
          const restaurantRatingCount = resolveRestaurantRatingCount(product);

          const finalRestaurantRatingAverage =
            restaurantRatingAverage !== null ? restaurantRatingAverage : (restaurantRatingMeta?.ratingAverage ?? null);
          const finalRestaurantRatingCount =
            restaurantRatingCount !== null ? restaurantRatingCount : (restaurantRatingMeta?.ratingCount ?? null);
          
          return {
            ...product,
            id: product._id || product.id,
            name: product.name?.en || product.name,
            description: product.description?.en || product.description,
            price: product.basePrice,
            image: product.image,
            isVeg: product.isVeg,
            ratingAverage: finalRestaurantRatingAverage,
            ratingCount: finalRestaurantRatingCount,
            deliveryTime: product.deliveryTime,
            restaurant: {
              id: product.restaurantId || product.restaurant?._id || null,
              name: product.restaurantName?.en || product.restaurantName,
              image: product.restaurantImage,
              bannerImage: product.restaurantBannerImage,
              ratingAverage: finalRestaurantRatingAverage,
              ratingCount: finalRestaurantRatingCount,
            },
          };
        });

        // Apply frontend sorting based on drawerFilters.sortBy
        const sortedProducts = applySorting(mappedProducts, drawerFilters?.sortBy || 'relevance');

        setFilteredItems(sortedProducts);

        if (sortedProducts.length === 0) {
          Toast.show({
            type: 'info',
            text1: 'No Results',
            text2: 'No items matching your filters',
            duration: 2000,
          });
        }
      } else {
        setFilteredItems([]);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Fetch filtered results error:', error?.message);
        console.error('Error response:', error?.response?.data);
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.message || 'Failed to fetch filtered results',
        duration: 2000,
      });

      // Don't go back on error, let user try again
    } finally {
      setIsLoading(false);
    }
  }, [
    searchQuery,
    drawerFilters,
    navigation,
    applySorting,
    parseNumeric,
    propsApiFilters,
    resolveRestaurantRatingAverage,
    resolveRestaurantRatingCount,
  ]);

  // Load more items
  const loadMoreItems = useCallback(() => {
    const newPageNum = pageNum + 1;
    const startIndex = newPageNum * itemsPerPage;

    if (startIndex < filteredItems.length) {
      setPageNum(newPageNum);
    }
  }, [pageNum, filteredItems.length]);

  // Paginated items
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, (pageNum + 1) * itemsPerPage);
  }, [filteredItems, pageNum]);

  // Handle restaurant press
  const handleRestaurantPress = useCallback((item) => {
    navigation.navigate('RestaurantDetail', {
      restaurant: item.restaurant,
    });
  }, [navigation]);

  // Handle back
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  React.useEffect(() => {
    fetchFilteredResults();
  }, [fetchFilteredResults]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filter Results</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Filter info */}
      <View style={styles.filterInfo}>
        <Text style={styles.filterLabel}>Search: </Text>
        <Text style={styles.filterValue}>{searchQuery}</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <FlatList
            data={Array(6).fill(null)}
            keyExtractor={(_, index) => `skeleton-${index}`}
            scrollEnabled={false}
            renderItem={() => <SkeletonCard />}
            contentContainerStyle={styles.listContent}
          />
        </View>
      ) : displayedItems.length > 0 ? (
        <FlatList
          data={displayedItems}
          keyExtractor={item => String(item.id)}
          scrollEnabled={true}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ProductCard
              item={item}
              onPress={() => handleRestaurantPress(item)}
            />
          )}
          onEndReached={loadMoreItems}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={styles.footer}>
              {filteredItems.length > displayedItems.length && (
                <Text style={styles.loadMore}>
                  {filteredItems.length - displayedItems.length} more items...
                </Text>
              )}
            </View>
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyMessage}>
            No items matching your filters. Try adjusting your search criteria.
          </Text>
          <TouchableOpacity
            onPress={fetchFilteredResults}
          >
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  backButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
  },
  backText: {
    fontSize: FONT.md,
    fontWeight: '600',
    color: '#111111',
  },
  headerTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: wp(8),
  },
  filterInfo: {
    flexDirection: 'row',
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    backgroundColor: '#F9F9F9',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterLabel: {
    fontSize: FONT.sm,
    fontWeight: '600',
    color: '#8E8E93',
  },
  filterValue: {
    fontSize: FONT.sm,
    color: '#111111',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: wp(4.44),
    paddingVertical: hp(1),
    paddingBottom: hp(5),
  },
  footer: {
    paddingVertical: hp(2),
    alignItems: 'center',
  },
  loadMore: {
    fontSize: FONT.sm,
    color: '#8E8E93',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyTitle: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: '#111111',
    marginBottom: hp(1),
  },
  emptyMessage: {
    fontSize: FONT.sm,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: hp(3),
  },
  retryButton: {
    paddingHorizontal: wp(8),
    paddingVertical: hp(1.5),
    backgroundColor: '#ed1c24',
    borderRadius: scale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: FONT.sm,
  },
});
