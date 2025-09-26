import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "auth_token";

export default function AsyncStorageDebugger() {
  const [storageData, setStorageData] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadStorageData = async () => {
    try {
      setIsLoading(true);
      console.log("🔍 Loading AsyncStorage data...");

      // Lấy tất cả keys
      const keys = await AsyncStorage.getAllKeys();
      console.log("🔍 All AsyncStorage keys:", keys);

      const data = {};

      // Lấy user data
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      console.log("🔍 Raw user data from AsyncStorage:", userData);

      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          console.log("🔍 Parsed user data:", parsedUser);
          console.log("🔍 User data keys:", Object.keys(parsedUser));
          data.user = parsedUser;
        } catch (parseError) {
          console.error("🔍 Error parsing user data:", parseError);
          data.user = { error: "Parse error", raw: userData };
        }
      } else {
        console.log("🔍 No user data found in AsyncStorage");
        data.user = null;
      }

      // Lấy token
      const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
      console.log("🔍 Token from AsyncStorage:", token);
      data.token = token;

      // Lấy tất cả data
      const allData = await AsyncStorage.multiGet(keys);
      console.log("🔍 All AsyncStorage data:", allData);
      data.allData = allData;

      setStorageData(data);
    } catch (error) {
      console.error("🔍 Error loading AsyncStorage data:", error);
      setStorageData({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log("🔍 AsyncStorage cleared");
      Alert.alert("Thông báo", "AsyncStorage đã được xóa");
      loadStorageData();
    } catch (error) {
      console.error("🔍 Error clearing AsyncStorage:", error);
      Alert.alert("Thông báo", "Không thể xóa AsyncStorage");
    }
  };

  const clearUserData = async () => {
    try {
      await AsyncStorage.multiRemove([
        USER_STORAGE_KEY,
        TOKEN_STORAGE_KEY,
      ]);
      console.log("🔍 User data and token cleared");
      Alert.alert("Thông báo", "User data và token đã được xóa");
      loadStorageData();
    } catch (error) {
      console.error("🔍 Error clearing user data:", error);
      Alert.alert("Thông báo", "Không thể xóa user data");
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>
          Đang tải dữ liệu AsyncStorage...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 AsyncStorage Debugger</Text>

      {/* User Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>User Data:</Text>
        {storageData.user ? (
          <ScrollView style={styles.dataContainer}>
            <Text style={styles.dataText}>
              {JSON.stringify(storageData.user, null, 2)}
            </Text>
          </ScrollView>
        ) : (
          <Text style={styles.noDataText}>Không có user data</Text>
        )}
      </View>

      {/* Token Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Token:</Text>
        <Text style={styles.dataText}>
          {storageData.token || "Không có token"}
        </Text>
      </View>

      {/* All Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          All AsyncStorage Data:
        </Text>
        <ScrollView style={styles.dataContainer}>
          <Text style={styles.dataText}>
            {JSON.stringify(storageData.allData, null, 2)}
          </Text>
        </ScrollView>
      </View>

      {/* Error Section */}
      {storageData.error && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Error:</Text>
          <Text style={styles.errorText}>{storageData.error}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={loadStorageData}>
          <Text style={styles.buttonText}>Reload Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearUserData}>
          <Text style={styles.buttonText}>Clear User Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearStorage}>
          <Text style={styles.buttonText}>Clear All Storage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    textAlign: "center",
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dataContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    maxHeight: 200,
  },
  dataText: {
    fontSize: 12,
    color: "#333",
    fontFamily: "monospace",
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    padding: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  button: {
    backgroundColor: "#4FC3F7",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  clearButton: {
    backgroundColor: "#FF9800",
  },
  dangerButton: {
    backgroundColor: "#FF6B6B",
  },
});
