import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapService from '@/app/services/mapService';
import SimpleMap from './SimpleMap';

export default function ItemLocation({
  item,
  userLocation = null,
  style,
}) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [distance, setDistance] = useState(null);

  React.useEffect(() => {
    if (item?.latitude && item?.longitude && userLocation?.latitude && userLocation?.longitude) {
      calculateDistance();
    }
  }, [item, userLocation]);

  const calculateDistance = async () => {
    try {
      const calculatedDistance = MapService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        item.latitude,
        item.longitude
      );
      setDistance(calculatedDistance);
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const getLocationText = () => {
    if (item?.address_city) {
      return item.address_city;
    }
    if (item?.location) {
      return item.location;
    }
    return 'Location not specified';
  };

  const getFullAddress = () => {
    const parts = [
      item?.address_street,
      item?.address_city,
      item?.address_region,
      item?.address_postal_code,
      item?.address_country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const handleMapPress = () => {
    if (!item?.latitude || !item?.longitude) {
      Alert.alert('No Location', 'This item does not have location information.');
      return;
    }
    setShowMapModal(true);
  };

  if (!item?.latitude && !item?.longitude && !item?.location) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.locationInfo}>
          <Ionicons name="location-outline" size={20} color="#9CA3AF" />
          <Text style={styles.noLocationText}>Location not specified</Text>
        </View>
      </View>
    );
  }

  return (
    <SimpleMap
      latitude={item?.latitude}
      longitude={item?.longitude}
      address={getFullAddress()}
      style={style}
      showDistance={true}
      userLocation={userLocation}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  noLocationText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 2,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  mapModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  mapFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
}); 