import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FavouritesContext } from '../../context/FavouritesContext';
import { RestaurantListCard } from '../../components/Home/RestaurantCard';
import { wp, hp } from '../../utils/responsive';
import { scale } from '../../utils/scale';
import { FONT_SIZES as FONT } from '../../theme/typography';

export default function RecommendedRestaurants() {
  const navigation = useNavigation();
  const route = useRoute();
  const { isFavourite, toggleFavourite } = useContext(FavouritesContext);
  const recommendedRestaurants = route.params?.recommendedRestaurants || [];

  const handleRestaurantPress = (item) => {
    navigation.navigate('RestaurantDetail', {
      restaurant: item,
    });
  };

  const handleToggleFavorite = async (item) => {
    try {
      await toggleFavourite(item, 'restaurant');
    } catch (error) {
      console.error('Toggle favourite error:', error?.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>All Items</Text>
        <View style={styles.headerSpacer} />
      </View>

      {recommendedRestaurants.length > 0 ? (
        <FlatList
          data={recommendedRestaurants}
          keyExtractor={(item, index) => item?.id || `recommended-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <RestaurantListCard
              item={item}
              isFavorite={isFavourite?.(item.id, 'restaurant')}
              onPress={() => handleRestaurantPress(item)}
              onFavoritePress={() => handleToggleFavorite(item)}
            />
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No recommended items available</Text>
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
    paddingTop: hp(1),
    paddingBottom: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  backText: {
    fontSize: FONT.sm,
    color: '#ed1c24',
    fontWeight: '600',
  },
  title: {
    fontSize: FONT.md + scale(2),
    color: '#111111',
    fontWeight: '700',
  },
  headerSpacer: {
    width: wp(10),
  },
  listContent: {
    paddingTop: hp(1),
    paddingBottom: hp(4),
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: FONT.sm,
    textAlign: 'center',
  },
});
