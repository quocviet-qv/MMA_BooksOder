import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { API_URL, getAuthHeaders, apiFetch as fetch } from '../src/constants/api';
import { useAuth } from '../src/context/AuthContext';
import { useLanguage } from '../src/context/LanguageContext';
import { styles } from '../styles/AdminDashboardScreenStyles';

export default function AdminDashboardScreen() {
  const { userName, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_URL}/orders/dashboard/stats`, { headers });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        console.error('Không thể lấy dữ liệu thống kê');
      }
    } catch (error) {
      console.error('Lỗi kết nối khi tải thống kê:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchStats(); }, [fetchStats]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogoutPress = () => {
    Alert.alert(
      t('common.logout'),
      t('common.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.logout'), style: 'destructive', onPress: () => logout() },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#B91C1C" />
        <Text style={{ marginTop: 12, color: '#666' }}>{t('common.loading')}</Text>
      </View>
    );
  }

  const s = stats || {
    totalRevenue: 0,
    walletBalance: 0,
    totalOrders: 0,
    pendingOrders: 0,
    shippingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalBooks: 0,
    totalStock: 0,
    topSellingBooks: [],
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>{t('admin.hello')} {userName || 'Admin'}</Text>
          <Text style={styles.headerTitle}>{t('admin.dashboardTitle')}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.logoutBtn, { marginRight: 8, paddingHorizontal: 10 }]}
            onPress={toggleLanguage}
          >
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#B91C1C' }}>
              {language === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Doanh thu nổi bật */}
        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>{t('admin.revenueTitle')}</Text>
          <Text style={styles.revenueValue}>{(s.totalRevenue || 0).toLocaleString('vi-VN')} {t('common.currency')}</Text>
          <Text style={styles.revenueSubtext}>
            {t('admin.fromOrders', { count: s.completedOrders || 0 })}
          </Text>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletIconBox}>
            <Ionicons name="wallet-outline" size={22} color="#059669" />
          </View>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>{t('admin.walletBalance')}</Text>
            <Text style={styles.walletValue}>{(s.walletBalance || 0).toLocaleString('vi-VN')} {t('common.currency')}</Text>
          </View>
        </View>

        {/* Lưới chỉ số KPI */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="receipt-outline" size={22} color="#2563EB" />
            </View>
            <Text style={styles.kpiValue}>{s.totalOrders}</Text>
            <Text style={styles.kpiTitle}>{t('admin.totalOrders')}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time-outline" size={22} color="#D97706" />
            </View>
            <Text style={[styles.kpiValue, { color: '#D97706' }]}>{s.pendingOrders}</Text>
            <Text style={styles.kpiTitle}>{t('admin.pendingOrders')}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="book-outline" size={22} color="#9333EA" />
            </View>
            <Text style={styles.kpiValue}>{s.totalBooks}</Text>
            <Text style={styles.kpiTitle}>{t('admin.activeBooks')}</Text>
          </View>

          <View style={styles.kpiCard}>
            <View style={[styles.kpiIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="cube-outline" size={22} color="#059669" />
            </View>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{s.totalStock}</Text>
            <Text style={styles.kpiTitle}>{t('admin.totalStock')}</Text>
          </View>
        </View>

        {/* Trạng thái đơn hàng */}
        <View style={styles.sectionHeader}>
          <Ionicons name="pie-chart-outline" size={20} color="#B91C1C" />
          <Text style={styles.sectionTitle}>{t('admin.orderStatusBreakdown')}</Text>
        </View>

        <View style={styles.cardBox}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.statusLabel}>{t('orders.statusPending')}</Text>
            </View>
            <View style={[styles.statusCountBadge, { backgroundColor: '#FEF3C7' }]}>
              <Text style={[styles.statusCountText, { color: '#B45309' }]}>
                {s.pendingOrders}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.statusLabel}>{t('orders.statusShipping')}</Text>
            </View>
            <View style={[styles.statusCountBadge, { backgroundColor: '#DBEAFE' }]}>
              <Text style={[styles.statusCountText, { color: '#1D4ED8' }]}>
                {s.shippingOrders}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.statusLabel}>{t('orders.statusCompleted')}</Text>
            </View>
            <View style={[styles.statusCountBadge, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.statusCountText, { color: '#047857' }]}>
                {s.completedOrders}
              </Text>
            </View>
          </View>

          <View style={[styles.statusRow, { borderBottomWidth: 0 }]}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.statusLabel}>{t('orders.statusCancelled')}</Text>
            </View>
            <View style={[styles.statusCountBadge, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.statusCountText, { color: '#B91C1C' }]}>
                {s.cancelledOrders}
              </Text>
            </View>
          </View>
        </View>

        {/* Top sách bán chạy nhất */}
        <View style={styles.sectionHeader}>
          <Ionicons name="trophy-outline" size={20} color="#B91C1C" />
          <Text style={styles.sectionTitle}>{t('admin.topSelling')}</Text>
        </View>

        <View style={styles.cardBox}>
          {(!s.topSellingBooks || s.topSellingBooks.length === 0) ? (
            <Text style={styles.emptyText}>{t('admin.noTopSelling')}</Text>
          ) : (
            s.topSellingBooks.map((book, index) => {
              const badgeColors = [
                { bg: '#FEF3C7', text: '#B45309' }, // Top 1 Gold
                { bg: '#E5E7EB', text: '#374151' }, // Top 2 Silver
                { bg: '#FFEDD5', text: '#9A3412' }, // Top 3 Bronze
              ];
              const badge = badgeColors[index] || { bg: '#F3F4F6', text: '#6B7280' };

              return (
                <View
                  key={book._id || index}
                  style={[
                    styles.rankingItem,
                    index === s.topSellingBooks.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={[styles.rankingBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.rankingText, { color: badge.text }]}>{index + 1}</Text>
                  </View>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingTitle} numberOfLines={1}>
                      {book.title}
                    </Text>
                    <Text style={styles.rankingSold}>
                      {t('admin.soldCount', { count: book.soldCount })}
                    </Text>
                  </View>
                  <Text style={styles.rankingRevenue}>
                    {(book.revenue || 0).toLocaleString('vi-VN')} {t('common.currency')}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
