import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import TransactionHistoryService from "../../services/transactionHistoryService";

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const { accountID } = useLocalSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (accountID) {
      loadTransactionHistory();
    }
  }, [accountID]);

  const loadTransactionHistory = async () => {
    try {
      setIsLoading(true);
      console.log(
        "Loading transaction history for account:",
        accountID
      );

      const result =
        await TransactionHistoryService.getTransactionHistoryByAccount(
          accountID
        );
      console.log("Transaction history result:", result);

      if (result.success) {
        setTransactions(result.data);
      } else {
        console.log("No transaction history found");
        setTransactions([]);
      }
    } catch (error) {
      console.error("Error loading transaction history:", error);
      Alert.alert("Lỗi", "Không thể tải lịch sử giao dịch");
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatAmount = (amount) => {
    return amount.toLocaleString("vi-VN") + " ₫";
  };

  const formatStatus = (status) => {
    switch (status) {
      case "completed":
        return "Hoàn thành";
      case "pending":
        return "Đang xử lý";
      case "failed":
        return "Thất bại";
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "#4CAF50";
      case "pending":
        return "#FFA500";
      case "failed":
        return "#FF6B6B";
      default:
        return "#666";
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang tải lịch sử giao dịch...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử giao dịch</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#999" />
            <Text style={styles.emptyTitle}>
              Chưa có giao dịch nào
            </Text>
            <Text style={styles.emptySubtitle}>
              Lịch sử giao dịch sẽ hiển thị ở đây
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsContainer}>
            {transactions.map((transaction, index) => (
              <View
                key={transaction.transactionHistoryID || index}
                style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionNote}>
                      {transaction.note}
                    </Text>
                    <Text style={styles.transactionDate}>
                      {formatDate(transaction.transactionDate)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          transaction.status
                        ),
                      },
                    ]}>
                    <Text style={styles.statusText}>
                      {formatStatus(transaction.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.transactionDetails}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Số tiền:</Text>
                    <Text style={styles.amountValue}>
                      {formatAmount(transaction.amount)}
                    </Text>
                  </View>

                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>
                      Số dư trước:
                    </Text>
                    <Text style={styles.balanceValue}>
                      {formatAmount(transaction.before)}
                    </Text>
                  </View>

                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>
                      Số dư sau:
                    </Text>
                    <Text style={styles.balanceValue}>
                      {formatAmount(transaction.after)}
                    </Text>
                  </View>

                  <View style={styles.transferRow}>
                    <Text style={styles.transferLabel}>Đến:</Text>
                    <Text style={styles.transferValue}>
                      {transaction.receiver?.replace("Mã ví: ", "") ||
                        transaction.receiver}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  transactionsContainer: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  transactionInfo: {
    flex: 1,
    marginRight: 10,
  },
  transactionNote: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  transactionDate: {
    fontSize: 14,
    color: "#666",
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 15,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  transferRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  transferLabel: {
    fontSize: 14,
    color: "#666",
  },
  transferValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
});
