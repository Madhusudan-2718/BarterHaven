import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapService from '@/app/services/mapService';

const { width, height } = Dimensions.get('window');

// Simple map component that works in both dev and production
export default function SimpleMap({
  latitude,
  longitude,
  address,
  style,
  showDistance = false,
  userLocation = null,
  onLocationSelect = null,
  interactive = false,
}) {
  const [showMapModal, setShowMapModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState(null);

  React.useEffect(() => {
    if (showDistance && userLocation && latitude && longitude) {
      calculateDistance();
    }
  }, [latitude, longitude, userLocation, showDistance]);

  const calculateDistance = async () => {
    try {
      const dist = MapService.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        latitude,
        longitude
      );
      setDistance(dist);
    } catch (error) {
      console.error('Error calculating distance:', error);
    }
  };

  const handleMapPress = () => {
    if (!latitude || !longitude) {
      Alert.alert('No Location', 'This item does not have location information.');
      return;
    }
    setShowMapModal(true);
  };

  const handleGetMyLocation = async () => {
    try {
      setLoading(true);
      const location = await MapService.getLocationWithAddress();
      
      if (onLocationSelect) {
        onLocationSelect(location);
      }
      
      Alert.alert(
        'Location Found',
        `${location.address?.fullAddress || 'Location detected'}\n\nCoordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your current location. Please check your location permissions.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMapModal = () => (
    <Modal
      visible={showMapModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.mapModalContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Location Details</Text>
          <TouchableOpacity
            onPress={() => setShowMapModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapPlaceholder}>
          <View style={styles.mapIcon}>
            <Ionicons name="location" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.mapPlaceholderText}>
            Interactive Map
          </Text>
          <Text style={styles.coordinatesText}>
            {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
          </Text>
          
          {__DEV__ && (
            <View style={styles.devNote}>
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text style={styles.devNoteText}>
                Interactive maps available in production builds
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.mapFooter}>
          <Text style={styles.addressText}>
            {address || 'Address not available'}
          </Text>
          {distance && (
            <Text style={styles.distanceText}>
              Distance: {distance.toFixed(1)} km
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );

  if (!latitude && !longitude && !interactive) {
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
    <View style={[styles.container, style]}>
      <View style={styles.locationInfo}>
        <Ionicons name="location" size={20} color="#3B82F6" />
        <View style={styles.locationTextContainer}>
          <Text style={styles.locationText}>
            {typeof address === 'string'
              ? address
              : address && address.fullAddress
                ? address.fullAddress
                : `${latitude?.toFixed(4)}, ${longitude?.toFixed(4)}`}
          </Text>
          {distance && (
            <Text style={styles.distanceText}>
              {distance.toFixed(1)} km away
            </Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {(latitude && longitude) && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={handleMapPress}
          >
            <Ionicons name="map-outline" size={16} color="#3B82F6" />
            <Text style={styles.mapButtonText}>View Details</Text>
          </TouchableOpacity>
        )}

        {interactive && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleGetMyLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Ionicons name="locate" size={16} color="#3B82F6" />
            )}
            <Text style={styles.locationButtonText}>
              {loading ? 'Getting...' : 'My Location'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {renderMapModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mapButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#059669',
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
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  mapIcon: {
    backgroundColor: '#EFF6FF',
    padding: 20,
    borderRadius: 50,
    marginBottom: 16,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  devNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
  },
  devNoteText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
  },
  mapFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
}); 