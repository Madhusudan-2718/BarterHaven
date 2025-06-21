import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapService from '@/app/services/mapService';
import SimpleMap from './SimpleMap';

export default function LocationPicker({
  onLocationSelect,
  initialLocation = null,
  style,
  placeholder = "Enter address manually...",
}) {
  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [manualEdit, setManualEdit] = useState(false);

  useEffect(() => {
    if (initialLocation?.address?.fullAddress) {
      setAddress(initialLocation.address.fullAddress);
    }
  }, [initialLocation]);

  const handleUseMyLocation = async () => {
    try {
      setLoading(true);
      const locationData = await MapService.getLocationWithAddress();
      
      setLocation(locationData);
      setAddress(locationData.address?.fullAddress || '');
      setManualEdit(false);
      
      if (onLocationSelect) {
        onLocationSelect(locationData);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your current location. You can enter your address manually.',
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

  const handleForwardGeocode = async () => {
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter an address first');
      return;
    }

    try {
      setLoading(true);
      const coordinates = await MapService.forwardGeocode(address);
      
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

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setAddress(selectedLocation.address?.fullAddress || '');
    setManualEdit(false);
    
    if (onLocationSelect) {
      onLocationSelect(selectedLocation);
    }
  };

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
          onFocus={() => setManualEdit(true)}
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
              Manual entry - tap "Convert to Coordinates" to get location data
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
              Accuracy: {location.accuracy.toFixed(1)}m ({MapService.getAccuracyLevel(location.accuracy)})
            </Text>
          )}
        </View>
      )}

      <SimpleMap
        latitude={location?.latitude}
        longitude={location?.longitude}
        address={address}
        interactive={true}
        onLocationSelect={handleLocationSelect}
      />

      {__DEV__ && (
        <View style={styles.locationWarning}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.locationWarningText}>
            Development mode: Using mock location services. Full functionality available in production builds.
          </Text>
        </View>
      )}
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
    marginBottom: 16,
  },
  useLocationButton: {
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
    marginBottom: 12,
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
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    marginTop: 8,
  },
  locationWarningText: {
    fontSize: 12,
    color: '#1D4ED8',
    marginLeft: 6,
    flex: 1,
  },
}); 