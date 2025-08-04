import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Avatar from "../../components/Avatar";

export default function NursesScreen() {
  const router = useRouter();
  const [nurses, setNurses] = useState([]);
  const [zones, setZones] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Mock data - trong thực tế sẽ gọi API
      const mockZones = [
        { zoneId: 1, zoneName: "Quận 1", city: "TP.HCM" },
        { zoneId: 2, zoneName: "Quận 2", city: "TP.HCM" },
        { zoneId: 3, zoneName: "Quận 3", city: "TP.HCM" },
        { zoneId: 4, zoneName: "Quận 7", city: "TP.HCM" },
      ];

      // Lấy dữ liệu từ AsyncStorage - trong thực tế sẽ gọi API
      const mockNurses = [
        {
          nursingId: 3,
          accountId: 4,
          zoneId: 3,
          gender: "Female",
          dateOfBirth: "1992-07-10",
          fullName: "Phạm Thị D",
          address: "789 Trần Hưng Đạo, Quận 3, TP.HCM",
          experience: "6 năm kinh nghiệm điều dưỡng",
          slogan: "Điều dưỡng chuyên nghiệp, tận tâm",
          status: "active",
          major: "Điều dưỡng viên",
          avatarUrl:
            "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
        },
        {
          nursingId: 4,
          accountId: 5,
          zoneId: 4,
          gender: "Male",
          dateOfBirth: "1985-12-25",
          fullName: "Hoàng Văn E",
          address: "321 Phạm Văn Đồng, Quận 7, TP.HCM",
          experience: "10 năm kinh nghiệm chăm sóc sức khỏe",
          slogan: "Chăm sóc sức khỏe toàn diện",
          status: "active",
          major: "Điều dưỡng viên",
          avatarUrl:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        },
      ];

      setZones(mockZones);
      setNurses(mockNurses);
    } catch (error) {
      console.error("Error loading nurses:", error);
    }
  };

  const getZoneName = (zoneId) => {
    const zone = zones.find((z) => z.zoneId === zoneId);
    return zone ? zone.zoneName : "Không xác định";
  };

  const getGenderText = (gender) => {
    return gender === "Female" ? "Nữ" : "Nam";
  };

  return (
    <LinearGradient
      colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientBg}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity
          style={styles.backBtnOuter}
          onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#4FC3F7" />
        </TouchableOpacity>
        <LinearGradient
          colors={["#F8F9FA", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBox}>
          <Text style={styles.headerText}>Điều Dưỡng Viên</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          Danh sách điều dưỡng viên ({nurses.length})
        </Text>

        {nurses.map((nurse) => (
          <View key={nurse.nursingId} style={styles.nurseCard}>
            <View style={styles.avatarContainer}>
              <Avatar
                source={{ uri: nurse.avatarUrl }}
                size={60}
                name={nurse.fullName}
                fallbackType="initials"
              />
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>{nurse.fullName}</Text>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>
                    {getGenderText(nurse.gender)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="briefcase-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {nurse.experience}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {getZoneName(nurse.zoneId)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>{nurse.major}</Text>
              </View>

              <View style={styles.sloganContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color="#FF8AB3"
                />
                <Text style={styles.sloganText}>{nurse.slogan}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  headerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtnOuter: {
    marginRight: 15,
  },
  headerBox: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  nurseCard: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
  },
  infoContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fullName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  genderBadge: {
    backgroundColor: "#FF8AB3",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  genderText: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  sloganContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sloganText: {
    fontSize: 13,
    color: "#FF8AB3",
    fontStyle: "italic",
    marginLeft: 8,
    flex: 1,
  },
  bookButton: {
    backgroundColor: "#FF8AB3",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  bookButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
