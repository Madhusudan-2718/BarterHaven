import { View, Text, StyleSheet, Alert, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { usePathname, useRouter } from 'expo-router';
import { supabase } from '@/Config/supabaseConfig';
import { useAuth } from '@/Config/AuthContext';
import { useColorScheme } from 'react-native';

const CustomDrawerContent = (props) => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, signOut } = useAuth();

    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState(user?.email || '');
    const [userPhoto, setUserPhoto] = useState(null);

    useEffect(() => {
        if (user) {
            // Fetch user profile from Supabase
            const fetchUserProfile = async () => {
                try {
                    const { data: profile, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (error) throw error;

                    if (profile) {
                        setUserName(profile.name || '');
                        setUserPhoto(profile.profile_image_url);
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            };

            fetchUserProfile();
        }
    }, [user]);

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    onPress: async () => {
                        try {
                            await signOut();
                            router.replace('/');
                        } catch (error) {
                            console.error("Logout error:", error);
                            Alert.alert("Error", "Failed to logout.");
                        }
                    },
                },
            ]
        );
    };

    return (
        <DrawerContentScrollView {...props}>
            {/* User Info Section */}
            <View style={styles.userInfoContainer}>
                {userPhoto ? (
                    <Image source={{ uri: userPhoto }} style={styles.userImage} />
                ) : (
                    <Ionicons name="person-circle-outline" size={80} color="#075eec" />
                )}
                <Text style={{ fontFamily: 'outfit-bold', fontSize: 20 }}>Welcome,</Text>
                <Text style={styles.userName}>{userName || "User Name"}</Text>
                <Text style={styles.userEmail}>{userEmail}</Text>
            </View>

            {/* Drawer Items */}
            <DrawerItem
                icon={({ size }) => (
                    <Ionicons name="home" size={size} color={pathname === '/home' ? '#fff' : "#075eec"} />
                )}
                label={'Home'}
                labelStyle={[styles.navItemLabel, { color: pathname === '/home' ? '#fff' : "#075eec" }]}
                style={{ backgroundColor: pathname === '/home' ? '#075eec' : "#fff" }}
                onPress={() => { router.push('(drawer)/(tabs)/home'); }}
            />

            <DrawerItem
                icon={({ size }) => (
                    <MaterialIcons name="account-circle" size={size} color={pathname === '/profile' ? '#fff' : "#075eec"} />
                )}
                label={'Profile'}
                labelStyle={[styles.navItemLabel, { color: pathname === '/profile' ? '#fff' : "#075eec" }]}
                style={{ backgroundColor: pathname === '/profile' ? '#075eec' : "#fff" }}
                onPress={() => { router.push('(drawer)/(tabs)/profile'); }}
            />

            <DrawerItem
                icon={({ size }) => (
                    <Ionicons name="settings" size={size} color={pathname === '/settings' ? '#fff' : "#075eec"} />
                )}
                label={'Settings'}
                labelStyle={[styles.navItemLabel, { color: pathname === '/settings' ? '#fff' : "#075eec" }]}
                style={{ backgroundColor: pathname === '/settings' ? '#075eec' : "#fff" }}
                onPress={() => { router.push('settings'); }}
            />

            <DrawerItem
                icon={({ size }) => (
                    <Ionicons name="log-out" size={size} color="#d9534f" />
                )}
                label={'Logout'}
                labelStyle={[styles.navItemLabel, { color: "#d9534f" }]}
                style={{ backgroundColor: "#fff" }}
                onPress={handleLogout}
            />
        </DrawerContentScrollView>
    );
};

export default function Layout() {
    const colorScheme = useColorScheme();
    const { user, loading } = useAuth();

    if (loading) {
        return null;
    }

    return (
        <Drawer
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
                },
                headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
                drawerStyle: {
                    backgroundColor: '#fff',
                },
                drawerActiveTintColor: '#007AFF',
                drawerInactiveTintColor: colorScheme === 'dark' ? '#fff' : '#000',
            }}
        >
            <Drawer.Screen
                name="(tabs)"
                options={{
                    title: 'Home',
                    headerShown: false,
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Drawer>
    );
}

const styles = StyleSheet.create({
    userInfoContainer: {
        alignItems: 'center',
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: '#F3F4F6',
    },
    userImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    userEmail: {
        fontSize: 14,
        color: '#6B7280',
    },
    navItemLabel: {
        marginLeft: -5,
        fontFamily: 'outfit',
        fontSize: 18,
        color: '#1F2937',
    },
});
