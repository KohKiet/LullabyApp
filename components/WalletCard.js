import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import WalletService from "../services/walletService";

export default function WalletCard({ userData }) {
  const [walletData, setWalletData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const router = useRouter();

  // Check if user is a Member (roleID=4)
  const isMember =
    userData && (userData.roleID === 4 || userData.role_id === 4);

  // Don't render wallet if user is not a Member
  if (!isMember) {
    return null;
  }

  useEffect(() => {
    if (userData) {
      loadWalletData();
    }
  }, [userData]);

  const loadWalletData = async () => {
    try {
      setIsLoading(true);
      const result = await WalletService.getWalletByAccountId(
        userData.accountID || userData.id
      );

      if (result.success) {
        setWalletData(result.data);
      } else {
        // Create default wallet data if not found
        setWalletData({
          walletID: null,
          accountID: userData.accountID || userData.id,
          amount: 0,
          status: "active",
          note: null,
        });
      }
    } catch (error) {
      console.log("Error loading wallet:", error);
      setWalletData({
        walletID: null,
        accountID: userData.accountID || userData.id,
        amount: 0,
        status: "active",
        note: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền");
      return;
    }

    const amount = WalletService.parseAmount(topUpAmount);
    if (amount <= 0) {
      Alert.alert("Lỗi", "Số tiền phải lớn hơn 0");
      return;
    }

    // Kiểm tra số tiền phải chia hết cho 1000 (3 số cuối là 0)
    if (amount % 1000 !== 0) {
      Alert.alert(
        "Lỗi",
        "Số tiền phải có 3 số cuối là 0 (ví dụ: 1,000, 2,000, 24,000)"
      );
      return;
    }

    try {
      const result = await WalletService.topUpWallet(
        userData.accountID || userData.id,
        amount
      );

      if (result.success) {
        // Cập nhật số dư hiện tại
        setWalletData((prevData) => ({
          ...prevData,
          amount: result.data.amount,
        }));

        // Reset input
        setTopUpAmount("");
        setShowTopUpModal(false);

        // Không hiển thị thông báo thành công
      } else {
        Alert.alert("Lỗi", `Không thể nạp tiền: ${result.error}`);
      }
    } catch (error) {
      console.log("Error topping up wallet:", error);
      Alert.alert("Lỗi", "Đã xảy ra lỗi khi nạp tiền.");
    }
  };

  // Format amount input as user types
  const handleAmountInputChange = (text) => {
    // Remove all non-digit characters
    const cleanText = text.replace(/[^\d]/g, "");

    if (cleanText === "") {
      setTopUpAmount("");
      return;
    }

    // Convert to number and format with commas
    const number = parseInt(cleanText);
    if (!isNaN(number)) {
      const formatted = number.toLocaleString("vi-VN");
      setTopUpAmount(formatted);
    }
  };

  // Validate amount format
  const validateAmountFormat = (amount) => {
    const cleanAmount = WalletService.parseAmount(amount);
    return cleanAmount % 1000 === 0;
  };

  const formatAmount = (amount) => {
    return WalletService.formatAmount(amount);
  };

  if (isLoading) {
    return (
      <View style={styles.walletCard}>
        <LinearGradient
          colors={["#4CAF50", "#66BB6A", "#81C784"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải ví...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <>
      <View style={styles.walletContainer}>
        <View style={styles.walletCard}>
          <LinearGradient
            colors={["#4CAF50", "#66BB6A", "#81C784"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.walletTitle}>Lullaby Wallet</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.topUpButton}
                  onPress={() => setShowTopUpModal(true)}>
                  <Ionicons
                    name="add-circle"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.topUpButtonText}>Nạp tiền</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={() => {
                    // Navigate to transaction history screen
                    if (userData?.accountID) {
                      router.push(
                        `/wallet/history?accountID=${userData.accountID}`
                      );
                    }
                  }}>
                  <Ionicons name="time" size={16} color="#FFFFFF" />
                  <Text style={styles.historyButtonText}>
                    Lịch sử
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Ionicons
                  name="person-circle"
                  size={32}
                  color="#FFFFFF"
                />
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.userName}>
                  {userData?.fullName ||
                    userData?.full_name ||
                    "User"}
                </Text>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.balanceContainer}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceLabel}>Số dư</Text>
                <TouchableOpacity
                  onPress={() => setShowBalance(!showBalance)}
                  style={styles.eyeButton}>
                  <Ionicons
                    name={showBalance ? "eye-off" : "eye"}
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.balanceAmount}>
                {showBalance
                  ? formatAmount(walletData?.amount || 0)
                  : "••••••••••••"}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </View>

      {/* Top Up Modal */}
      <Modal
        visible={showTopUpModal}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nạp tiền</Text>
              <TouchableOpacity
                onPress={() => setShowTopUpModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>
                Nhập số tiền (VNĐ) - Phải có 3 số cuối là 0
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  topUpAmount &&
                    !validateAmountFormat(topUpAmount) &&
                    styles.invalidInput,
                ]}
                value={topUpAmount}
                onChangeText={handleAmountInputChange}
                placeholder="Ví dụ: 1,000, 2,000, 24,000"
                keyboardType="numeric"
                autoFocus
              />
              {topUpAmount && !validateAmountFormat(topUpAmount) && (
                <Text style={styles.errorText}>
                  Số tiền phải có 3 số cuối là 0
                </Text>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowTopUpModal(false)}>
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleTopUp}>
                <Text style={styles.confirmButtonText}>Nạp tiền</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  walletCard: {
    marginVertical: 8,
    marginTop: 25,
    marginHorizontal: 5,
    borderRadius: 15,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  gradient: {
    borderRadius: 15,
    padding: 12,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topUpButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  topUpButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 3,
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  historyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 8,
  },
  nameContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2E7D32",
  },
  balanceContainer: {
    marginTop: 6,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  balanceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  eyeButton: {
    padding: 3,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "85%",
    maxWidth: 350,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
    fontWeight: "500",
  },
  amountInput: {
    fontSize: 18,
    color: "#333",
    padding: 15,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  invalidInput: {
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 12,
    marginTop: 5,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  walletContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
});
