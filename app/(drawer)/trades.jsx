import React, { useState, useEffect } from 'react';
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

export default function TradesScreen() {
    const [trades, setTrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchTrades();
    }, []);

    const fetchTrades = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('trade_proposals')
                .select(`
                    *,
                    offered_item:offered_item_id(title, image_url, category),
                    requested_item:requested_item_id(title, image_url, category),
                    offerer:offerer_id(name, profile_image_url),
                    receiver:receiver_id(name, profile_image_url)
                `)
                .or(`offerer_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTrades(data || []);
        } catch (error) {
            console.error('Error fetching trades:', error);
        } finally {
            setLoading(false);
        }
    };

    const TradeCard = React.memo(({ trade }) => {
        const scaleAnim = React.useRef(new Animated.Value(1)).current;

        const onPressIn = () => {
            Animated.spring(scaleAnim, {
                toValue: 0.98,
                friction: 5,
                tension: 40,
                useNativeDriver: true
            }).start();
        };

        const onPressOut = () => {
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                tension: 40,
                useNativeDriver: true
            }).start();
        };

        const getStatusColor = (status) => {
            switch (status) {
                case 'pending': return '#FFA500';
                case 'accepted': return '#10B981';
                case 'rejected': return '#EF4444';
                case 'completed': return '#075eec';
                default: return '#6B7280';
            }
        };

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => router.push(`/trades/${trade.id}`)}
            >
                <Animated.View style={[
                    styles.tradeCard,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    <View style={styles.tradeHeader}>
                        <View style={styles.userInfo}>
                            <Image
                                source={{ 
                                    uri: trade.offerer.profile_image_url || 
                                        'https://via.placeholder.com/32'
                                }}
                                style={styles.userAvatar}
                            />
                            <Text style={styles.userName}>{trade.offerer.name}</Text>
                        </View>
                        <View style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(trade.status) + '20' }
                        ]}>
                            <Text style={[
                                styles.statusText,
                                { color: getStatusColor(trade.status) }
                            ]}>
                                {trade.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.itemsContainer}>
                        <View style={styles.itemBox}>
                            <Image
                                source={{ uri: trade.offered_item.image_url }}
                                style={styles.itemImage}
                            />
                            <Text style={styles.itemTitle} numberOfLines={2}>
                                {trade.offered_item.title}
                            </Text>
                            <View style={styles.categoryBadge}>
                                <Ionicons name="pricetag-outline" size={12} color="#075eec" />
                                <Text style={styles.categoryText}>
                                    {trade.offered_item.category}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.exchangeIcon}>
                            <Ionicons name="swap-horizontal" size={24} color="#075eec" />
                        </View>

                        <View style={styles.itemBox}>
                            <Image
                                source={{ uri: trade.requested_item.image_url }}
                                style={styles.itemImage}
                            />
                            <Text style={styles.itemTitle} numberOfLines={2}>
                                {trade.requested_item.title}
                            </Text>
                            <View style={styles.categoryBadge}>
                                <Ionicons name="pricetag-outline" size={12} color="#075eec" />
                                <Text style={styles.categoryText}>
                                    {trade.requested_item.category}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.dateText}>
                        {new Date(trade.created_at).toLocaleDateString()}
                    </Text>
                </Animated.View>
            </TouchableOpacity>
        );
    });

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

            <FlatList
                data={trades}
                renderItem={({ item }) => <TradeCard trade={item} />}
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
}); 