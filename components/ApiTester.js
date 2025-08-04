import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  AUTH_ENDPOINTS,
  ROLE_ENDPOINTS,
} from "../services/apiConfig";

export default function ApiTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);

  const testEndpoint = async (
    name,
    url,
    method = "GET",
    body = null
  ) => {
    setIsLoading(true);
    const result = {
      name,
      url,
      method,
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      status: null,
      data: null,
      error: null,
    };

    try {
      console.log(`Testing ${name}: ${url}`);

      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      result.status = response.status;
      result.success = response.ok;

      if (response.ok) {
        try {
          const data = await response.json();
          result.data = data;
        } catch (parseError) {
          result.data = await response.text();
        }
      } else {
        try {
          const errorData = await response.json();
          result.error = errorData;
        } catch (parseError) {
          result.error = await response.text();
        }
      }
    } catch (error) {
      result.error = error.message;
    }

    setTestResults((prev) => [result, ...prev.slice(0, 4)]);
    setIsLoading(false);
    return result;
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: "Get All Roles",
        url: ROLE_ENDPOINTS.GET_ALL_ROLES,
        method: "GET",
      },
      {
        name: "Get All Accounts",
        url: AUTH_ENDPOINTS.GET_ALL_ACCOUNTS,
        method: "GET",
      },
      {
        name: "Login Test - emailOrPhoneNumber",
        url: AUTH_ENDPOINTS.LOGIN,
        method: "POST",
        body: {
          emailOrPhoneNumber: "test@example.com",
          password: "password123",
        },
      },
      {
        name: "Register Test - Customer",
        url: AUTH_ENDPOINTS.REGISTER_CUSTOMER,
        method: "POST",
        body: {
          fullName: "Test User",
          phoneNumber: "0123456789",
          email: "test@example.com",
          password: "password123",
          avatarUrl: "",
        },
      },
    ];

    for (const test of tests) {
      await testEndpoint(test.name, test.url, test.method, test.body);
      // Delay between tests
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const formatResult = (result) => {
    return (
      <View
        key={`${result.name}-${result.timestamp}`}
        style={styles.resultItem}>
        <View style={styles.resultHeader}>
          <Ionicons
            name={
              result.success ? "checkmark-circle" : "close-circle"
            }
            size={16}
            color={result.success ? "#4CAF50" : "#F44336"}
          />
          <Text style={styles.resultName}>{result.name}</Text>
          <Text style={styles.resultTime}>{result.timestamp}</Text>
        </View>

        <Text style={styles.resultUrl}>{result.url}</Text>
        <Text style={styles.resultStatus}>
          Status: {result.status} ({result.method})
        </Text>

        {result.data && (
          <View style={styles.resultData}>
            <Text style={styles.resultLabel}>Response:</Text>
            <Text style={styles.resultText}>
              {JSON.stringify(result.data, null, 2)}
            </Text>
          </View>
        )}

        {result.error && (
          <View style={styles.resultError}>
            <Text style={styles.resultLabel}>Error:</Text>
            <Text style={styles.resultText}>
              {typeof result.error === "string"
                ? result.error
                : JSON.stringify(result.error, null, 2)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Tester</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.runButton]}
            onPress={runAllTests}
            disabled={isLoading}>
            <Text style={styles.buttonText}>
              {isLoading ? "Testing..." : "Run All Tests"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.clearButton]}
            onPress={clearResults}
            disabled={isLoading}>
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.length === 0 ? (
          <Text style={styles.noResults}>No test results yet</Text>
        ) : (
          testResults.map(formatResult)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    margin: 10,
    maxHeight: 400,
  },
  header: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  runButton: {
    backgroundColor: "#4CAF50",
  },
  clearButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  resultsContainer: {
    padding: 10,
  },
  noResults: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
  },
  resultItem: {
    backgroundColor: "white",
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  resultName: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
    flex: 1,
  },
  resultTime: {
    fontSize: 12,
    color: "#666",
  },
  resultUrl: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  resultStatus: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 5,
  },
  resultData: {
    marginTop: 5,
  },
  resultError: {
    marginTop: 5,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  resultText: {
    fontSize: 10,
    color: "#333",
    backgroundColor: "#f5f5f5",
    padding: 5,
    borderRadius: 3,
  },
});
