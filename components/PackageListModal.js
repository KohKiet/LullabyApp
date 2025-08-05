import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ServiceTaskService from "../services/serviceTaskService";
import ServiceTypeService from "../services/serviceTypeService";

export default function PackageListModal({
  visible,
  onClose,
  packages,
  title,
  isLoading,
}) {
  const [expandedPackages, setExpandedPackages] = useState(new Set());
  const [packageTasks, setPackageTasks] = useState({});

  const togglePackage = async (packageId) => {
    const newExpanded = new Set(expandedPackages);

    if (newExpanded.has(packageId)) {
      // Collapse
      newExpanded.delete(packageId);
    } else {
      // Expand - load tasks if not already loaded
      newExpanded.add(packageId);
      if (!packageTasks[packageId]) {
        await loadPackageTasks(packageId);
      }
    }

    setExpandedPackages(newExpanded);
  };

  const loadPackageTasks = async (packageId) => {
    try {
      console.log(
        "PackageListModal: Loading tasks for package ID:",
        packageId
      );
      const result =
        await ServiceTaskService.getServiceTasksByPackageId(
          packageId
        );
      console.log("PackageListModal: Tasks result:", result);
      if (result.success) {
        setPackageTasks((prev) => ({
          ...prev,
          [packageId]: result.data,
        }));
        console.log(
          "PackageListModal: Tasks loaded for package",
          packageId,
          ":",
          result.data.length,
          "items"
        );
      }
    } catch (error) {
      console.error("Error loading package tasks:", error);
    }
  };

  const renderPackageItem = ({ item }) => {
    const isExpanded = expandedPackages.has(item.serviceID);
    const tasks = packageTasks[item.serviceID] || [];

    return (
      <View style={styles.packageItem}>
        {/* Package Header */}
        <TouchableOpacity
          style={styles.packageHeader}
          onPress={() => togglePackage(item.serviceID)}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageName}>{item.serviceName}</Text>
            <View style={styles.packagePriceContainer}>
              <Text style={styles.packagePrice}>
                {ServiceTypeService.formatPrice(item.price)}
              </Text>
            </View>
          </View>
          <View style={styles.packageMeta}>
            <View style={styles.durationContainer}>
              <Ionicons name="time-outline" size={16} color="#666" />
              <Text style={styles.duration}>
                {ServiceTypeService.formatDuration(item.duration)}
              </Text>
            </View>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#666"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.packageDescription}>
          {item.description}
        </Text>

        {/* Expandable Tasks Section */}
        {isExpanded && (
          <View style={styles.tasksContainer}>
            <Text style={styles.tasksTitle}>
              Các dịch vụ bao gồm:
            </Text>
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <View
                  key={task.serviceTaskID}
                  style={styles.taskItem}>
                  <View style={styles.taskHeader}>
                    <Text style={styles.taskOrder}>
                      {task.taskOrder}.
                    </Text>
                    <Text style={styles.taskDescription}>
                      {task.description}
                    </Text>
                    <View style={styles.taskPriceContainer}>
                      <Text style={styles.taskPrice}>
                        {ServiceTaskService.formatPrice(task.price)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.taskFooter}>
                    <View style={styles.quantityContainer}>
                      <Ionicons
                        name="repeat-outline"
                        size={14}
                        color="#666"
                      />
                      <Text style={styles.quantity}>
                        Số lượng: {task.quantity}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>
                  Đang tải dịch vụ...
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cube-outline" size={48} color="#CCC" />
      <Text style={styles.emptyText}>
        {isLoading ? "Đang tải..." : "Không có gói dịch vụ nào"}
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={packages}
            renderItem={renderPackageItem}
            keyExtractor={(item) => item.serviceID.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: "90%",
    height: "80%",
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
  closeButton: {
    padding: 5,
  },
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  packageItem: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF6B6B",
  },
  packageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  packageInfo: {
    flex: 1,
    marginRight: 10,
  },
  packageName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  packagePriceContainer: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  packagePrice: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  packageMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  duration: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  packageDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 12,
  },
  tasksContainer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
  },
  tasksTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  taskItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 2,
    borderLeftColor: "#4CAF50",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  taskOrder: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#4CAF50",
    marginRight: 8,
    marginTop: 2,
  },
  taskDescription: {
    fontSize: 13,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  taskPriceContainer: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskPrice: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  quantity: {
    fontSize: 11,
    color: "#666",
    marginLeft: 4,
  },
  noTasksContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  noTasksText: {
    fontSize: 14,
    color: "#999",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 12,
  },
});
