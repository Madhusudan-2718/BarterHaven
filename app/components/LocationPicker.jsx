import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocationService from '@/app/services/locationService';
import MapView, { Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function LocationPicker({
  onLocationSelect,
  initialLocation = null,
  showMap = true,
  style,
  placeholder = "Enter address manually...",
}) {
  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [nativeModulesAvailable, setNativeModulesAvailable] = useState(false);
  const [mapLocation, setMapLocation] = useState(initialLocation ? {
    latitude: initialLocation.latitude || 37.78825,
    longitude: initialLocation.longitude || -122.4324,
  } : { latitude: 37.78825, longitude: -122.4324 });
  const [mapAddress, setMapAddress] = useState(initialLocation?.address?.fullAddress || '');

  useEffect(() => {
    if (initialLocation?.address?.fullAddress) {
      setAddress(initialLocation.address.fullAddress);
    }
    checkLocationServices();
  }, [initialLocation]);

  const checkLocationServices = async () => {
    try {
      const isAvailable = await LocationService.isNativeLocationAvailable();
      setNativeModulesAvailable(isAvailable);
      
      if (isAvailable) {
        const enabled = await LocationService.isLocationEnabled();
        setLocationEnabled(enabled);
      } else {
        setLocationEnabled(false);
      }
    } catch (error) {
      console.error('Error checking location services:', error);
      setLocationEnabled(false);
      setNativeModulesAvailable(false);
    }
  };

  const handleUseMyLocation = async () => {
    try {
      setLoading(true);
      
      if (!nativeModulesAvailable) {
        Alert.alert(
          'Location Services Unavailable',
          'Location services are currently not available. Please enter your address manually.',
          [
            { text: 'OK' },
            { text: 'Enter Manually', onPress: () => setManualEdit(true) }
          ]
        );
        return;
      }
      
      if (!locationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [
            { text: 'OK' },
            { text: 'Enter Manually', onPress: () => setManualEdit(true) }
          ]
        );
        return;
      }

      const locationData = await LocationService.getLocationWithAddress();
      
      setLocation(locationData);
      setAddress(locationData.address.fullAddress);
      setManualEdit(false);
      
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        error.message === 'Location permission denied'
          ? 'Please enable location permissions in your device settings to use this feature.'
          : 'Failed to get your current location. Please try again or enter your address manually.',
        [
          { text: 'OK' },
          { text: 'Enter Manually', onPress: () => setManualEdit(true) }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (text) => {
    setAddress(text);
    if (manualEdit && onLocationSelect) {
      // Create a location object with just the address for manual entry
      const manualLocation = {
        latitude: null,
        longitude: null,
        address: {
          street: '',
          city: '',
          region: '',
          postalCode: '',
          country: '',
          fullAddress: text,
        },
        isManualEntry: true,
      };
      onLocationSelect(manualLocation);
    }
  };

  const handleMapPress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setMapLocation({ latitude, longitude });
    try {
      const address = await LocationService.reverseGeocode(latitude, longitude);
      setMapAddress(address.fullAddress);
    } catch (e) {
      setMapAddress('');
    }
  };

  const handleConfirmMapLocation = async () => {
    if (!mapLocation.latitude || !mapLocation.longitude) return;
    try {
      const address = await LocationService.reverseGeocode(mapLocation.latitude, mapLocation.longitude);
      const locationData = {
        latitude: mapLocation.latitude,
        longitude: mapLocation.longitude,
        address,
      };
      setLocation(locationData);
      setAddress(address.fullAddress);
      setManualEdit(false);
      setShowMapModal(false);
      if (onLocationSelect) onLocationSelect(locationData);
    } catch (e) {
      Alert.alert('Error', 'Could not get address for selected location.');
    }
  };

  const handleForwardGeocode = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address first');
      return;
    }

    try {
      setLoading(true);
      const coordinates = await LocationService.forwardGeocode(address);
      
      const locationData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: {
          fullAddress: address,
        },
      };
      
      setLocation(locationData);
      setManualEdit(false);
      
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }
      
      Alert.alert('Success', 'Address converted to coordinates successfully');
    } catch (error) {
      console.error('Error forward geocoding:', error);
      Alert.alert('Error', 'Could not convert address to coordinates. Please try a different address.');
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
          <Text style={styles.mapTitle}>Select Location</Text>
          <TouchableOpacity
            onPress={() => setShowMapModal(false)}
            style={styles.closeButton}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: mapLocation.latitude,
            longitude: mapLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          onPress={handleMapPress}
        >
          <Marker coordinate={mapLocation} />
        </MapView>
        <View style={styles.mapFooter}>
          <Text style={styles.addressText}>{mapAddress || 'Tap on the map to select a location'}</Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmMapLocation}
          >
            <Text style={styles.confirmButtonText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.locationButtonContainer}>
        <TouchableOpacity
          style={styles.useLocationButton}
          onPress={handleUseMyLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="location" size={20} color="#fff" />
          )}
          <Text style={styles.useLocationButtonText}>
            {loading ? 'Getting Location...' : 'Use My Location'}
          </Text>
        </TouchableOpacity>
        
        {showMap && (
          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => setShowMapModal(true)}
          >
            <Ionicons name="map" size={20} color="#3B82F6" />
            <Text style={styles.mapButtonText}>Map</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.addressContainer}>
        <Text style={styles.addressLabel}>Address</Text>
        <TextInput
          style={styles.addressInput}
          value={address}
          onChangeText={handleAddressChange}
          placeholder={placeholder}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        {manualEdit && (
          <View style={styles.manualEditActions}>
            <TouchableOpacity
              style={styles.geocodeButton}
              onPress={handleForwardGeocode}
              disabled={loading}
            >
              <Ionicons name="locate" size={16} color="#3B82F6" />
              <Text style={styles.geocodeButtonText}>Convert to Coordinates</Text>
            </TouchableOpacity>
            <Text style={styles.manualEditNote}>
              Manual entry - location coordinates will not be saved
            </Text>
          </View>
        )}
      </View>

      {location?.latitude && location?.longitude && !manualEdit && (
        <View style={styles.coordinatesContainer}>
          <Text style={styles.coordinatesLabel}>Coordinates</Text>
          <Text style={styles.coordinatesText}>
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </Text>
          {location.accuracy && (
            <Text style={styles.accuracyText}>
              Accuracy: {location.accuracy.toFixed(1)}m ({LocationService.getAccuracyLevel(location.accuracy)})
            </Text>
          )}
        </View>
      )}

      {!nativeModulesAvailable && (
        <View style={styles.locationWarning}>
          <Ionicons name="warning" size={16} color="#F59E0B" />
          <Text style={styles.locationWarningText}>
            Location services are not available. Enable them in device settings for full functionality.
          </Text>
        </View>
      )}

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationButtonContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  useLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  useLocationButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 8,
  },
  mapButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
    minHeight: 80,
  },
  manualEditActions: {
    marginTop: 8,
  },
  geocodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 4,
  },
  geocodeButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  manualEditNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  coordinatesContainer: {
    marginTop: 8,
  },
  coordinatesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
  },
  locationWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
    marginTop: 8,
  },
  locationWarningText: {
    fontSize: 12,
    color: '#92400E',
    marginLeft: 6,
    flex: 1,
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
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
}); 