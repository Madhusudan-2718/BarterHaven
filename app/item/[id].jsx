import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert, Linking } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/Config/AuthContext';
import ItemMatches from '../components/ItemMatches';
import ItemLocation from '../components/ItemLocation';

const { width } = Dimensions.get('window');

export default function ItemDetails() {
    const { id } = useLocalSearchParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposedItemDescription, setProposedItemDescription] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [billDocument, setBillDocument] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchItem = async () => {
            try {
                // Fetch item details with user info
                const { data: itemData, error: itemError } = await supabase
                    .from('items')
                    .select('*, users(*)')
                    .eq('id', id)
                    .single();
                
                if (itemError) throw itemError;

                // Fetch bill document if it exists
                const { data: billData, error: billError } = await supabase
                    .from('bill_documents')
                    .select('*')
                    .eq('item_id', id)
                    .maybeSingle();

                if (billError) throw billError;

                setItem(itemData);
                setBillDocument(billData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching item details:', error);
                setLoading(false);
            }
        };

        const fetchUserLocation = async () => {
            if (user) {
                try {
                    // Fallback: Get user location from Supabase directly
                    const { data: locationData, error } = await supabase
                        .from('users')
                        .select(`
                            latitude,
                            longitude,
                            address_street,
                            address_city,
                            address_region,
                            address_postal_code,
                            address_country,
                            location
                        `)
                        .eq('id', user.id)
                        .single();

                    if (!error && locationData?.latitude && locationData?.longitude) {
                        setUserLocation({
                            latitude: locationData.latitude,
                            longitude: locationData.longitude,
                            address: {
                                street: locationData.address_street || '',
                                city: locationData.address_city || '',
                                region: locationData.address_region || '',
                                postalCode: locationData.address_postal_code || '',
                                country: locationData.address_country || '',
                                fullAddress: locationData.location || '',
                            },
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user location:', error);
                }
            }
        };

        if (id) {
            fetchItem();
            fetchUserLocation();
        }
    }, [id, user]);

    const handleProposeTrade = async (matchedItemId) => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to propose a trade');
            return;
        }

        if (user.id === item.user_id) {
            Alert.alert('Error', 'You cannot propose a trade on your own item');
            return;
        }

        // Check if user already has a pending proposal
        const { data: existingProposals, error: checkError } = await supabase
            .from('trade_proposals')
            .select('id')
            .eq('item_id', id)
            .eq('proposer_id', user.id)
            .eq('status', 'pending');

        if (checkError) {
            console.error('Error checking existing proposals:', checkError);
            Alert.alert('Error', 'Failed to check existing proposals');
            return;
        }

        if (existingProposals && existingProposals.length > 0) {
            Alert.alert(
                'Already Proposed',
                'You already have a pending trade proposal for this item.',
                [{ text: 'OK' }]
            );
            return;
        }

        // Get matched item details
        const { data: matchedItem, error: matchedItemError } = await supabase
            .from('items')
            .select('title, description')
            .eq('id', matchedItemId)
            .single();

        if (matchedItemError) {
            console.error('Error fetching matched item:', matchedItemError);
            Alert.alert('Error', 'Failed to fetch matched item details');
            return;
        }

        // Create the trade proposal
        const { error } = await supabase
            .from('trade_proposals')
            .insert([
                {
                    item_id: id,
                    proposer_id: user.id,
                    proposed_item_description: `Offering: ${matchedItem.title}\n${matchedItem.description || ''}`,
                    status: 'pending'
                }
            ]);

        if (error) {
            console.error('Error creating proposal:', error);
            Alert.alert('Error', 'Failed to create trade proposal');
            return;
        }

        Alert.alert('Success', 'Trade proposal sent successfully');
    };

    const handleDeleteBill = async () => {
        if (!user || user.id !== item.user_id) return;

        Alert.alert(
            'Delete Bill Document',
            'Are you sure you want to delete this bill document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { error } = await supabase
                                .from('bill_documents')
                                .delete()
                                .eq('item_id', id);

                            if (error) throw error;

                            setBillDocument(null);
                            Alert.alert('Success', 'Bill document deleted successfully');
                        } catch (error) {
                            console.error('Error deleting bill:', error);
                            Alert.alert('Error', 'Failed to delete bill document');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.centered}><ActivityIndicator size="large" color="#075eec" /></View>
        );
    }

    if (!item) {
        return (
            <View style={styles.centered}><Text>Item not found.</Text></View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.bg}>
            <View style={styles.card}>
                <Image source={{ uri: item.image_url }} style={styles.image} />
                
                <View style={styles.content}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>
                    
                    <View style={styles.details}>
                        <View style={styles.detailRow}>
                            <Ionicons name="pricetag" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>Category: {item.category}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Ionicons name="checkmark-circle" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>Condition: {item.condition}</Text>
                        </View>
                        
                        <View style={styles.detailRow}>
                            <Ionicons name="swap-horizontal" size={16} color="#6B7280" />
                            <Text style={styles.detailText}>Barter Type: {item.bartertype}</Text>
                        </View>
                    </View>

                    <ItemLocation item={item} userLocation={userLocation} />
                    
                    <View style={styles.userInfo}>
                        <Image 
                            source={{ uri: item.users?.profile_image_url || require('../../assets/images/default-profile.png') }} 
                            style={styles.userImage} 
                        />
                        <View style={styles.userDetails}>
                            <Text style={styles.userName}>{item.users?.name || 'Unknown User'}</Text>
                            <Text style={styles.userRating}>⭐ 5.0 (10 reviews)</Text>
                        </View>
                    </View>

                    {billDocument && (
                        <View style={styles.billSection}>
                            <Text style={styles.billTitle}>Bill Document</Text>
                            <View style={styles.billInfo}>
                                <Ionicons name="document" size={20} color="#3B82F6" />
                                <Text style={styles.billText}>Bill document available</Text>
                                {user && user.id === item.user_id && (
                                    <TouchableOpacity onPress={handleDeleteBill}>
                                        <Ionicons name="trash" size={20} color="#EF4444" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    )}

                    <ItemMatches itemId={id} onProposeTrade={handleProposeTrade} />
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bg: {
        backgroundColor: '#F3F4F6',
        minHeight: '100%',
    },
    card: {
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: 300,
        resizeMode: 'cover',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 24,
    },
    details: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#374151',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        marginBottom: 16,
    },
    userImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    userRating: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    billSection: {
        marginBottom: 16,
    },
    billTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    billInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#EFF6FF',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    billText: {
        flex: 1,
        marginLeft: 8,
        fontSize: 14,
        color: '#1E40AF',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
}); 