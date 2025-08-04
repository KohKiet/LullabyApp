import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import RoleService from "../services/roleService";

export default function UserDataDebugger({ userData }) {
  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>🔍 User Data Debugger</Text>
        <Text style={styles.error}>No user data available</Text>
      </View>
    );
  }

  const roleName = RoleService.getRoleName(userData.role_id);
  const displayName = RoleService.getDisplayName(roleName);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 User Data Debugger</Text>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Basic Information
          </Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>ID:</Text>
            <Text style={styles.fieldValue}>
              {userData.id || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name:</Text>
            <Text style={styles.fieldValue}>
              {userData.fullName || userData.full_name || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Phone Number:</Text>
            <Text style={styles.fieldValue}>
              {userData.phoneNumber || userData.phone_number || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email:</Text>
            <Text style={styles.fieldValue}>
              {userData.email || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎭 Role Information</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Role ID:</Text>
            <Text style={styles.fieldValue}>
              {userData.role_id || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Role Name:</Text>
            <Text style={styles.fieldValue}>{roleName}</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Display Name:</Text>
            <Text style={styles.fieldValue}>{displayName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Account Details</Text>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Status:</Text>
            <Text style={styles.fieldValue}>
              {userData.status || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Created At:</Text>
            <Text style={styles.fieldValue}>
              {userData.create_at || userData.createAt || "N/A"}
            </Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Avatar URL:</Text>
            <Text style={styles.fieldValue}>
              {userData.avatar_url || userData.avatarUrl || "N/A"}
            </Text>
          </View>
        </View>

        {RoleService.isNursingSpecialist(userData.role_id) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              👩‍⚕️ Specialist Information
            </Text>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Major:</Text>
              <Text style={styles.fieldValue}>
                {userData.major || "N/A"}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Experience:</Text>
              <Text style={styles.fieldValue}>
                {userData.experience || "N/A"}
              </Text>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Slogan:</Text>
              <Text style={styles.fieldValue}>
                {userData.slogan || "N/A"}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔧 Raw Data</Text>
          <Text style={styles.rawData}>
            {JSON.stringify(userData, null, 2)}
          </Text>
        </View>
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
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#e9ecef",
  },
  error: {
    color: "#dc3545",
    padding: 10,
    textAlign: "center",
  },
  scrollContainer: {
    padding: 10,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
    marginBottom: 8,
  },
  field: {
    flexDirection: "row",
    marginBottom: 5,
    paddingVertical: 2,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6c757d",
    width: 100,
  },
  fieldValue: {
    fontSize: 12,
    color: "#212529",
    flex: 1,
  },
  rawData: {
    fontSize: 10,
    color: "#6c757d",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    fontFamily: "monospace",
  },
});
