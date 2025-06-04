import { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, TextInput, FlatList, Modal, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import { decode as atob } from 'base-64';
import { Ionicons, FontAwesome, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import TradeProposals from '@/app/components/TradeProposals';

const { width } = Dimensions.get('window');
const GRID_SPACING = 2;
const NUM_COLUMNS = 3;
const GRID_ITEM_SIZE = (width - (NUM_COLUMNS + 1) * GRID_SPACING) / NUM_COLUMNS;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['jpg', 'jpeg', 'png', 'gif'];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [myListings, setMyListings] = useState([]);
  const [tradesCount, setTradesCount] = useState(0);
  const [rating, setRating] = useState(5.0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState('unverified');
  const [joinDate, setJoinDate] = useState(null);
  const [lastActive, setLastActive] = useState(null);
  const [successfulTrades, setSuccessfulTrades] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [tradeProposals, setTradeProposals] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetchUserProfile();
    fetchMyListings();
    fetchTradesCount();
    fetchFavorites();
    fetchTradeProposals();
  }, []);

  const getCurrentUserId = async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) throw new Error('No authenticated user');
      return authUser.id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      throw new Error('Failed to get user information');
    }
  };

  const fetchUserProfile = async () => {
    try {
      const userId = await getCurrentUserId();

      // Fetch user profile with a single query
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          profile_image_url,
          bio,
          phone_number,
          location,
          rating,
          total_ratings,
          verification_status,
          join_date,
          last_active,
          successful_trades
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Create new profile if it doesn't exist
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert([{
              id: userId,
              created_at: new Date().toISOString(),
              join_date: new Date().toISOString()
            }])
            .select()
            .single();

          if (createError) throw createError;
          setUser(newProfile);
          setName(newProfile.name || '');
          setProfileImage(newProfile.profile_image_url);
          setBio('');
          setPhoneNumber('');
          setLocation('');
          setRating(5.0);
          setTotalRatings(0);
          setVerificationStatus('unverified');
          setJoinDate(new Date().toISOString());
          setLastActive(new Date().toISOString());
          setSuccessfulTrades(0);
          return;
        }
        throw profileError;
      }

      setUser(profile);
      setName(profile.name || '');
      setProfileImage(profile.profile_image_url);
      setBio(profile.bio || '');
      setPhoneNumber(profile.phone_number || '');
      setLocation(profile.location || '');
      setRating(profile.rating || 5.0);
      setTotalRatings(profile.total_ratings || 0);
      setVerificationStatus(profile.verification_status || 'unverified');
      setJoinDate(profile.join_date);
      setLastActive(profile.last_active);
      setSuccessfulTrades(profile.successful_trades || 0);
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyListings = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      Alert.alert('Error', 'Failed to load your listings');
    }
  };

  const fetchTradesCount = async () => {
    // If you have a trades table, count trades where user is involved
    // Example:
    // const { data, error, count } = await supabase
    //   .from('trades')
    //   .select('*', { count: 'exact', head: true })
    //   .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    // setTradesCount(count || 0);
  };

  const fetchFavorites = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      // Get favorite item IDs
      const { data: favs, error: favsError } = await supabase
        .from('favorites')
        .select('item_id')
        .eq('user_id', userId);
      if (favsError) throw favsError;
      setFavorites(favs.map(f => f.item_id));
      if (favs.length === 0) {
        setFavoriteItems([]);
        return;
      }
      // Fetch item details for favorites
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('id', favs.map(f => f.item_id));
      if (itemsError) throw itemsError;
      setFavoriteItems(items || []);
    } catch (error) {
      setFavoriteItems([]);
    }
  };

  const fetchTradeProposals = async () => {
    try {
      const userId = await getCurrentUserId();
      if (!userId) return;

      // Fetch proposals where user is the proposer
      const { data: sentProposals, error: sentError } = await supabase
        .from('trade_proposals')
        .select(`
          *,
          items:item_id(*, users(*))
        `)
        .eq('proposer_id', userId)
        .order('created_at', { ascending: false });

      // Fetch proposals where user is the item owner
      const { data: receivedProposals, error: receivedError } = await supabase
        .from('trade_proposals')
        .select(`
          *,
          items:item_id(*, users(*))
        `)
        .eq('items.user_id', userId)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;
      if (receivedError) throw receivedError;

      setTradeProposals({
        sent: sentProposals || [],
        received: receivedProposals || []
      });
    } catch (error) {
      console.error('Error fetching trade proposals:', error);
      Alert.alert('Error', 'Failed to load trade proposals');
    }
  };

  const handleTradeProposal = async (proposalId, action) => {
    try {
      const { error } = await supabase
        .from('trade_proposals')
        .update({ status: action })
        .eq('id', proposalId);

      if (error) throw error;

      // Refresh proposals
      fetchTradeProposals();

      Alert.alert(
        'Success',
        `Trade proposal ${action} successfully!`
      );
    } catch (error) {
      console.error('Error updating trade proposal:', error);
      Alert.alert('Error', 'Failed to update trade proposal');
    }
  };

  const uploadProfileImage = async (uri) => {
    try {
      if (!uri.startsWith('file://')) {
        throw new Error('Invalid image format');
      }

      // Get user ID first
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Check file size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.size > MAX_IMAGE_SIZE) {
        throw new Error('Image size should be less than 5MB');
      }

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to Uint8Array
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Generate unique filename
      const fileExt = uri.split('.').pop().toLowerCase();
      if (!ALLOWED_IMAGE_TYPES.includes(fileExt)) {
        throw new Error('Invalid image format. Please use JPG, PNG, or GIF');
      }

      const fileName = `${userId}-profile-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`;

      // Upload to Supabase with retry logic
      let uploadAttempts = 0;
      const maxAttempts = 3;
      let uploadError;

      while (uploadAttempts < maxAttempts) {
        try {
          const { error: uploadError, data } = await supabase.storage
            .from('items')
            .upload(filePath, bytes, {
              contentType: `image/${fileExt}`,
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) throw uploadError;
          if (!data) throw new Error('No data returned from upload');

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('items')
            .getPublicUrl(data.path);

          if (!publicUrl) throw new Error('Failed to get public URL');

          return publicUrl;
        } catch (error) {
          uploadError = error;
          uploadAttempts++;
          if (uploadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
          }
        }
      }

      throw uploadError || new Error('Failed to upload image after multiple attempts');
    } catch (error) {
      console.error('Image upload error:', error);
      throw new Error(error.message || 'Failed to upload image');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setUploadProgress(0);

      // Validate inputs
      if (!name.trim()) {
        throw new Error('Name is required');
      }

      // Get user ID first
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      let profileImageUrl = profileImage;

      // Handle image upload if there's a new image
      if (profileImage && profileImage.startsWith('file://')) {
        try {
          setUploadProgress(20);
          profileImageUrl = await uploadProfileImage(profileImage);
          setUploadProgress(60);
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload profile image. Please try again.');
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          name: name.trim(),
          profile_image_url: profileImageUrl,
          bio: bio.trim(),
          phone_number: phoneNumber.trim(),
          location: location.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Profile update error:', updateError);
        throw new Error('Failed to update profile information');
      }

      setUploadProgress(100);

      // Update local state
      setUser({
        ...user,
        name: name.trim(),
        bio: bio.trim(),
        profile_image_url: profileImageUrl,
        phone_number: phoneNumber.trim(),
        location: location.trim()
      });

      setEditing(false);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get the image from',
      [
        {
          text: 'Camera',
          onPress: () => {
            Alert.alert(
              'Camera Permission',
              'This app needs camera access to take photos',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'OK', onPress: takePhoto }
              ]
            );
          }
        },
        { text: 'Gallery', onPress: handleImagePick },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable camera access in your device settings');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled) {
        // Check image size before setting
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.size > MAX_IMAGE_SIZE) {
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable photo library access in your device settings');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled) {
        // Check image size before setting
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (fileInfo.size > MAX_IMAGE_SIZE) {
          Alert.alert('Error', 'Image size should be less than 5MB');
          return;
        }
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#3B82F6" />
        {uploadProgress > 0 && (
          <Text style={styles.uploadProgress}>Uploading: {uploadProgress}%</Text>
        )}
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Gradient Header */}
      <LinearGradient
        colors={['#075eec', '#3B82F6', '#67C6FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.profileImageWrapper}>
            <Image
              source={profileImage ? { uri: profileImage } : require('@/assets/images/placeholder.jpg')}
              style={styles.profileImage}
            />
            <TouchableOpacity style={styles.editPicButton} onPress={showImagePickerOptions}>
              <Feather name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>{name || 'No name set'}</Text>
          
          {/* Verification Badge */}
          <View style={styles.verificationBadge}>
            <MaterialCommunityIcons 
              name={verificationStatus === 'verified' ? 'check-decagram' : 'shield-outline'} 
              size={20} 
              color={verificationStatus === 'verified' ? '#4CAF50' : '#FFA500'} 
            />
            <Text style={styles.verificationText}>
              {verificationStatus === 'verified' ? 'Verified User' : 'Unverified'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{myListings.length}</Text>
            <Text style={styles.statLabel}>Listings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{successfulTrades}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{rating.toFixed(1)}</Text>
            <Text style={styles.statLabel}>{`${totalRatings} Rating${totalRatings !== 1 ? 's' : ''}`}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* User Info Cards */}
      <View style={styles.infoSection}>
        {location && (
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#833AB4" />
            <Text style={styles.infoText}>{location}</Text>
          </View>
        )}
        
        {phoneNumber && (
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="phone-outline" size={20} color="#833AB4" />
            <Text style={styles.infoText}>{phoneNumber}</Text>
          </View>
        )}

        {bio && (
          <View style={styles.infoCard}>
            <MaterialCommunityIcons name="text-box-outline" size={20} color="#833AB4" />
            <Text style={styles.infoText}>{bio}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="clock-outline" size={20} color="#833AB4" />
          <Text style={styles.infoText}>
            Joined {joinDate ? new Date(joinDate).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </View>

      {/* Floating Edit Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowEditModal(true)}>
        <Feather name="edit-2" size={22} color="#fff" />
      </TouchableOpacity>

      {/* My Listings Grid */}
      <Text style={styles.sectionTitle}>My Listings</Text>
      <FlatList
        data={myListings}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            <View style={styles.gridItemOverlay}>
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyListings}>
            <MaterialCommunityIcons name="image-off-outline" size={50} color="#ccc" />
            <Text style={styles.emptyListingsText}>No listings yet</Text>
          </View>
        }
        scrollEnabled={false}
      />

      {/* My Favorites Grid */}
      <Text style={styles.sectionTitle}>My Favorites</Text>
      <FlatList
        data={favoriteItems}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.gridItem}>
            <Image source={{ uri: item.image_url }} style={styles.gridImage} />
            <View style={styles.gridItemOverlay}>
              <Text style={styles.gridTitle} numberOfLines={1}>{item.title}</Text>
            </View>
          </TouchableOpacity>
        )}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={
          <View style={styles.emptyListings}>
            <MaterialCommunityIcons name="heart-outline" size={50} color="#ccc" />
            <Text style={styles.emptyListingsText}>No favorites yet</Text>
          </View>
        }
        scrollEnabled={false}
      />

      {/* Trade Proposals Section */}
      <View style={styles.section}>
        <TradeProposals />
      </View>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Feather name="x" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <TextInput
                style={[styles.input, !name.trim() && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Name *"
              />
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Phone Number"
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
              />
              <TextInput
                style={styles.input}
                value={bio}
                onChangeText={setBio}
                placeholder="Bio"
                multiline
                numberOfLines={3}
              />
            </ScrollView>
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#ccc' }]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, !name.trim() && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={loading || !name.trim()}
              >
                <Text style={styles.modalButtonText}>
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 10,
  },
  headerContent: {
    alignItems: 'center',
    marginTop: 30,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  editPicButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFA500',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    top: 120,
    right: 24,
    backgroundColor: '#FFA500',
    borderRadius: 30,
    padding: 14,
    elevation: 5,
    zIndex: 10,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
  },
  verificationText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoSection: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  gridContainer: {
    padding: GRID_SPACING,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: GRID_SPACING,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
  },
  gridTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyListings: {
    alignItems: 'center',
    padding: 40,
  },
  emptyListingsText: {
    color: '#666',
    marginTop: 10,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalScroll: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  modalButton: {
    backgroundColor: '#833AB4',
    padding: 12,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  uploadProgress: {
    marginTop: 10,
    color: '#3B82F6',
    fontSize: 16,
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 12,
  },
  proposalsContainer: {
    marginBottom: 24,
  },
  proposalCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  proposalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  statuspending: {
    backgroundColor: '#FEF3C7',
  },
  statusaccepted: {
    backgroundColor: '#D1FAE5',
  },
  statusrejected: {
    backgroundColor: '#FEE2E2',
  },
  statuscancelled: {
    backgroundColor: '#E5E7EB',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  proposalText: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  bold: {
    fontWeight: '600',
    color: '#1F2937',
  },
  proposalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    marginVertical: 12,
  },
});

