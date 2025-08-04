import AsyncStorage from "@react-native-async-storage/async-storage";

// Load all users from AsyncStorage (simulating API call)
export const loadAllUsers = async () => {
  try {
    // Trong thực tế, đây sẽ là API call
    // Hiện tại chúng ta sẽ sử dụng mock data nhưng có thể mở rộng
    const mockUsers = [
      {
        id: 1,
        role_id: 1,
        full_name: "Nguyễn Văn A",
        phone_number: "0123456789",
        email: "nguyenvana@email.com",
        password: "password123",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        create_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        status: "active",
      },
      {
        id: 2,
        role_id: 2,
        full_name: "Trần Thị B",
        phone_number: "0987654321",
        email: "tranthib@email.com",
        password: "password123",
        avatar_url:
          "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
        create_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        status: "active",
        major: "Tư vấn viên",
        experience: "5 năm kinh nghiệm tư vấn dinh dưỡng",
        slogan:
          "Tư vấn dinh dưỡng chuyên nghiệp, vì sức khỏe của bạn",
      },
      {
        id: 3,
        role_id: 2,
        full_name: "Lê Văn C",
        phone_number: "0123456788",
        email: "levanc@email.com",
        password: "password123",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        create_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        status: "active",
        major: "Tư vấn viên",
        experience: "8 năm kinh nghiệm tư vấn sức khỏe",
        slogan: "Chăm sóc sức khỏe với tình yêu thương",
      },
      {
        id: 4,
        role_id: 2,
        full_name: "Phạm Thị D",
        phone_number: "0123456787",
        email: "phamthid@email.com",
        password: "password123",
        avatar_url:
          "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
        create_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        status: "active",
        major: "Điều dưỡng viên",
        experience: "6 năm kinh nghiệm điều dưỡng",
        slogan: "Điều dưỡng chuyên nghiệp, tận tâm",
      },
      {
        id: 5,
        role_id: 2,
        full_name: "Hoàng Văn E",
        phone_number: "0123456786",
        email: "hoangvane@email.com",
        password: "password123",
        avatar_url:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        create_at: "2024-01-01T00:00:00Z",
        deleted_at: null,
        status: "active",
        major: "Điều dưỡng viên",
        experience: "10 năm kinh nghiệm chăm sóc sức khỏe",
        slogan: "Chăm sóc sức khỏe toàn diện",
      },
    ];

    return mockUsers;
  } catch (error) {
    console.error("Error loading all users:", error);
    return [];
  }
};

// Load nursing specialists (role_id = 2)
export const loadNursingSpecialists = async () => {
  try {
    const allUsers = await loadAllUsers();
    return allUsers.filter((user) => user.role_id === 2);
  } catch (error) {
    console.error("Error loading nursing specialists:", error);
    return [];
  }
};

// Load specialists only (major = "Tư vấn viên")
export const loadSpecialists = async () => {
  try {
    const allUsers = await loadAllUsers();
    return allUsers.filter(
      (user) => user.role_id === 2 && user.major === "Tư vấn viên"
    );
  } catch (error) {
    console.error("Error loading specialists:", error);
    return [];
  }
};

// Load nurses only (major = "Điều dưỡng viên")
export const loadNurses = async () => {
  try {
    const allUsers = await loadAllUsers();
    return allUsers.filter(
      (user) => user.role_id === 2 && user.major === "Điều dưỡng viên"
    );
  } catch (error) {
    console.error("Error loading nurses:", error);
    return [];
  }
};

// Update user data in AsyncStorage
export const updateUserData = async (userId, updatedData) => {
  try {
    // Trong thực tế, đây sẽ là API call để update user
    // Hiện tại chúng ta chỉ log để demo
    console.log(`Updating user ${userId} with data:`, updatedData);

    // Có thể lưu vào AsyncStorage để demo
    const key = `user_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(updatedData));

    return true;
  } catch (error) {
    console.error("Error updating user data:", error);
    return false;
  }
};
