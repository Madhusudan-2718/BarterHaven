import { supabase } from '@/Config/supabaseConfig';

export class LocationService {
  // Check if native location services are available
  static async isNativeLocationAvailable() {
    try {
      // Try to import expo-location to check if it's available
      const Location = await import('expo-location');
      return true;
    } catch (error) {
      console.warn('Native location services not available:', error);
      return false;
    }
  }

  // Request location permissions (fallback)
  static async requestLocationPermission() {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        console.warn('Location permission not available - native modules not linked');
        return false;
      }

      const Location = await import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location with high accuracy (fallback)
  static async getCurrentLocation() {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        throw new Error('Location services not available - native modules not linked');
      }

      const Location = await import('expo-location');
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error;
    }
  }

  // Watch location changes (fallback)
  static async watchLocation(callback) {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        throw new Error('Location services not available - native modules not linked');
      }

      const Location = await import('expo-location');
      const hasPermission = await this.requestLocationPermission();
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 50,
        },
        (location) => {
          const locationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      throw error;
    }
  }

  // Reverse geocode coordinates to address (fallback)
  static async reverseGeocode(latitude, longitude) {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        // Fallback: Return mock address data
        console.warn('Reverse geocoding not available - using mock data');
        return {
          street: 'Mock Street',
          city: 'Mock City',
          region: 'Mock Region',
          postalCode: '12345',
          country: 'Mock Country',
          fullAddress: `Mock Address at ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        };
      }

      const Location = await import('expo-location');
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length === 0) {
        throw new Error('No address found for these coordinates');
      }

      const address = results[0];
      return {
        street: address.street || '',
        city: address.city || '',
        region: address.region || '',
        postalCode: address.postalCode || '',
        country: address.country || '',
        fullAddress: this.formatAddress(address),
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  // Forward geocode address to coordinates (fallback)
  static async forwardGeocode(address) {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        // Fallback: Return mock coordinates
        console.warn('Forward geocoding not available - using mock data');
        return {
          latitude: 37.78825,
          longitude: -122.4324,
        };
      }

      const Location = await import('expo-location');
      const results = await Location.geocodeAsync(address);

      if (results.length === 0) {
        throw new Error('No coordinates found for this address');
      }

      const location = results[0];
      return {
        latitude: location.latitude,
        longitude: location.longitude,
      };
    } catch (error) {
      console.error('Error forward geocoding:', error);
      throw error;
    }
  }

  // Format address components into a readable string
  static formatAddress(address) {
    const parts = [
      address.street,
      address.city,
      address.region,
      address.postalCode,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  // Save user location to Supabase
  static async saveUserLocation(userId, locationData) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address_street: locationData.address.street,
          address_city: locationData.address.city,
          address_region: locationData.address.region,
          address_postal_code: locationData.address.postalCode,
          address_country: locationData.address.country,
          location: locationData.address.fullAddress,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error;
    }
  }

  // Save item location to Supabase
  static async saveItemLocation(itemId, locationData) {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          address_street: locationData.address.street,
          address_city: locationData.address.city,
          address_region: locationData.address.region,
          address_postal_code: locationData.address.postalCode,
          address_country: locationData.address.country,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error saving item location:', error);
      throw error;
    }
  }

  // Get user's current location from Supabase
  static async getUserLocation(userId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          latitude,
          longitude,
          address_street,
          address_city,
          address_region,
          address_postal_code,
          address_country,
          location,
          location_updated_at
        `)
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user location:', error);
      throw error;
    }
  }

  // Find items within a certain radius of user's location
  static async findItemsWithinRadius(userLat, userLon, radiusKm = 50) {
    try {
      const { data, error } = await supabase
        .rpc('bh_find_items_within_radius', {
          user_lat: userLat,
          user_lon: userLon,
          radius_km: radiusKm,
        });

      if (error) {
        console.warn('RPC function not available, falling back to client-side filtering');
        // Fallback: Get all items and filter client-side
        const { data: allItems, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('status', 'available')
          .order('created_at', { ascending: false });

        if (itemsError) throw itemsError;

        // Filter items within radius using client-side calculation
        const filteredItems = allItems.filter(item => {
          if (!item.latitude || !item.longitude) return false;
          const distance = this.calculateHaversineDistance(
            userLat, userLon, item.latitude, item.longitude
          );
          return distance <= radiusKm;
        });

        return filteredItems.map(item => ({
          ...item,
          distance_km: this.calculateHaversineDistance(
            userLat, userLon, item.latitude, item.longitude
          )
        }));
      }

      return data || [];
    } catch (error) {
      console.error('Error finding items within radius:', error);
      throw error;
    }
  }

  // Calculate distance between two points using Haversine formula
  static calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Calculate distance between two points (server-side)
  static async calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      const { data, error } = await supabase
        .rpc('bh_calculate_haversine_distance', {
          lat1,
          lon1,
          lat2,
          lon2,
        });

      if (error) {
        // Fallback to client-side calculation
        return this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
      }

      return data;
    } catch (error) {
      console.error('Error calculating distance:', error);
      // Fallback to client-side calculation
      return this.calculateHaversineDistance(lat1, lon1, lat2, lon2);
    }
  }

  // Get location with full address
  static async getLocationWithAddress() {
    try {
      const location = await this.getCurrentLocation();
      const address = await this.reverseGeocode(location.latitude, location.longitude);
      
      return {
        ...location,
        address,
      };
    } catch (error) {
      console.error('Error getting location with address:', error);
      throw error;
    }
  }

  // Get nearby places (optional enhancement)
  static async getNearbyPlaces(latitude, longitude, radius = 1000) {
    try {
      // This could integrate with Google Places API or similar
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  // Check if location services are enabled
  static async isLocationEnabled() {
    try {
      const isAvailable = await this.isNativeLocationAvailable();
      if (!isAvailable) {
        return false;
      }

      const Location = await import('expo-location');
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  // Get location accuracy level
  static getAccuracyLevel(accuracy) {
    if (accuracy <= 5) return 'high';
    if (accuracy <= 20) return 'medium';
    return 'low';
  }
}

export default LocationService; 