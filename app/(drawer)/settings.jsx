import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, Modal, TextInput } from 'react-native';
import React, { useState } from 'react';
import { useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/Config/supabaseConfig';

export default function Settings() {
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setShowPasswordModal(false);
      setNewPassword('');
      Alert.alert('Success', 'Password updated successfully');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Settings</Text>

      <TouchableOpacity style={styles.item} onPress={() => router.push('/(drawer)/(tabs)/profile')}>
        <Text style={styles.itemText}>Edit Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => setShowPasswordModal(true)}>
        <Text style={styles.itemText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => Alert.alert('Terms of Service', 'Show your Terms of Service here.')}>
        <Text style={styles.itemText}>Terms of Service</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.item} onPress={() => Alert.alert('Privacy Policy', 'Show your Privacy Policy here.')}>
        <Text style={styles.itemText}>Privacy Policy</Text>
      </TouchableOpacity>

      {/* Change Password Modal */}
      <Modal visible={showPasswordModal} transparent animationType="slide" onRequestClose={() => setShowPasswordModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity style={styles.modalButton} onPress={handleChangePassword} disabled={loading}>
                <Text style={styles.modalButtonText}>{loading ? 'Updating...' : 'Update'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ccc' }]} onPress={() => setShowPasswordModal(false)}>
                <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1F2937',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    marginTop: 8,
    minWidth: 90,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});