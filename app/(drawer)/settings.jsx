import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Alert,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/Config/supabaseConfig';

export default function SettingsScreen() {
    const router = useRouter();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Logout",
                    style: 'destructive',
                    onPress: async () => {
                        await supabase.auth.signOut();
                        router.replace('/auth/signIn');
                    }
                }
            ]
        );
    };

    const handleEditProfile = () => {
        // Navigate to the profile tab
        router.push('/(drawer)/(tabs)/profile');
    };

    const SettingItem = React.memo(({ icon, title, description, value, onValueChange, type = 'toggle' }) => {
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

        return (
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                onPress={() => type === 'button' && onValueChange?.()}
            >
                <Animated.View style={[
                    styles.settingItem,
                    { transform: [{ scale: scaleAnim }] }
                ]}>
                    <View style={styles.settingIcon}>
                        <Ionicons name={icon} size={24} color="#075eec" />
                    </View>
                    <View style={styles.settingContent}>
                        <Text style={styles.settingTitle}>{title}</Text>
                        {description && (
                            <Text style={styles.settingDescription}>{description}</Text>
                        )}
                    </View>
                    {type === 'toggle' && (
                        <Switch
                            value={value}
                            onValueChange={onValueChange}
                            trackColor={{ false: '#E5E7EB', true: '#075eec' }}
                            thumbColor="#fff"
                        />
                    )}
                    {type === 'button' && (
                        <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
                    )}
                </Animated.View>
            </TouchableOpacity>
        );
    });

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Preferences</Text>
                    <SettingItem
                        icon="notifications-outline"
                        title="Push Notifications"
                        description="Receive notifications about trades and messages"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                    <SettingItem
                        icon="location-outline"
                        title="Location Services"
                        description="Enable location-based item discovery"
                        value={locationEnabled}
                        onValueChange={setLocationEnabled}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Account</Text>
                    <SettingItem
                        icon="person-outline"
                        title="Edit Profile"
                        description="Update your personal information"
                        type="button"
                        onValueChange={handleEditProfile}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Support</Text>
                    <SettingItem
                        icon="help-circle-outline"
                        title="Help Center"
                        description="Get help and contact support"
                        type="button"
                        onValueChange={() => Alert.alert('Help Center', 'Contact support at support@barterhaven.com')}
                    />
                    <SettingItem
                        icon="document-text-outline"
                        title="Terms of Service"
                        description="Read our terms and conditions"
                        type="button"
                        onValueChange={() => Alert.alert('Terms of Service', 'View our terms and conditions.')}
                    />
                    <SettingItem
                        icon="shield-outline"
                        title="Privacy Policy"
                        description="View our privacy policy"
                        type="button"
                        onValueChange={() => Alert.alert('Privacy Policy', 'View our privacy policy.')}
                    />
                </View>

                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={handleLogout}
                >
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    content: {
        flex: 1,
        paddingTop: 16,
    },
    section: {
        marginTop: 24,
        marginHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#075eec',
        marginBottom: 16,
        fontFamily: 'outfit-bold',
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#EBF5FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 4,
        fontFamily: 'outfit-bold',
    },
    settingDescription: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: 'outfit',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFF1F0',
        marginHorizontal: 16,
        marginVertical: 24,
        padding: 16,
        borderRadius: 16,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF3B30',
        marginLeft: 8,
        fontFamily: 'outfit-bold',
    },
});