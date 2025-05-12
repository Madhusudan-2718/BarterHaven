import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    TextInput,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/Config/supabaseConfig';
import { categories } from '@/Config/categories';
import { useRouter } from 'expo-router';

export default function ExploreScreen({ navigation }) {
    const router = useRouter();

    return (
        <FlatList
            style={styles.container}
            ListHeaderComponent={<Text style={styles.header}>Explore Categories</Text>}
            data={categories}
            renderItem={({ item }) => (
                <TouchableOpacity style={styles.categoryItem} onPress={() => router.push(`/category/${item.name}`)}>
                    <Image source={item.image} style={styles.categoryImage} />
                    <Text style={styles.categoryName}>{item.name}</Text>
                </TouchableOpacity>
            )}
            keyExtractor={(item) => item.name}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
        paddingTop: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 20,
    },
    gridContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    categoryItem: {
        flex: 1,
        alignItems: 'center',
        margin: 10,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
        minWidth: 90,
        maxWidth: 120,
    },
    categoryImage: {
        width: 50,
        height: 50,
        marginBottom: 8,
        resizeMode: 'contain',
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: '#3B82F6',
        textAlign: 'center',
    },
});
