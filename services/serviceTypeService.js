import { SERVICE_TYPE_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class ServiceTypeService {
  constructor() {
    this.cachedServices = null;
  }

  async fetchWithTimeout(url, options, timeout = NETWORK_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  async getAllServiceTypes() {
    try {
      const url = `${SERVICE_TYPE_ENDPOINTS.GET_ALL_SERVICE_TYPES}`;
      console.log("ServiceTypeService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ServiceTypeService: Response status:",
        response.status
      );
      console.log("ServiceTypeService: Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ServiceTypeService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ServiceTypeService: HTTP Error:",
          response.status,
          response.statusText
        );
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      console.log(
        "ServiceTypeService: Network error:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getServiceTypeById(serviceID) {
    try {
      const response = await this.fetchWithTimeout(
        `${SERVICE_TYPE_ENDPOINTS.GET_SERVICE_TYPE_BY_ID(serviceID)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data: data,
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Lấy danh sách dịch vụ (isPackage = false)
  async getServices() {
    try {
      const result = await this.getAllServiceTypes();
      if (result.success) {
        const services = result.data.filter(
          (service) => !service.isPackage
        );
        return {
          success: true,
          data: services,
        };
      }

      // Fallback to mock data if API fails
      console.log("ServiceTypeService: Using mock services data");
      return {
        success: true,
        data: [
          {
            serviceID: 1,
            serviceName: "Đo huyết áp tại nhà",
            major: "Nurse",
            price: 1000,
            duration: 12,
            description:
              "Dịch vụ đo huyết áp nhanh tại nhà bởi điều dưỡng, kiểm tra và tư vấn ban đầu về chỉ số huyết áp.",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 2,
            serviceName: "Theo dõi vàng da ở trẻ sơ sinh",
            major: "Nurse",
            price: 5000,
            duration: 20,
            description:
              "Quan sát tình trạng vàng da của trẻ sơ sinh",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 4,
            serviceName: "Massage thư giãn",
            major: "Nurse",
            price: 15000,
            duration: 40,
            description: "Massage giúp mẹ và bé giảm đau mỏi",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 5,
            serviceName: "Tư vấn dinh dưỡng",
            major: "Specialist",
            price: 20000,
            duration: 60,
            description: "Tư vấn dinh dưỡng cho mẹ và bé",
            isPackage: false,
            status: "active",
          },
        ],
      };
    } catch (error) {
      console.log(
        "ServiceTypeService: Error in getServices, using mock data"
      );
      return {
        success: true,
        data: [
          {
            serviceID: 1,
            serviceName: "Đo huyết áp tại nhà",
            major: "Nurse",
            price: 1000,
            duration: 12,
            description:
              "Dịch vụ đo huyết áp nhanh tại nhà bởi điều dưỡng, kiểm tra và tư vấn ban đầu về chỉ số huyết áp.",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 2,
            serviceName: "Theo dõi vàng da ở trẻ sơ sinh",
            major: "Nurse",
            price: 5000,
            duration: 20,
            description:
              "Quan sát tình trạng vàng da của trẻ sơ sinh",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 4,
            serviceName: "Massage thư giãn",
            major: "Nurse",
            price: 15000,
            duration: 40,
            description: "Massage giúp mẹ và bé giảm đau mỏi",
            isPackage: false,
            status: "active",
          },
          {
            serviceID: 5,
            serviceName: "Tư vấn dinh dưỡng",
            major: "Specialist",
            price: 20000,
            duration: 60,
            description: "Tư vấn dinh dưỡng cho mẹ và bé",
            isPackage: false,
            status: "active",
          },
        ],
      };
    }
  }

  // Lấy danh sách gói dịch vụ (isPackage = true)
  async getPackages() {
    try {
      const result = await this.getAllServiceTypes();
      if (result.success) {
        const packages = result.data.filter(
          (service) => service.isPackage
        );
        return {
          success: true,
          data: packages,
        };
      }

      // Fallback to mock data if API fails
      console.log("ServiceTypeService: Using mock packages data");
      return {
        success: true,
        data: [
          {
            serviceID: 3,
            serviceName: "Gói chăm sóc mẹ và bé sau sinh",
            major: "nurse",
            price: 20000,
            duration: 90,
            description: " tắm bé, vệ sinh rốn và massage thư giãn.",
            isPackage: true,
            status: "active",
          },
        ],
      };
    } catch (error) {
      console.log(
        "ServiceTypeService: Error in getPackages, using mock data"
      );
      return {
        success: true,
        data: [
          {
            serviceID: 3,
            serviceName: "Gói chăm sóc mẹ và bé sau sinh",
            major: "nurse",
            price: 20000,
            duration: 90,
            description: " tắm bé, vệ sinh rốn và massage thư giãn.",
            isPackage: true,
            status: "active",
          },
        ],
      };
    }
  }

  // Format giá tiền
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }

  // Format thời gian
  formatDuration(duration) {
    if (duration < 60) {
      return `${duration} phút`;
    } else {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      if (minutes === 0) {
        return `${hours} giờ`;
      } else {
        return `${hours} giờ ${minutes} phút`;
      }
    }
  }
}

export default new ServiceTypeService();
