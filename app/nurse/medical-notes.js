import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MedicalNoteService from "../../services/medicalNoteService";

export default function NurseMedicalNotesScreen() {
  const router = useRouter();
  const [medicalNotes, setMedicalNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    customizeTaskID: "",
    note: "",
    image: "",
    advice: "",
  });

  useEffect(() => {
    loadMedicalNotes();
  }, []);

  const loadMedicalNotes = async () => {
    try {
      setIsLoading(true);
      const result = await MedicalNoteService.getAllMedicalNotes();
      if (result.success) {
        setMedicalNotes(result.data);
      } else {
        console.error("Error loading medical notes:", result.error);
        Alert.alert(
          "Thông báo",
          "Không thể tải danh sách ghi chú y tế"
        );
      }
    } catch (error) {
      console.error("Error loading medical notes:", error);
      Alert.alert("Thông báo", "Có lỗi xảy ra khi tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      if (!formData.customizeTaskID.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập ID task");
        return;
      }

      if (!formData.note.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập nội dung ghi chú");
        return;
      }

      const result = await MedicalNoteService.createMedicalNote(
        formData
      );
      if (result.success) {
        Alert.alert("Thành công", "Đã tạo ghi chú y tế mới");
        setShowCreateModal(false);
        resetForm();
        loadMedicalNotes();
      } else {
        Alert.alert(
          "Thông báo",
          result.error || "Không thể tạo ghi chú y tế"
        );
      }
    } catch (error) {
      console.error("Error creating medical note:", error);
      Alert.alert("Thông báo", "Có lỗi xảy ra khi tạo ghi chú y tế");
    }
  };

  const handleUpdateNote = async () => {
    try {
      if (!selectedNote) return;

      if (!formData.note.trim()) {
        Alert.alert("Thông báo", "Vui lòng nhập nội dung ghi chú");
        return;
      }

      const result = await MedicalNoteService.updateMedicalNote(
        selectedNote.medicalNoteID,
        formData
      );
      if (result.success) {
        Alert.alert("Thành công", "Đã cập nhật ghi chú y tế");
        setShowEditModal(false);
        setSelectedNote(null);
        resetForm();
        loadMedicalNotes();
      } else {
        Alert.alert(
          "Thông báo",
          result.error || "Không thể cập nhật ghi chú y tế"
        );
      }
    } catch (error) {
      console.error("Error updating medical note:", error);
      Alert.alert(
        "Thông báo",
        "Có lỗi xảy ra khi cập nhật ghi chú y tế"
      );
    }
  };

  const handleDeleteNote = async (noteID) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa ghi chú y tế này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const result =
                await MedicalNoteService.deleteMedicalNote(noteID);
              if (result.success) {
                Alert.alert("Thành công", "Đã xóa ghi chú y tế");
                loadMedicalNotes();
              } else {
                Alert.alert(
                  "Lỗi",
                  result.error || "Không thể xóa ghi chú y tế"
                );
              }
            } catch (error) {
              console.error("Error deleting medical note:", error);
              Alert.alert(
                "Lỗi",
                "Có lỗi xảy ra khi xóa ghi chú y tế"
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      customizeTaskID: "",
      note: "",
      image: "",
      advice: "",
    });
  };

  const openEditModal = (note) => {
    setSelectedNote(note);
    setFormData({
      customizeTaskID: note.customizeTaskID?.toString() || "",
      note: note.note || "",
      image: note.image || "",
      advice: note.advice || "",
    });
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const renderMedicalNoteCard = (note, index) => (
    <View key={note.medicalNoteID} style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>Ghi chú #{index + 1}</Text>
        <Text style={styles.noteDate}>
          {MedicalNoteService.formatDate(note.createdAt)}
        </Text>
      </View>

      <View style={styles.noteContent}>
        <View style={styles.noteRow}>
          <Text style={styles.noteLabel}>Task ID:</Text>
          <Text style={styles.noteValue}>{note.customizeTaskID}</Text>
        </View>

        {note.note && (
          <View style={styles.noteRow}>
            <Text style={styles.noteLabel}>Ghi chú:</Text>
            <Text style={styles.noteValue}>{note.note}</Text>
          </View>
        )}

        {note.advice && (
          <View style={styles.noteRow}>
            <Text style={styles.noteLabel}>Lời khuyên:</Text>
            <Text style={styles.noteValue}>{note.advice}</Text>
          </View>
        )}

        {note.image && note.image.trim() !== "" && (
          <View style={styles.noteRow}>
            <Text style={styles.noteLabel}>Hình ảnh:</Text>
            <Text style={styles.noteValue}>{note.image}</Text>
          </View>
        )}
      </View>

      <View style={styles.noteActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openEditModal(note)}>
          <Ionicons name="create-outline" size={16} color="#4CAF50" />
          <Text style={styles.editButtonText}>Sửa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNote(note.medicalNoteID)}>
          <Ionicons name="trash-outline" size={16} color="#FF6B6B" />
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            Đang tải ghi chú y tế...
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
        <Text style={styles.headerTitle}>Quản lý ghi chú y tế</Text>
        <TouchableOpacity onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {medicalNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color="#999"
            />
            <Text style={styles.emptyTitle}>
              Chưa có ghi chú y tế nào
            </Text>
            <Text style={styles.emptySubtitle}>
              Nhấn nút + để tạo ghi chú y tế mới
            </Text>
          </View>
        ) : (
          <View style={styles.notesContainer}>
            {medicalNotes.map((note, index) =>
              renderMedicalNoteCard(note, index)
            )}
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Tạo ghi chú y tế mới
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Task ID *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.customizeTaskID}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      customizeTaskID: text,
                    })
                  }
                  placeholder="Nhập ID của task"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.note}
                  onChangeText={(text) =>
                    setFormData({ ...formData, note: text })
                  }
                  placeholder="Nhập nội dung ghi chú"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lời khuyên</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.advice}
                  onChangeText={(text) =>
                    setFormData({ ...formData, advice: text })
                  }
                  placeholder="Nhập lời khuyên (nếu có)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hình ảnh</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.image}
                  onChangeText={(text) =>
                    setFormData({ ...formData, image: text })
                  }
                  placeholder="Nhập đường dẫn hình ảnh (nếu có)"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateNote}>
                <Text style={styles.submitButtonText}>
                  Tạo ghi chú
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sửa ghi chú y tế</Text>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Task ID</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.customizeTaskID}
                  onChangeText={(text) =>
                    setFormData({
                      ...formData,
                      customizeTaskID: text,
                    })
                  }
                  placeholder="Nhập ID của task"
                  keyboardType="numeric"
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.note}
                  onChangeText={(text) =>
                    setFormData({ ...formData, note: text })
                  }
                  placeholder="Nhập nội dung ghi chú"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lời khuyên</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.advice}
                  onChangeText={(text) =>
                    setFormData({ ...formData, advice: text })
                  }
                  placeholder="Nhập lời khuyên (nếu có)"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Hình ảnh</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.image}
                  onChangeText={(text) =>
                    setFormData({ ...formData, image: text })
                  }
                  placeholder="Nhập đường dẫn hình ảnh (nếu có)"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleUpdateNote}>
                <Text style={styles.submitButtonText}>Cập nhật</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  notesContainer: {
    paddingBottom: 20,
  },
  noteCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  noteDate: {
    fontSize: 14,
    color: "#666",
  },
  noteContent: {
    marginBottom: 15,
  },
  noteRow: {
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  noteValue: {
    fontSize: 14,
    color: "#666",
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 15,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  editButtonText: {
    color: "#4CAF50",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  deleteButtonText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 15,
    width: "90%",
    maxHeight: "80%",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
