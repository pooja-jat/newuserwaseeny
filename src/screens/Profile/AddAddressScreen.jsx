import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import useHideTabBar from '../../utils/hooks/useHideTabBar';
import { COLORS } from '../../theme/colors';

const { width, height } = Dimensions.get('window');

export default function AddAddressScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const mapRef = useRef(null);
  const address = route?.params?.address;
  const isEditing = !!address;

  const [mapRegion, setMapRegion] = useState({
    latitude: address?.coordinates?.[1] || 25.276987,
    longitude: address?.coordinates?.[0] || 55.296249,
    latitudeDelta: 0.04,
    longitudeDelta: 0.04,
  });
  const [latitudeInput, setLatitudeInput] = useState(
    String(address?.coordinates?.[1] || 25.276987),
  );
  const [longitudeInput, setLongitudeInput] = useState(
    String(address?.coordinates?.[0] || 55.296249),
  );
  const [selectedAddressText, setSelectedAddressText] = useState(
    address?.fullAddress ||
      (address?.coordinates
        ? `Lat ${address.coordinates[1]?.toFixed?.(6)}, Lng ${address.coordinates[0]?.toFixed?.(6)}`
        : 'Set latitude and longitude to pick location')
  );

  useHideTabBar(navigation);

  const setCoordinates = (latitude, longitude, shouldAnimate = false) => {
    const nextRegion = {
      latitude,
      longitude,
      latitudeDelta: mapRegion.latitudeDelta,
      longitudeDelta: mapRegion.longitudeDelta,
    };
    setMapRegion(nextRegion);
    setLatitudeInput(String(latitude));
    setLongitudeInput(String(longitude));
    setSelectedAddressText(`Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`);
    if (shouldAnimate) {
      mapRef.current?.animateToRegion?.(nextRegion, 350);
    }
  };

  const applyCoordinatesFromInput = () => {
    const latitude = Number(latitudeInput);
    const longitude = Number(longitudeInput);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return;
    }

    setCoordinates(latitude, longitude, true);
  };

  const handleContinue = () => {
    // Navigate to AddressFormScreen with the selected address data and coordinates
    const updatedAddress = {
      ...address,
      _id: address?._id || address?.id,
      coordinates: [mapRegion.longitude, mapRegion.latitude],
      fullAddress: selectedAddressText,
    };
    navigation.navigate('AddressFormScreen', { address: updatedAddress });
  };

  const handleRegionChange = region => {
    setCoordinates(region.latitude, region.longitude);
  };

  const handleMapPress = event => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setCoordinates(latitude, longitude);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.outer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Address' : 'Add Address'}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={handleRegionChange}
          onPress={handleMapPress}
          initialRegion={{
            latitude: address?.coordinates?.[1] || 25.276987,
            longitude: address?.coordinates?.[0] || 55.296249,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
        >
          <Marker
            coordinate={{
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude,
            }}
            draggable
            onDragEnd={event => handleMapPress(event)}
          />
        </MapView>

        {/* Bottom Card */}
        <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.coordinatesRow}>
            <View style={styles.coordinateField}>
              <Text style={styles.coordinateLabel}>Latitude</Text>
              <TextInput
                value={latitudeInput}
                onChangeText={setLatitudeInput}
                style={styles.coordinateInput}
                keyboardType="decimal-pad"
                placeholder="Latitude"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.coordinateField}>
              <Text style={styles.coordinateLabel}>Longitude</Text>
              <TextInput
                value={longitudeInput}
                onChangeText={setLongitudeInput}
                style={styles.coordinateInput}
                keyboardType="decimal-pad"
                placeholder="Longitude"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={applyCoordinatesFromInput}
            activeOpacity={0.85}
          >
            <Text style={styles.applyBtnText}>Set Coordinates</Text>
          </TouchableOpacity>

          <View style={styles.locationRow}>
            <View style={styles.dot} />
            <Text style={styles.address} numberOfLines={3}>
              {selectedAddressText}
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.btn}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {isEditing ? 'Update Address' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },

  outer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 0,
    overflow: 'hidden',
  },

  header: {
    height: height * 0.065,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    borderBottomWidth: 1,
    borderColor: '#EFEFEF',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },

  title: {
    fontSize: width > 400 ? 18 : 16,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 0.3,
  },

  map: {
    flex: 1,
  },

  bottomCard: {
    backgroundColor: '#fff',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  coordinatesRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },

  coordinateField: {
    flex: 1,
  },

  coordinateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },

  coordinateInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: '#222',
    backgroundColor: '#FFF',
  },

  applyBtn: {
    backgroundColor: '#1f2937',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: height * 0.02,
  },

  applyBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  locationRow: {
    flexDirection: 'row',
    marginBottom: height * 0.02,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: width * 0.04,
    marginHorizontal: 0,
    backgroundColor: '#fafafa',
    borderColor: '#e8e8e8',
    minHeight: 80,
  },

  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: width * 0.03,
    marginTop: 2,
    flexShrink: 0,
  },

  address: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    fontWeight: '500',
  },

  btn: {
    height: height * 0.065,
    minHeight: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
