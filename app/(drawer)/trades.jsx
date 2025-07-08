import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/Config/supabaseConfig';
import { useRouter } from 'expo-router';
import { TradesRefreshContext } from './_layout';
import { useAuth } from '@/Config/AuthContext';

export default function TradesScreen() {
    const [proposals, setProposals] = useState({ pending: [], accepted: [], rejected: [], completed: [] });
    const [loading, setLoading] = useState(true);
    const [tradeTab, setTradeTab] = useState('pending'); // 'pending', 'accepted', 'rejected', 'completed'
    const router = useRouter();
    const { user } = useAuth();
    const { trigger } = useContext(TradesRefreshContext);

    useEffect(() => {
        fetchProposals();
    }, [trigger, user]);

    const fetchProposals = async () => {
        setLoading(true);
        try {
            if (!user) return;
            const { data, error } = await supabase
                .from('trade_proposals')
                .select(`*, items:item_id(*, user_id, title, image_url)`) // join item info
                .or(`proposer_id.eq.${user.id},items.user_id.eq.${user.id}`)
                .order('created_at', { ascending: false });
            if (error) throw error;
            // Group proposals by status
            const grouped = { pending: [], accepted: [], rejected: [], completed: [] };
            (data || []).forEach(p => {
                if (p.status === 'pending') grouped.pending.push(p);
                else if (p.status === 'accepted') grouped.accepted.push(p);
                else if (p.status === 'rejected') grouped.rejected.push(p);
                else if (p.status === 'completed') grouped.completed.push(p);
            });
            setProposals(grouped);
        } catch (error) {
            setProposals({ pending: [], accepted: [], rejected: [], completed: [] });
        } finally {
            setLoading(false);
        }
    };

    const ProposalCard = ({ proposal }) => {
        const otherPartyId = user.id === proposal.proposer_id ? proposal.items?.user_id : proposal.proposer_id;
        const otherPartyRole = user.id === proposal.proposer_id ? 'Receiver' : 'Proposer';
        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push(`/item/${proposal.item_id}`)}
            >
                <View style={styles.tradeCard}>
                    <View style={styles.tradeHeader}>
                        <Image
                            source={{ uri: proposal.items?.image_url || 'https://via.placeholder.com/32' }}
                            style={styles.userAvatar}
                        />
                        <Text style={styles.userName}>{proposal.items?.title || 'Unknown Item'}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{proposal.status.toUpperCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.dateText}>{new Date(proposal.created_at).toLocaleDateString()}</Text>
                    <Text style={styles.itemTitle}>{proposal.proposed_item_description}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#075eec" />
                <Text style={styles.loadingText}>Loading trades...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Trades</Text>
            </View>
            <View style={{ flexDirection: 'row', marginBottom: 8, paddingHorizontal: 16 }}>
                <TouchableOpacity onPress={() => setTradeTab('pending')} style={[styles.tabButton, tradeTab === 'pending' && styles.tabButtonActive]}>
                    <Text style={[styles.tabButtonText, tradeTab === 'pending' && styles.tabButtonTextActive]}>Pending</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTradeTab('accepted')} style={[styles.tabButton, tradeTab === 'accepted' && styles.tabButtonActive]}>
                    <Text style={[styles.tabButtonText, tradeTab === 'accepted' && styles.tabButtonTextActive]}>Accepted</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTradeTab('rejected')} style={[styles.tabButton, tradeTab === 'rejected' && styles.tabButtonActive]}>
                    <Text style={[styles.tabButtonText, tradeTab === 'rejected' && styles.tabButtonTextActive]}>Rejected</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTradeTab('completed')} style={[styles.tabButton, tradeTab === 'completed' && styles.tabButtonTextActive]}>
                    <Text style={[styles.tabButtonText, tradeTab === 'completed' && styles.tabButtonTextActive]}>Completed</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={proposals[tradeTab]}
                renderItem={({ item }) => <ProposalCard proposal={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.tradesList}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="swap-horizontal" size={64} color="#075eec" />
                        <Text style={styles.emptyTitle}>No trades yet</Text>
                        <Text style={styles.emptyDescription}>
                            Start trading by browsing available items and making offers.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    header: {
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 3,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#075eec',
        fontFamily: 'outfit-bold',
    },
    tradesList: {
        padding: 16,
    },
    tradeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tradeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        marginRight: 8,
        borderWidth: 2,
        borderColor: '#075eec',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#075eec',
        fontFamily: 'outfit',
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'outfit',
    },
    itemsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    itemBox: {
        flex: 1,
        alignItems: 'center',
    },
    itemImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginBottom: 8,
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 4,
        fontFamily: 'outfit',
    },
    exchangeIcon: {
        paddingHorizontal: 12,
    },
    categoryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBF5FF',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        color: '#075eec',
        marginLeft: 4,
        fontFamily: 'outfit',
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'right',
        marginTop: 8,
        fontFamily: 'outfit',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#075eec',
        fontFamily: 'outfit',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#075eec',
        marginTop: 16,
        marginBottom: 8,
        fontFamily: 'outfit-bold',
    },
    emptyDescription: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 32,
        fontFamily: 'outfit',
    },
    tabButton: {
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginRight: 8,
    },
    tabButtonActive: {
        borderColor: '#075eec',
    },
    tabButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    tabButtonTextActive: {
        color: '#075eec',
    },
}); 