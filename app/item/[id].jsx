import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useAuth } from '@/Config/AuthContext';

const { width } = Dimensions.get('window');

export default function ItemDetails() {
    const { id } = useLocalSearchParams();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showProposeModal, setShowProposeModal] = useState(false);
    const [proposedItemDescription, setProposedItemDescription] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        const fetchItem = async () => {
            const { data, error } = await supabase
                .from('items')
                .select('* , users(*)')
                .eq('id', id)
                .single();
            setItem(data);
            setLoading(false);
        };
        if (id) fetchItem();
    }, [id]);

    const handleProposeTrade = async () => {
        if (!user) {
            Alert.alert('Error', 'Please sign in to propose a trade');
            return;
        }

        if (!proposedItemDescription.trim()) {
            Alert.alert('Error', 'Please describe what you are offering in exchange');
            return;
        }

        setSubmitting(true);
        try {
            // First check if user is the item owner
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
                throw checkError;
            }

            if (existingProposals && existingProposals.length > 0) {
                Alert.alert(
                    'Already Proposed',
                    'You already have a pending trade proposal for this item.',
                    [{ text: 'OK' }]
                );
                return;
            }

            // Create the trade proposal
            const { data: proposal, error } = await supabase
                .from('trade_proposals')
                .insert([
                    {
                        item_id: id,
                        proposer_id: user.id,
                        proposed_item_description: proposedItemDescription.trim(),
                        message: message.trim() || null,
                        status: 'pending'
                    }
                ])
                .select()
                .single();

            if (error) {
                throw error;
            }

            Alert.alert(
                'Success',
                'Trade proposal sent successfully!',
                [{ text: 'OK', onPress: () => setShowProposeModal(false) }]
            );

            // Reset form
            setProposedItemDescription('');
            setMessage('');
        } catch (error) {
            console.error('Error proposing trade:', error);
            Alert.alert(
                'Error',
                'Failed to send trade proposal. Please try again.'
            );
        } finally {
            setSubmitting(false);
        }
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
                    <View style={styles.row}><Ionicons name="information-circle-outline" size={20} color="#3B82F6" /><Text style={styles.label}> Description</Text></View>
                    <Text style={styles.text}>{item.description}</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}><MaterialCommunityIcons name="gift-outline" size={20} color="#10B981" /><Text style={styles.label}> Offering</Text></View>
                    <Text style={styles.text}>{item.offering}</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}><MaterialCommunityIcons name="swap-horizontal" size={20} color="#F59E42" /><Text style={styles.label}> In Exchange For</Text></View>
                    <Text style={styles.text}>{item.exchangefor}</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}><Ionicons name="pricetag-outline" size={20} color="#6c2eb7" /><Text style={styles.label}> Category</Text></View>
                    <Text style={styles.text}>{item.category}</Text>
                    <View style={styles.divider} />
                    <View style={styles.row}><Ionicons name="person-circle-outline" size={20} color="#FFA500" /><Text style={styles.label}> Listed by</Text></View>
                    <Text style={styles.text}>{item.users?.name || 'User'}</Text>

                    {/* Only show propose button if user is logged in AND is not the item owner */}
                    {user && user.id !== item.user_id ? (
                        <TouchableOpacity
                            style={styles.proposeButton}
                            onPress={() => setShowProposeModal(true)}
                        >
                            <Text style={styles.proposeButtonText}>Propose Trade</Text>
                        </TouchableOpacity>
                    ) : !user ? (
                        <TouchableOpacity
                            style={[styles.proposeButton, styles.proposeButtonDisabled]}
                            onPress={() => Alert.alert('Sign In Required', 'Please sign in to propose a trade')}
                        >
                            <Text style={styles.proposeButtonText}>Sign In to Trade</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Trade Proposal Modal */}
            <Modal
                visible={showProposeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowProposeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Propose a Trade</Text>
                            <TouchableOpacity onPress={() => setShowProposeModal(false)}>
                                <Feather name="x" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.modalLabel}>What are you offering in exchange?</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={proposedItemDescription}
                            onChangeText={setProposedItemDescription}
                            placeholder="Describe what you want to trade..."
                            multiline
                            numberOfLines={3}
                        />

                        <Text style={styles.modalLabel}>Message (Optional)</Text>
                        <TextInput
                            style={styles.modalInput}
                            value={message}
                            onChangeText={setMessage}
                            placeholder="Add a message to the owner..."
                            multiline
                            numberOfLines={3}
                        />

                        <TouchableOpacity
                            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
                            onPress={handleProposeTrade}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitButtonText}>Send Proposal</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    bg: {
        flexGrow: 1,
        backgroundColor: '#f0f4f8',
        alignItems: 'center',
        paddingVertical: 30,
        minHeight: '100%',
    },
    card: {
        width: width * 0.93,
        backgroundColor: '#fff',
        borderRadius: 24,
        shadowColor: '#075eec',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 8,
        overflow: 'hidden',
        marginBottom: 30,
    },
    image: {
        width: '100%',
        height: 320,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        backgroundColor: '#eee',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    content: {
        padding: 22,
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#2E3192',
        marginBottom: 18,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    label: {
        fontWeight: '600',
        fontSize: 16,
        color: '#374151',
        marginLeft: 6,
    },
    text: {
        fontSize: 16,
        color: '#212529',
        marginBottom: 12,
        marginTop: 2,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: 10,
        borderRadius: 1,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f4f8',
    },
    proposeButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 20,
        alignItems: 'center',
    },
    proposeButtonDisabled: {
        backgroundColor: '#9CA3AF',
    },
    proposeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.9,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
        marginBottom: 8,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 