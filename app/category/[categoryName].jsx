import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';

export default function CategoryScreen() {
    const { categoryName } = useLocalSearchParams();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
            const { data, error } = await supabase
                .from('items')
                .select('*')
                .eq('category', categoryName);
            setItems(data || []);
            setLoading(false);
        };
        fetchItems();
    }, [categoryName]);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{categoryName} Listings</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#075eec" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={items}
                    renderItem={({ item }) => (
                        <View style={styles.itemCard}>
                            <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <Text>{item.description}</Text>
                        </View>
                    )}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40 }}>No listings found.</Text>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F4F6', padding: 10 },
    header: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    itemCard: { backgroundColor: '#fff', marginBottom: 10, borderRadius: 8, padding: 10 },
    itemImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 8 },
    itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
}); 