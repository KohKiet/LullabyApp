import { ROLE_ENDPOINTS } from "./apiConfig";

// Role mapping từ API
const ROLE_MAPPING = {
  1: "Admin",
  2: "NursingSpecialist",
  3: "Manager",
  4: "Customer",
};

class RoleService {
  // Lấy tất cả roles từ API
  async getAllRoles() {
    try {
      const response = await fetch(ROLE_ENDPOINTS.GET_ALL_ROLES, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const roles = await response.json();
        return { success: true, roles: roles };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy role name theo roleID
  getRoleName(roleID) {
    return ROLE_MAPPING[roleID] || "Unknown";
  }

  // Lấy roleID theo role name
  getRoleID(roleName) {
    const entry = Object.entries(ROLE_MAPPING).find(
      ([id, name]) => name === roleName
    );
    return entry ? parseInt(entry[0]) : null;
  }

  // Kiểm tra user có phải là admin không
  isAdmin(roleID) {
    return roleID === 1;
  }

  // Kiểm tra user có phải là customer không
  isCustomer(roleID) {
    return roleID === 4;
  }

  // Kiểm tra user có phải là nursing specialist không
  isNursingSpecialist(roleID) {
    return roleID === 2;
  }

  // Kiểm tra user có phải là manager không
  isManager(roleID) {
    return roleID === 3;
  }

  // Lấy danh sách tất cả roles (cho UI)
  getAllRoleNames() {
    return Object.values(ROLE_MAPPING);
  }

  // Lấy danh sách roles dưới dạng options (cho dropdown)
  getRoleOptions() {
    return Object.entries(ROLE_MAPPING).map(([id, name]) => ({
      id: parseInt(id),
      name: name,
      label: this.getDisplayName(name),
    }));
  }

  // Lấy display name cho UI
  getDisplayName(roleName) {
    const displayNames = {
      Admin: "Quản trị viên",
      NursingSpecialist: "Điều dưỡng viên",
      Manager: "Quản lý",
      Customer: "Khách hàng",
    };
    return displayNames[roleName] || roleName;
  }

  // Kiểm tra quyền truy cập
  hasPermission(roleID, requiredRole) {
    const roleHierarchy = {
      1: ["Admin", "Manager", "NursingSpecialist", "Customer"], // Admin có tất cả quyền
      2: ["NursingSpecialist", "Customer"], // Nursing Specialist có quyền của customer
      3: ["Manager", "Customer"], // Manager có quyền của customer
      4: ["Customer"], // Customer chỉ có quyền của mình
    };

    const userRoles = roleHierarchy[roleID] || [];
    return userRoles.includes(requiredRole);
  }
}

// Export singleton instance
export default new RoleService();
