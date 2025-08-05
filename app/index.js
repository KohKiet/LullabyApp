import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomTab from "../components/BottomTab";
import PackageListModal from "../components/PackageListModal";
import ServiceListModal from "../components/ServiceListModal";
import WalletCard from "../components/WalletCard";
import RoleService from "../services/roleService";
import ServiceTypeService from "../services/serviceTypeService";

export default function HomeScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [showServicesModal, setShowServicesModal] = useState(false);
  const [showPackagesModal, setShowPackagesModal] = useState(false);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload user data khi screen được focus (khi quay lại từ logout)
  useFocusEffect(
    React.useCallback(() => {
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        const user = JSON.parse(userDataString);
        setUserData(user);
      } else {
        // Nếu không có user data (đã logout), set về null
        setUserData(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(null);
    }
  };

  const loadServices = async () => {
    try {
      console.log("HomeScreen: Loading services...");
      setIsLoadingServices(true);
      const result = await ServiceTypeService.getServices();
      console.log("HomeScreen: Services result:", result);
      if (result.success) {
        setServices(result.data);
        console.log(
          "HomeScreen: Services loaded:",
          result.data.length,
          "items"
        );
      } else {
        console.error("Error loading services:", result.error);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadPackages = async () => {
    try {
      console.log("HomeScreen: Loading packages...");
      setIsLoadingPackages(true);
      const result = await ServiceTypeService.getPackages();
      console.log("HomeScreen: Packages result:", result);
      if (result.success) {
        setPackages(result.data);
        console.log(
          "HomeScreen: Packages loaded:",
          result.data.length,
          "items"
        );
      } else {
        console.error("Error loading packages:", result.error);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleShowServices = () => {
    if (services.length === 0) {
      loadServices();
    }
    setShowServicesModal(true);
  };

  const handleShowPackages = () => {
    if (packages.length === 0) {
      loadPackages();
    }
    setShowPackagesModal(true);
  };

  // Render content cho Member
  const renderMemberContent = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đội Ngũ</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => router.push("/member/specialists")}>
              <Ionicons
                name="person-circle"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Tư vấn viên
              </Text>
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient
            colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => router.push("/member/nurses")}>
              <Ionicons
                name="person-circle"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Điều dưỡng viên
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gói dịch vụ</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#C2F5E9", "#A8E6CF", "#8ED9C3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={handleShowPackages}>
              <Ionicons
                name="cube-outline"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Gói dịch vụ chăm sóc
              </Text>
            </TouchableOpacity>
          </LinearGradient>
          <LinearGradient
            colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={handleShowServices}>
              <Ionicons
                name="document-text"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Dịch vụ chăm sóc
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.singleCard]}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => router.push("/appointment")}>
              <Ionicons
                name="calendar-outline"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Lịch Hẹn
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </>
  );

  // Render content cho Nurse/Specialist
  const renderNurseSpecialistContent = () => (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch hẹn</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.singleCard]}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() =>
                router.push("/nurse_specialist/workschedule")
              }>
              <Ionicons name="calendar" size={40} color="#FFFFFF" />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Lịch làm việc
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lịch sử</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#B3E5FC", "#81D4FA", "#4FC3F7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.singleCard]}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() =>
                router.push("/nurse_specialist/booking_history")
              }>
              <Ionicons
                name="time-outline"
                size={40}
                color="#FFFFFF"
              />
              <Text style={[styles.cardText, { color: "#FFFFFF" }]}>
                Lịch sử đặt lịch
              </Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#C2F5E9" />
      {/* Header */}
      <LinearGradient
        colors={["#C2F5E9", "#B3E5FC", "#FFD9E6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#333333" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={["#F8F9FA", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}>
            {/* Gradient Lullaby Text */}
            <MaskedView
              maskElement={
                <Text
                  style={[
                    styles.mainText,
                    { backgroundColor: "transparent" },
                  ]}>
                  𝓛𝓾𝓵𝓵𝓪𝓫𝔂
                </Text>
              }>
              <LinearGradient
                colors={["#4FC3F7", "#FF8AB3", "#26C6DA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <Text style={[styles.mainText, { opacity: 0 }]}>
                  Lullaby
                </Text>
              </LinearGradient>
            </MaskedView>
          </LinearGradient>
          <Text style={styles.subText}>
            𝓔𝓿𝓸𝓴𝓮𝓼 𝓽𝓱𝓮 𝓲𝓶𝓪𝓰𝓮 𝓸𝓯 𝓪 𝓵𝓾𝓵𝓵𝓪𝓫𝔂
          </Text>
        </View>
      </LinearGradient>
      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Wallet Card - chỉ hiển thị cho Member (roleID=4) */}
        {userData &&
          (userData.roleID === 4 || userData.role_id === 4) && (
            <WalletCard userData={userData} />
          )}

        {/* Hiển thị nội dung theo role */}
        {userData &&
        RoleService.isNursingSpecialist(
          userData.role_id || userData.roleID
        )
          ? renderNurseSpecialistContent()
          : renderMemberContent()}
      </ScrollView>

      {/* Service List Modals */}
      <ServiceListModal
        visible={showServicesModal}
        onClose={() => setShowServicesModal(false)}
        services={services}
        title="Dịch vụ chăm sóc"
        isLoading={isLoadingServices}
      />

      <PackageListModal
        visible={showPackagesModal}
        onClose={() => setShowPackagesModal(false)}
        packages={packages}
        title="Gói dịch vụ chăm sóc"
        isLoading={isLoadingPackages}
      />

      {/* Bottom Navigation */}
      <BottomTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    position: "relative",
  },
  menuButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logoBox: {
    paddingHorizontal: 20,
    paddingVertical: 15,
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
  mainText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
  },
  subText: {
    fontSize: 20,
    color: "#66BB6A",
    marginTop: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    marginBottom: 10,
  },
  separator: {
    height: 3,
    backgroundColor: "#B3E5FC",
    width: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 2,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 15,
  },
  card: {
    borderRadius: 15,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#333333",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardContent: {
    padding: 20,
    alignItems: "center",
  },
  singleCard: {
    flex: 0.5,
    alignSelf: "center",
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 15,
    paddingBottom: 25,
  },
  navItem: {
    alignItems: "center",
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
    marginTop: 5,
  },
});
