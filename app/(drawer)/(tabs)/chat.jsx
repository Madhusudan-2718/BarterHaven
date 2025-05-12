import React, { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { supabase } from '@/Config/supabaseConfig';
import { useAuth } from '@/Config/AuthContext';
import Animated, { withTiming } from 'react-native-reanimated';

export default function ChatScreen({ navigation }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);

  // Fetch all users except current
  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .neq('id', user.id);
      if (data) setUsers(data);
    };
    if (user) fetchUsers();
  }, [user]);

  // Fetch messages with selected user
  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
      setMessages(data || []);
      setLoading(false);
    };
    fetchMessages();

    // Subscribe to new messages
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        if (
          (msg.sender_id === user.id && msg.receiver_id === selectedUser.id) ||
          (msg.sender_id === selectedUser.id && msg.receiver_id === user.id)
        ) {
          setMessages(prev => [...prev, msg]);
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedUser, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedUser) return;
    const { error } = await supabase.from('messages').insert([
      {
        sender_id: user.id,
        receiver_id: selectedUser.id,
        content: newMessage,
        created_at: new Date().toISOString(),
      },
    ]);
    if (!error) setNewMessage('');
  };

  if (!selectedUser) {
    return (
      <View style={styles.container}>
        <Text style={styles.header}>Select a user to chat with:</Text>
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.userItem} onPress={() => setSelectedUser(item)}>
              <Text style={styles.userEmail}>{item.email}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.backButton}>
        <Text style={styles.backButtonText}>{'< Back to users'}</Text>
      </TouchableOpacity>
      <Text style={styles.header}>Chat with {selectedUser.email}</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#075eec" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.messageBubble, item.sender_id === user.id ? styles.myMessage : styles.theirMessage]}>
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={styles.messageTime}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 10 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 10 },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  userItem: { backgroundColor: '#fff', padding: 16, borderRadius: 10, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  userEmail: { fontSize: 16, color: '#1F2937' },
  backButton: { marginBottom: 10 },
  backButtonText: { color: '#3B82F6', fontWeight: 'bold' },
  messageBubble: { padding: 10, borderRadius: 10, marginBottom: 8, maxWidth: '80%' },
  myMessage: { backgroundColor: '#3B82F6', alignSelf: 'flex-end' },
  theirMessage: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start' },
  messageText: { color: '#1F2937' },
  messageTime: { fontSize: 10, color: '#6B7280', marginTop: 2, textAlign: 'right' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  input: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, backgroundColor: '#fff', color: '#1F2937', fontSize: 16 },
  sendButton: { backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, marginLeft: 8 },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});