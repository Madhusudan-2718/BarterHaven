import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';
import { useAuth } from '@/Config/AuthContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TradeProposals() {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [itemTitles, setItemTitles] = useState({}); // Cache for missing item titles
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            fetchProposals();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchProposals = async () => {
        if (!user) return;
        try {
            const { data: sentProposals, error: sentError } = await supabase
                .from('trade_proposals')
                .select(`
                    *,
                    items!item_id (
                        id,
                        title,
                        image_url,
                        user_id
                    )
                `)
                .eq('proposer_id', user.id)
                .order('created_at', { ascending: false });
            if (sentError) throw sentError;
            const { data: receivedProposals, error: receivedError } = await supabase
                .from('trade_proposals')
                .select(`
                    *,
                    items!item_id (
                        id,
                        title,
                        image_url,
                        user_id
                    )
                `)
                .eq('items.user_id', user.id)
                .order('created_at', { ascending: false });
            if (receivedError) throw receivedError;
            const uniqueProposals = new Map();
            (sentProposals || []).forEach(proposal => {
                uniqueProposals.set(proposal.id, { ...proposal, type: 'sent' });
            });
            (receivedProposals || []).forEach(proposal => {
                uniqueProposals.set(proposal.id, { ...proposal, type: 'received' });
            });
            const allProposals = Array.from(uniqueProposals.values());
            setProposals(allProposals);
            // Fetch missing item titles and images
            const missing = allProposals.filter(p => !p.items && p.item_id && !itemTitles[p.item_id]);
            if (missing.length > 0) {
                const ids = missing.map(p => p.item_id);
                const { data: itemsData } = await supabase
                    .from('items')
                    .select('id, title, image_url')
                    .in('id', ids);
                if (itemsData) {
                    const newTitles = { ...itemTitles };
                    itemsData.forEach(item => {
                        newTitles[item.id] = { title: item.title, image_url: item.image_url };
                    });
                    setItemTitles(newTitles);
                }
            }
        } catch (error) {
            console.error('Error fetching proposals:', error);
            Alert.alert('Error', 'Failed to load trade proposals');
        } finally {
            setLoading(false);
        }
    };

    const handleProposalAction = async (proposalId, action) => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('trade_proposals')
                .update({
                    status: action,
                    updated_at: new Date().toISOString()
                })
                .eq('id', proposalId);
            if (error) throw error;
            if (action === 'accepted') {
                const proposal = proposals.find(p => p.id === proposalId);
                if (proposal) {
                    await supabase
                        .from('trade_proposals')
                        .update({
                            status: 'cancelled',
                            updated_at: new Date().toISOString()
                        })
                        .eq('item_id', proposal.item_id)
                        .neq('id', proposalId)
                        .eq('status', 'pending');
                }
            }
            Alert.alert('Success', `Proposal ${action} successfully`);
            fetchProposals();
        } catch (error) {
            console.error('Error updating proposal:', error);
            Alert.alert('Error', 'Failed to update proposal status');
        }
    };

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Please sign in to view trade proposals</Text>
            </View>
        );
    }
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#075eec" />
            </View>
        );
    }
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Trade Proposals</Text>
            {proposals.length === 0 ? (
                <Text style={styles.emptyText}>No trade proposals yet</Text>
            ) : (
                proposals.map((proposal) => {
                    let itemTitle = proposal.items?.title;
                    let itemImage = proposal.items?.image_url;
                    if (proposal.item_id && itemTitles[proposal.item_id]) {
                        if (!itemTitle) itemTitle = itemTitles[proposal.item_id].title;
                        if (!itemImage) itemImage = itemTitles[proposal.item_id].image_url;
                    }
                    // Optionally, you can add a placeholder image URL here
                    const placeholderImage = 'https://via.placeholder.com/60x60?text=No+Image';
                    return (
                        <View key={proposal.id} style={styles.proposalCard}>
                            <TouchableOpacity 
                                style={styles.proposalHeaderWithImage}
                                onPress={() => router.push(`/item/${proposal.item_id}`)}
                            >
                                <Image
                                    source={{ uri: itemImage || placeholderImage }}
                                    style={styles.itemImage}
                                    resizeMode="cover"
                                />
                                <Text style={styles.proposalTitle}>
                                    {itemTitle || 'This item may have been deleted or is unavailable.'}
                                </Text>
                                <View style={[styles.statusBadge, styles[`status${proposal.status}`]]}>
                                    <Text style={styles.statusText}>
                                        {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                            <Text style={styles.proposalInfo}>
                                {user.id === proposal.proposer_id ? 'You proposed to trade' : 'Someone proposed to trade'}
                            </Text>
                            <Text style={styles.description}>
                                {proposal.proposed_item_description}
                            </Text>
                            {proposal.message && (
                                <Text style={styles.message}>
                                    Message: {proposal.message}
                                </Text>
                            )}
                            {proposal.status === 'pending' && (
                                <View style={styles.actions}>
                                    {user.id === proposal.items?.user_id ? (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.acceptButton]}
                                                onPress={() => handleProposalAction(proposal.id, 'accepted')}
                                            >
                                                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                                                <Text style={styles.actionButtonText}>Accept</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.actionButton, styles.rejectButton]}
                                                onPress={() => handleProposalAction(proposal.id, 'rejected')}
                                            >
                                                <MaterialCommunityIcons name="close" size={20} color="#fff" />
                                                <Text style={styles.actionButtonText}>Reject</Text>
                                            </TouchableOpacity>
                                        </>
                                    ) : (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.cancelButton]}
                                            onPress={() => handleProposalAction(proposal.id, 'cancelled')}
                                        >
                                            <MaterialCommunityIcons name="cancel" size={20} color="#fff" />
                                            <Text style={styles.actionButtonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2E3192',
    },
    emptyText: {
        textAlign: 'center',
        color: '#666',
        fontSize: 16,
        marginTop: 20,
    },
    proposalCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    proposalHeaderWithImage: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    itemImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#eee',
    },
    proposalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
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
        backgroundColor: '#F59E0B',
    },
    statusaccepted: {
        backgroundColor: '#10B981',
    },
    statusrejected: {
        backgroundColor: '#EF4444',
    },
    statuscancelled: {
        backgroundColor: '#6B7280',
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    proposalInfo: {
        fontSize: 14,
        color: '#4B5563',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#1F2937',
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginLeft: 8,
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
        marginLeft: 4,
        fontWeight: '600',
    },
}); 