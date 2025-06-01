import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
    Modal,
    Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/Config/supabaseConfig';
import { router } from 'expo-router';
import { decode as atob } from 'base-64';
import { categories as categoryList } from '@/Config/categories';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const categories = categoryList.map(cat => cat.name);

export default function UploadScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [offering, setOffering] = useState('');
    const [exchangefor, setExchangefor] = useState('');
    const [bartertype, setBartertype] = useState('Online Barter');
    const [errorMsg, setErrorMsg] = useState('');
    const [barterTypes, setBarterTypes] = useState(['Online Barter', 'In-Person Barter']); // fallback

    const takePhoto = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera permissions to take photos');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                type: 'image',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            'Select Image Source',
            'Choose where to get the image from',
            [
                {
                    text: 'Camera',
                    onPress: takePhoto,
                },
                {
                    text: 'Gallery',
                    onPress: pickImage,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ]
        );
    };

    const uploadImage = async (uri) => {
        try {
            if (!uri.startsWith('file://')) {
                throw new Error('Invalid image URI format');
            }

            // Read file as base64
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

            // Convert base64 to Uint8Array
            const binaryString = atob(base64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Generate unique filename
            const fileExt = uri.split('.').pop().toLowerCase();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `items/${fileName}`;

            // Upload to Supabase
            const { error, data } = await supabase.storage
                .from('items')
                .upload(filePath, bytes, {
                    contentType: `image/${fileExt}`,
                    cacheControl: '3600',
                    upsert: false,
                });

            if (error) throw error;
            if (!data) throw new Error('No data returned from upload');

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('items')
                .getPublicUrl(data.path);

            if (!publicUrl) throw new Error('Failed to get public URL');

            return publicUrl;
        } catch (error) {
            throw new Error(`Image upload failed: ${error.message}`);
        }
    };

    const handleUpload = async () => {
        if (!title || !description || !image || !category) {
            Alert.alert('Error', 'Please fill in all fields and select an image');
            return;
        }
        setErrorMsg('');
        try {
            setLoading(true);
            setUploadProgress(0);

            // Upload image first
            console.log('Starting image upload...');
            const imageUrl = await uploadImage(image);
            console.log('Image uploaded successfully:', imageUrl);
            setUploadProgress(50);

            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Ensure user profile exists before uploading item
            const { data: userProfile, error: userProfileError } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .maybeSingle();

            if (!userProfile) {
                const { error: insertError } = await supabase.from('users').insert([
                    {
                        id: user.id,
                        email: user.email,
                        created_at: new Date().toISOString(),
                    },
                ]);
                if (insertError) throw insertError;
            }

            // Save item data to Supabase
            console.log('Saving item data...');
            const { error: dbError } = await supabase
                .from('items')
                .insert([
                    {
                        title,
                        description,
                        image_url: imageUrl,
                        user_id: user.id,
                        created_at: new Date().toISOString(),
                        status: 'active',
                        category: category,
                        offering,
                        exchangefor,
                        bartertype,
                    },
                ]);

            if (dbError) {
                console.error('Database error:', dbError);
                throw new Error(`Failed to save item: ${dbError.message}`);
            }

            setUploadProgress(100);
            console.log('Item saved successfully');

            // Reset form
            setTitle('');
            setDescription('');
            setImage(null);
            setCategory('');
            setOffering('');
            setExchangefor('');
            setBartertype('Online Barter');
            setLoading(false);
            setUploadProgress(0);

            // Show success message and navigate
            Alert.alert(
                'Success',
                'Item uploaded successfully!',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setTimeout(() => {
                                router.push({ pathname: '/(drawer)/(tabs)/home', params: { refresh: '1' } });
                            }, 100);
                        }
                    }
                ]
            );
        } catch (error) {
            setErrorMsg(error.message || 'Failed to upload item');
            setLoading(false);
            setUploadProgress(0);
            console.error('Upload error:', error);
            Alert.alert('Error', error.message || 'Failed to upload item');
        } finally {
            setLoading(false);
            setUploadProgress(0);
        }
    };

    const testSupabaseUpload = async () => {
        try {
            const blob = new Blob(['Hello, world!'], { type: 'text/plain' });
            const { error, data } = await supabase.storage
                .from('items')
                .upload(`test-${Date.now()}.txt`, blob, {
                    contentType: 'text/plain',
                    upsert: false,
                });
            if (error) {
                console.log('Supabase test upload error:', error);
            } else {
                console.log('Supabase test upload success:', data);
            }
        } catch (err) {
            console.log('Supabase test upload exception:', err);
        }
    };

    useEffect(() => {
        fetch('https://www.google.com')
            .then(res => console.log('Google fetch success:', res.status))
            .catch(err => console.log('Google fetch error:', err));
        testSupabaseUpload();
        const fetchBarterTypes = async () => {
            const { data, error } = await supabase.rpc('get_barter_types');
            if (!error && data && data.length > 0) setBarterTypes(data);
        };
        fetchBarterTypes();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={{ marginTop: 16, color: '#3B82F6' }}>Uploading...</Text>
            </View>
        );
    }
    if (errorMsg) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
                <Text style={{ color: 'red', fontSize: 16, marginBottom: 16 }}>{errorMsg}</Text>
                <TouchableOpacity onPress={() => setErrorMsg('')} style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Try Again</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Gradient Header */}
            <LinearGradient
                colors={['#075eec', '#3B82F6', '#67C6FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Upload Item</Text>
            </LinearGradient>

            <View style={styles.content}>
                {/* Image Upload Section */}
                <TouchableOpacity style={styles.imageUploadSection} onPress={showImagePickerOptions}>
                    {image ? (
                        <Image source={{ uri: image }} style={styles.uploadedImage} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Feather name="image" size={40} color="#FFA500" />
                            <Text style={styles.uploadText}>Tap to add photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Form Fields */}
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Enter item title"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Describe your item"
                        placeholderTextColor="#666"
                        multiline
                        numberOfLines={4}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Category</Text>
                    <TouchableOpacity
                        style={styles.categoryButton}
                        onPress={() => setShowCategoryModal(true)}
                    >
                        <Text style={styles.categoryButtonText}>
                            {category || 'Select a category'}
                        </Text>
                        <Feather name="chevron-down" size={20} color="#666" />
                    </TouchableOpacity>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Your Offering</Text>
                    <TextInput
                        style={styles.input}
                        value={offering}
                        onChangeText={setOffering}
                        placeholder="What are you offering?"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>In Exchange For</Text>
                    <TextInput
                        style={styles.input}
                        value={exchangefor}
                        onChangeText={setExchangefor}
                        placeholder="What do you want in exchange?"
                        placeholderTextColor="#666"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Barter Type</Text>
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        {barterTypes.map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.radioButton, bartertype === type && styles.radioButtonSelected]}
                                onPress={() => setBartertype(type)}
                            >
                                <Text style={bartertype === type ? styles.radioTextSelected : styles.radioText}>{type}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Upload Button */}
                <TouchableOpacity
                    style={[styles.uploadButton, loading && styles.uploadButtonDisabled]}
                    onPress={handleUpload}
                    disabled={loading}
                >
                    <LinearGradient
                        colors={['#FFA500', '#FFA500', '#FFA500']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.uploadButtonGradient}
                    >
                        {loading ? (
                            <View style={styles.uploadButtonContent}>
                                <ActivityIndicator color="#fff" />
                                <Text style={styles.uploadButtonText}>Uploading...</Text>
                            </View>
                        ) : (
                            <View style={styles.uploadButtonContent}>
                                <Feather name="upload" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.uploadButtonText}>Upload Item</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>

                {/* Progress Bar */}
                {loading && (
                    <View style={styles.progressContainer}>
                        <LinearGradient
                            colors={['#FFA500', '#FFA500', '#FFA500']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.progressBar, { width: `${uploadProgress}%` }]}
                        />
                    </View>
                )}
            </View>

            {/* Category Modal */}
            <Modal
                visible={showCategoryModal}
                transparent
                animationType="slide"
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Category</Text>
                            <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                                <Feather name="x" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.categoryList}>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={styles.categoryItem}
                                    onPress={() => {
                                        setCategory(cat);
                                        setShowCategoryModal(false);
                                    }}
                                >
                                    <Text style={styles.categoryItemText}>{cat}</Text>
                                    {category === cat && (
                                        <Feather name="check" size={20} color="#833AB4" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
    },
    content: {
        padding: 20,
    },
    imageUploadSection: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
        borderWidth: 2,
        borderColor: '#e9ecef',
        borderStyle: 'dashed',
    },
    uploadedImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 10,
        fontSize: 16,
        color: '#FFA500',
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    categoryButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    categoryButtonText: {
        fontSize: 16,
        color: '#1F2937',
    },
    uploadButton: {
        borderRadius: 8,
        padding: 0,
        alignItems: 'center',
        marginTop: 20,
        overflow: 'hidden',
    },
    uploadButtonGradient: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        width: '100%',
    },
    uploadButtonDisabled: {
        opacity: 0.7,
    },
    uploadButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    progressContainer: {
        height: 4,
        backgroundColor: '#e9ecef',
        borderRadius: 2,
        marginTop: 20,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
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
    categoryList: {
        padding: 20,
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryItemText: {
        fontSize: 16,
        color: '#1F2937',
    },
    radioButton: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginRight: 8,
        backgroundColor: '#f8f9fa',
    },
    radioButtonSelected: {
        borderColor: '#00796b',
        backgroundColor: '#e0f2f1',
    },
    radioText: {
        color: '#333',
    },
    radioTextSelected: {
        color: '#00796b',
        fontWeight: 'bold',
    },
}); 