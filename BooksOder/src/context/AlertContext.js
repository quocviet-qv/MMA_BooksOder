import { Ionicons } from '@expo/vector-icons';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Alert as NativeAlert,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 48, 360);

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alertConfig, setAlertConfig] = useState(null);

  // Hook ghi đè Alert.alert của React Native để toàn bộ ứng dụng tự động dùng popup mới
  useEffect(() => {
    const originalAlert = NativeAlert.alert;

    NativeAlert.alert = (title, message, buttons, options) => {
      let resolvedButtons = buttons;
      if (!resolvedButtons || !Array.isArray(resolvedButtons) || resolvedButtons.length === 0) {
        resolvedButtons = [{ text: 'Đồng ý', style: 'default' }];
      }

      // Xác định loại icon & màu sắc dựa theo tiêu đề và nội dung
      const t = (title || '').toLowerCase();
      const m = (message || '').toLowerCase();
      let type = 'info';

      if (
        t.includes('thành công') ||
        t.includes('🎉') ||
        t.includes('cảm ơn') ||
        t.includes('success') ||
        m.includes('thành công') ||
        m.includes('đã thêm') ||
        m.includes('đã lưu') ||
        m.includes('đã cập nhật')
      ) {
        type = 'success';
      } else if (
        t.includes('lỗi') ||
        t.includes('thất bại') ||
        t.includes('không thể') ||
        t.includes('error') ||
        t.includes('failed')
      ) {
        type = 'error';
      } else if (
        t.includes('xác nhận') ||
        t.includes('cảnh báo') ||
        t.includes('chắc chắn') ||
        t.includes('warning') ||
        t.includes('confirm') ||
        resolvedButtons.some((b) => b.style === 'destructive')
      ) {
        type = 'confirm';
      }

      setAlertConfig({
        title,
        message,
        buttons: resolvedButtons,
        type,
        cancelable: options?.cancelable ?? true,
      });
    };

    return () => {
      NativeAlert.alert = originalAlert;
    };
  }, []);

  const hideAlert = () => {
    setAlertConfig(null);
  };

  const handleButtonPress = (btn) => {
    hideAlert();
    if (btn.onPress) {
      // Đợi modal đóng mượt mà rồi mới chạy callback
      setTimeout(() => {
        btn.onPress();
      }, 120);
    }
  };

  const getIconConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          color: '#059669',
          bgOuter: '#ECFDF5',
          bgInner: '#D1FAE5',
        };
      case 'error':
        return {
          icon: 'close-circle',
          color: '#DC2626',
          bgOuter: '#FEF2F2',
          bgInner: '#FEE2E2',
        };
      case 'confirm':
        return {
          icon: 'help-circle',
          color: '#B91C1C',
          bgOuter: '#FFF1F2',
          bgInner: '#FFE4E6',
        };
      default:
        return {
          icon: 'information-circle',
          color: '#B91C1C',
          bgOuter: '#FFF1F2',
          bgInner: '#FFE4E6',
        };
    }
  };

  const iconCfg = alertConfig ? getIconConfig(alertConfig.type) : null;
  const isDual = alertConfig?.buttons?.length === 2;

  return (
    <AlertContext.Provider value={{ setAlertConfig, hideAlert }}>
      {children}

      {/* POPUP ACTION MODAL CAO CẤP */}
      <Modal
        visible={!!alertConfig}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (alertConfig?.cancelable !== false) {
            hideAlert();
          }
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            if (alertConfig?.cancelable !== false) {
              hideAlert();
            }
          }}
        >
          <View style={popupStyles.overlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={popupStyles.card}>
                {/* ICON HUY HIỆU NỔI BẬT */}
                {iconCfg && (
                  <View style={[popupStyles.iconOuter, { backgroundColor: iconCfg.bgOuter }]}>
                    <View style={[popupStyles.iconInner, { backgroundColor: iconCfg.bgInner }]}>
                      <Ionicons name={iconCfg.icon} size={36} color={iconCfg.color} />
                    </View>
                  </View>
                )}

                {/* TIÊU ĐỀ POPUP */}
                {alertConfig?.title ? (
                  <Text style={popupStyles.title}>{alertConfig.title}</Text>
                ) : null}

                {/* NỘI DUNG THÔNG BÁO */}
                {alertConfig?.message ? (
                  <Text style={popupStyles.message}>{alertConfig.message}</Text>
                ) : null}

                {/* CÁC NÚT THAO TÁC */}
                <View
                  style={[
                    popupStyles.btnContainer,
                    isDual ? popupStyles.btnRow : popupStyles.btnColumn,
                  ]}
                >
                  {alertConfig?.buttons?.map((btn, index) => {
                    const isCancel = btn.style === 'cancel';
                    const isDestructive = btn.style === 'destructive';

                    let btnStyle = popupStyles.btnPrimary;
                    let textStyle = popupStyles.btnPrimaryText;

                    if (isCancel) {
                      btnStyle = popupStyles.btnCancel;
                      textStyle = popupStyles.btnCancelText;
                    } else if (isDestructive) {
                      btnStyle = popupStyles.btnDestructive;
                      textStyle = popupStyles.btnDestructiveText;
                    }

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[popupStyles.buttonBase, btnStyle, isDual && { flex: 1 }]}
                        activeOpacity={0.85}
                        onPress={() => handleButtonPress(btn)}
                      >
                        <Text style={[popupStyles.buttonTextBase, textStyle]}>
                          {btn.text || 'OK'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const ctx = useContext(AlertContext);
  return ctx;
}

const popupStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconOuter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  btnContainer: {
    width: '100%',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnColumn: {
    flexDirection: 'column',
    gap: 8,
  },
  buttonBase: {
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  buttonTextBase: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnPrimary: {
    backgroundColor: '#B91C1C',
    shadowColor: '#B91C1C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnPrimaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  btnCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  btnCancelText: {
    color: '#475569',
  },
  btnDestructive: {
    backgroundColor: '#DC2626',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDestructiveText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
