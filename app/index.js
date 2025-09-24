import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
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
import AuthService from "../services/authService";
import BookingService from "../services/bookingService";
import CareProfileService from "../services/careProfileService";
import NotificationService from "../services/notificationService";
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

  // Thêm state cho care profiles
  const [careProfiles, setCareProfiles] = useState([]);
  const [isLoadingCareProfiles, setIsLoadingCareProfiles] =
    useState(false);
  const [showCareProfileModal, setShowCareProfileModal] =
    useState(false);
  const [selectedCareProfile, setSelectedCareProfile] =
    useState(null);
  const [pendingBookingType, setPendingBookingType] = useState(null); // 'service' hoặc 'package'
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Redirect to login if not authenticated on app start
  useEffect(() => {
    (async () => {
      try {
        const status = await AuthService.isLoggedIn();
        if (!status?.isLoggedIn) {
          router.replace("/auth/login");
        }
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload user data khi screen được focus (khi quay lại từ logout)
  useEffect(() => {
    loadUserData();
    checkUnreadNotifications();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await AuthService.getUserData();
      if (user) {
        // Ensure latest account info (e.g., avatarUrl)
        let mergedUser = user;
        try {
          const accountId = user.accountID || user.id;
          if (accountId && !user.avatarUrl) {
            const resp = await fetch(
              `${
                process.env.EXPO_PUBLIC_API_BASE_URL ||
                "https://phamlequyanh.name.vn"
              }/api/accounts/get/${accountId}`,
              { headers: { accept: "application/json" } }
            );
            if (resp.ok) {
              const acc = await resp.json();
              mergedUser = { ...user, ...acc };
              // persist merged data so other screens see avatarUrl
              await AuthService.saveUser(mergedUser);
            }
          }
        } catch (_) {}
        setUserData(mergedUser);
        // Load care profiles sau khi có user data
        await loadCareProfiles(mergedUser);
      } else {
        // Nếu không có user data (đã logout), set về null
        setUserData(null);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setUserData(null);
    }
  };

  const loadCareProfiles = async (user) => {
    if (!user) return;

    try {
      setIsLoadingCareProfiles(true);
      const result =
        await CareProfileService.getCareProfilesByAccountId(
          user.accountID || user.id
        );

      if (result.success) {
        setCareProfiles(result.data);
      } else {
        setCareProfiles([]);
      }
    } catch (error) {
      console.error("Error loading care profiles:", error);
      setCareProfiles([]);
    } finally {
      setIsLoadingCareProfiles(false);
    }
  };

  const loadServices = async () => {
    try {
      setIsLoadingServices(true);
      const result = await ServiceTypeService.getAllServiceTypes();

      if (result.success) {
        // Filter only services (not packages)
        const servicesOnly = result.data.filter(
          (service) => !service.isPackage
        );
        setServices(servicesOnly);
      } else {
        setServices([]);
      }
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setIsLoadingServices(false);
    }
  };

  const loadPackages = async () => {
    try {
      setIsLoadingPackages(true);
      const result = await ServiceTypeService.getAllServiceTypes();

      if (result.success) {
        // Filter only packages
        const packagesOnly = result.data.filter(
          (service) => service.isPackage
        );
        setPackages(packagesOnly);
      } else {
        setPackages([]);
      }
    } catch (error) {
      console.error("Error loading packages:", error);
      setPackages([]);
    } finally {
      setIsLoadingPackages(false);
    }
  };

  const handleShowServices = () => {
    if (careProfiles.length === 0) {
      Alert.alert(
        "Thông báo",
        "Bạn cần có ít nhất một hồ sơ chăm sóc để đặt lịch. Vui lòng tạo hồ sơ chăm sóc trước.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Tạo hồ sơ",
            onPress: () => router.push("/profile"),
          },
        ]
      );
      return;
    }

    setPendingBookingType("service");
    setShowCareProfileModal(true);
  };

  const handleShowPackages = () => {
    if (careProfiles.length === 0) {
      Alert.alert(
        "Thông báo",
        "Bạn cần có ít nhất một hồ sơ chăm sóc để đặt lịch. Vui lòng tạo hồ sơ chăm sóc trước.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Tạo hồ sơ",
            onPress: () => router.push("/profile"),
          },
        ]
      );
      return;
    }

    setPendingBookingType("package");
    setShowCareProfileModal(true);
  };

  const handleCareProfileSelect = (careProfile) => {
    setSelectedCareProfile(careProfile);
    setShowCareProfileModal(false);

    // Mở modal booking tương ứng
    if (pendingBookingType === "service") {
      if (services.length === 0) {
        loadServices();
      }
      setShowServicesModal(true);
    } else if (pendingBookingType === "package") {
      if (packages.length === 0) {
        loadPackages();
      }
      setShowPackagesModal(true);
    }

    setPendingBookingType(null);
  };

  const handleServiceBooking = async (bookingData) => {
    try {
      // Format data for API
      const apiData = {
        careProfileID: bookingData.careProfileID,
        amount: bookingData.totalAmount,
        workdate: bookingData.workdate,
        customizePackageCreateDtos: bookingData.services.map(
          (service) => ({
            serviceID: service.serviceID,
            quantity: service.quantity,
          })
        ),
      };

      const result = await BookingService.createServiceBooking(
        apiData
      );

      if (result.success) {
        // Lưu thông tin booking vào AsyncStorage để sử dụng ở trang thanh toán
        const serviceInfo = {
          bookingID: result.data.bookingID,
          serviceType: "service",
          serviceData: services.find(
            (service) =>
              service.serviceID === bookingData.services[0].serviceID
          ),
          memberData: careProfiles.find(
            (profile) =>
              profile.careProfileID === bookingData.careProfileID
          ),
          // Thêm thông tin đầy đủ về services
          services: bookingData.services,
          totalAmount: bookingData.totalAmount,
        };
        await AsyncStorage.setItem(
          `booking_${result.data.bookingID}`,
          JSON.stringify(serviceInfo)
        );

        // Đóng modal để reset selection state
        setShowServicesModal(false);
        setSelectedCareProfile(null);

        // Chuyển thẳng sang trang thanh toán
        router.push({
          pathname: "/payment",
          params: { bookingId: result.data.bookingID },
        });
      } else {
        Alert.alert("Lỗi", result.error || "Không thể tạo lịch hẹn");
      }
    } catch (error) {
      console.error("Error creating service booking:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi tạo lịch hẹn");
    }
  };

  const handlePackageBooking = async (bookingData) => {
    try {
      // Format data for API
      const apiData = {
        careProfileID: bookingData.careProfileID,
        amount: bookingData.totalAmount,
        workdate: bookingData.workdate,
        customizePackageCreateDto: {
          serviceID: bookingData.packageId,
          quantity: 1,
        },
      };

      const result = await BookingService.createPackageBooking(
        apiData
      );

      if (result.success) {
        // Lưu thông tin booking vào AsyncStorage để sử dụng ở trang thanh toán
        const packageInfo = {
          bookingID: result.data.bookingID,
          serviceType: "package",
          packageData: packages.find(
            (pkg) => pkg.serviceID === bookingData.packageId
          ),
          memberData: careProfiles.find(
            (profile) =>
              profile.careProfileID === bookingData.careProfileID
          ),
        };
        await AsyncStorage.setItem(
          `booking_${result.data.bookingID}`,
          JSON.stringify(packageInfo)
        );

        // Đóng modal để reset selection state
        setShowPackagesModal(false);
        setSelectedCareProfile(null);

        // Chuyển thẳng sang trang thanh toán
        router.push({
          pathname: "/payment",
          params: { bookingId: result.data.bookingID },
        });
      } else {
        Alert.alert("Lỗi", result.error || "Không thể tạo lịch hẹn");
      }
    } catch (error) {
      console.error("Error creating package booking:", error);
      Alert.alert("Có lỗi xảy ra khi tạo lịch hẹn");
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      if (userData?.accountID) {
        const result =
          await NotificationService.getNotificationsByAccount(
            userData.accountID
          );
        if (result.success) {
          const unread = result.data.filter((n) => !n.isRead);
          setUnreadNotifications(unread.length);

          // Show notification for the latest unread message
          if (unread.length > 0) {
            const latest = unread[0];
            global.__notify?.({
              title: "Thông báo mới",
              message: latest.message,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
    }
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
                Chuyên viên tư vấn
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
                Chuyên viên chăm sóc
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
        <Text style={styles.sectionTitle}>Lịch hẹn và lịch sử</Text>
        <View style={styles.separator} />
        <View style={styles.cardRow}>
          <LinearGradient
            colors={["#FFD9E6", "#FFB3D1", "#FF8AB3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
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
          <LinearGradient
            colors={["#C2F5E9", "#A8E6CF", "#8ED9C3"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}>
            <TouchableOpacity
              style={styles.cardContent}
              onPress={() => {
                router.push("/booking/history");
              }}>
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
              onPress={() => router.push("/work-schedule")}>
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
              onPress={() => router.push("/nurse/booking-history")}>
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

  // Render modal chọn care profile
  const renderCareProfileModal = () => (
    <Modal
      visible={showCareProfileModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowCareProfileModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chọn hồ sơ chăm sóc</Text>
            <TouchableOpacity
              onPress={() => setShowCareProfileModal(false)}
              style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {isLoadingCareProfiles ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>
                Đang tải hồ sơ chăm sóc...
              </Text>
            </View>
          ) : (
            <FlatList
              data={careProfiles}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.careProfileItem}
                  onPress={() => handleCareProfileSelect(item)}>
                  <View style={styles.careProfileInfo}>
                    <Text style={styles.careProfileName}>
                      {item.profileName}
                    </Text>
                    <Text style={styles.careProfileDetails}>
                      Ngày sinh:{" "}
                      {CareProfileService.formatDate(
                        item.dateOfBirth
                      )}
                    </Text>
                    <Text style={styles.careProfileDetails}>
                      SĐT: {item.phoneNumber}
                    </Text>
                    {item.address && (
                      <Text style={styles.careProfileDetails}>
                        Địa chỉ: {item.address}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.careProfileID.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>
      </View>
    </Modal>
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
              style={{ height: 33, width: "100%" }}
              maskElement={
                <Text
                  style={[
                    styles.mainText,
                    { backgroundColor: "transparent" },
                  ]}>
                  Lullaby
                </Text>
              }>
              <LinearGradient
                colors={["#4FC3F7", "#FF8AB3", "#26C6DA"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}>
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
        {/* Wallet Card - chỉ hiển thị cho Member */}
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
        onBooking={handleServiceBooking}
        selectedCareProfile={selectedCareProfile}
      />

      <PackageListModal
        visible={showPackagesModal}
        onClose={() => setShowPackagesModal(false)}
        packages={packages}
        title="Gói dịch vụ chăm sóc"
        isLoading={isLoadingPackages}
        onBooking={handlePackageBooking}
        selectedCareProfile={selectedCareProfile}
      />

      {/* Modal chọn care profile */}
      {renderCareProfileModal()}

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
    paddingHorizontal: 30,
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
    minWidth: 200,
    justifyContent: "center",
  },
  mainText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 32,
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
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    width: "90%",
    maxHeight: "70%",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    paddingBottom: 20,
  },
  careProfileItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  careProfileInfo: {
    flex: 1,
    marginRight: 10,
  },
  careProfileName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  careProfileDetails: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});
