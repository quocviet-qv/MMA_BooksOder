import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { API_URL, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';

export default function AdminProfileScreen() {
  const { userId, userName, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setLoadError('Không tìm thấy tài khoản Admin.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/profile/${userId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể tải hồ sơ Admin.');
      setProfile(data);
      setLoadError('');
    } catch (error) {
      console.error('Lỗi tải hồ sơ Admin:', error);
      setLoadError(error.message || 'Không thể tải hồ sơ Admin.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    fetchProfile();
  }, [fetchProfile]));

  const confirmLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất khỏi quyền Quản trị viên?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }} edges={['left', 'right', 'bottom']}>
      <View style={{ flex: 1, padding: 20 }}>
        <View style={{ alignItems: 'center', paddingVertical: 28 }}>
          <View
            style={{
              width: 108,
              height: 108,
              borderRadius: 54,
              backgroundColor: '#FEE2E2',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }}
          >
            <Ionicons name="person-circle" size={92} color="#B91C1C" />
          </View>
          <Text style={{ color: '#0F172A', fontSize: 22, fontWeight: '800' }}>
            {profile?.username || userName || 'Admin'}
          </Text>
          <Text style={{ color: '#64748B', fontSize: 14, marginTop: 5 }}>Quản trị viên</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#B91C1C" />
        ) : loadError ? (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <Text style={{ color: '#B91C1C', textAlign: 'center', marginBottom: 12 }}>{loadError}</Text>
            <TouchableOpacity onPress={fetchProfile} activeOpacity={0.75}>
              <Text style={{ color: '#B91C1C', fontWeight: '700' }}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 18,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
                <Ionicons name="person-outline" size={20} color="#64748B" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>Tên đăng nhập</Text>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700', marginTop: 3 }}>
                    {profile.username}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="mail-outline" size={20} color="#64748B" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={{ color: '#64748B', fontSize: 13 }}>Email</Text>
                  <Text style={{ color: '#0F172A', fontSize: 16, fontWeight: '700', marginTop: 3 }}>
                    {profile.email || 'Chưa cập nhật'}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: 18,
                padding: 20,
                borderWidth: 1,
                borderColor: '#A7F3D0',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="wallet-outline" size={23} color="#059669" />
                <Text style={{ color: '#047857', fontSize: 14, fontWeight: '700', marginLeft: 9 }}>
                  Số dư ví Admin
                </Text>
              </View>
              <Text style={{ color: '#047857', fontSize: 30, fontWeight: '800', marginTop: 12 }}>
                {(profile.walletBalance || 0).toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={{
            height: 52,
            borderRadius: 14,
            backgroundColor: '#DC2626',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 'auto',
          }}
          onPress={confirmLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginLeft: 9 }}>
            Đăng xuất
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
