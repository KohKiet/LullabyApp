import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { API_CONFIG } from "../services/apiConfig";
import AuthService from "../services/authService";

export default function ApiStatusIndicator() {
  const [isConnected, setIsConnected] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState("");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await AuthService.checkApiConnection();
      setIsConnected(connected);

      // Get connection details
      const details = `Platform: ${Platform.OS}\nBase URL: ${
        API_CONFIG.BASE_URL
      }\nDevelopment: ${__DEV__ ? "Yes" : "No"}`;
      setConnectionDetails(details);
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsConnected(false);
      setConnectionDetails(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testEndpoints = async () => {
    setIsTesting(true);
    try {
      await AuthService.testApiEndpoints();
      Alert.alert(
        "Test Complete",
        "Check console for endpoint test results"
      );
    } catch (error) {
      Alert.alert("Test Error", error.message);
    } finally {
      setIsTesting(false);
    }
  };

  const testDirectConnection = async () => {
    setIsTesting(true);
    try {
      const response = await fetch(API_CONFIG.BASE_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      Alert.alert(
        "Direct Connection Test",
        `Status: ${response.status}\nURL: ${API_CONFIG.BASE_URL}`
      );
    } catch (error) {
      Alert.alert(
        "Connection Failed",
        `Error: ${error.message}\nURL: ${API_CONFIG.BASE_URL}`
      );
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusColor = () => {
    if (isConnected === null) return "#999";
    return isConnected ? "#4CAF50" : "#F44336";
  };

  const getStatusText = () => {
    if (isConnected === null) return "Checking...";
    return isConnected ? "API Connected" : "API Disconnected";
  };

  const getStatusIcon = () => {
    if (isConnected === null) return "help-circle";
    return isConnected ? "checkmark-circle" : "close-circle";
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Ionicons
            name={getStatusIcon()}
            size={20}
            color={getStatusColor()}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {isLoading && (
            <ActivityIndicator size="small" color="#4FC3F7" />
          )}
        </View>

        {/* Connection Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsText}>{connectionDetails}</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={checkConnection}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? "Checking..." : "Refresh"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testEndpoints}
            disabled={isTesting}>
            <Text style={styles.buttonText}>
              {isTesting ? "Testing..." : "Test Endpoints"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.directButton]}
            onPress={testDirectConnection}
            disabled={isTesting}>
            <Text style={styles.buttonText}>
              {isTesting ? "Testing..." : "Direct Test"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    margin: 10,
  },
  statusContainer: {
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  detailsText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 5,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  button: {
    backgroundColor: "#4FC3F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 70,
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#FF9800",
  },
  directButton: {
    backgroundColor: "#9C27B0",
  },
  buttonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
  },
});
