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

export default function SpecialistsScreen() {
  const router = useRouter();
  const [specialists, setSpecialists] = useState([]);
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
      const mockSpecialists = [
        {
          nursingId: 1,
          accountId: 2,
          zoneId: 1,
          gender: "Female",
          dateOfBirth: "1990-05-15",
          fullName: "Trần Thị B",
          address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
          experience: "5 năm kinh nghiệm tư vấn dinh dưỡng",
          slogan:
            "Tư vấn dinh dưỡng chuyên nghiệp, vì sức khỏe của bạn",
          status: "active",
          major: "Tư vấn viên",
          avatarUrl:
            "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
        },
        {
          nursingId: 2,
          accountId: 3,
          zoneId: 2,
          gender: "Male",
          dateOfBirth: "1988-03-20",
          fullName: "Lê Văn C",
          address: "456 Lê Lợi, Quận 2, TP.HCM",
          experience: "8 năm kinh nghiệm tư vấn sức khỏe",
          slogan: "Chăm sóc sức khỏe với tình yêu thương",
          status: "active",
          major: "Tư vấn viên",
          avatarUrl:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        },
      ];

      setZones(mockZones);
      setSpecialists(mockSpecialists);
    } catch (error) {
      console.error("Error loading specialists:", error);
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
          <Text style={styles.headerText}>Tư Vấn Viên</Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>
          Danh sách tư vấn viên ({specialists.length})
        </Text>

        {specialists.map((specialist) => (
          <View
            key={specialist.nursingId}
            style={styles.specialistCard}>
            <View style={styles.avatarContainer}>
              <Avatar
                source={{ uri: specialist.avatarUrl }}
                size={60}
                name={specialist.fullName}
                fallbackType="initials"
              />
            </View>

            <View style={styles.infoContainer}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName}>
                  {specialist.fullName}
                </Text>
                <View style={styles.genderBadge}>
                  <Text style={styles.genderText}>
                    {getGenderText(specialist.gender)}
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
                  {specialist.experience}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {getZoneName(specialist.zoneId)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color="#666"
                />
                <Text style={styles.detailText}>
                  {specialist.major}
                </Text>
              </View>

              <View style={styles.sloganContainer}>
                <Ionicons
                  name="chatbubble-outline"
                  size={16}
                  color="#4FC3F7"
                />
                <Text style={styles.sloganText}>
                  {specialist.slogan}
                </Text>
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
  specialistCard: {
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
    backgroundColor: "#4FC3F7",
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
    color: "#4FC3F7",
    fontStyle: "italic",
    marginLeft: 8,
    flex: 1,
  },
  bookButton: {
    backgroundColor: "#4FC3F7",
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
