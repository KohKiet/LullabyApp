import { TEMPLATE_ENDPOINTS } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class ServiceTaskService {
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

  async getAllServiceTasks() {
    try {
      const url = `${TEMPLATE_ENDPOINTS.SERVICE_TASKS}/getall`;
      console.log("ServiceTaskService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ServiceTaskService: Response status:",
        response.status
      );
      console.log("ServiceTaskService: Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ServiceTaskService: Data received:",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ServiceTaskService: HTTP Error:",
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
        "ServiceTaskService: Network error:",
        error.message
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Lấy danh sách service tasks theo package service ID
  async getServiceTasksByPackageId(packageServiceID) {
    try {
      console.log(
        "ServiceTaskService: Getting tasks for package ID:",
        packageServiceID
      );

      const url = `${TEMPLATE_ENDPOINTS.SERVICE_TASKS}/getbypackage/${packageServiceID}`;
      console.log("ServiceTaskService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ServiceTaskService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ServiceTaskService: Tasks received for package",
          packageServiceID,
          ":",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ServiceTaskService: HTTP Error:",
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
        "ServiceTaskService: Network error, using mock data:",
        error.message
      );
      // Fallback to mock data if API fails
      return {
        success: true,
        data: [
          {
            serviceTaskID: 1,
            child_ServiceID: 1,
            package_ServiceID: 3,
            description: "Massage giúp mẹ và bé giảm đau mỏi",
            taskOrder: 1,
            price: 15000,
            status: "active",
            quantity: 1,
          },
          {
            serviceTaskID: 2,
            child_ServiceID: 2,
            package_ServiceID: 3,
            description:
              "Quan sát tình trạng vàng da của trẻ sơ sinh",
            taskOrder: 2,
            price: 5000,
            status: "active",
            quantity: 1,
          },
        ].filter(
          (task) => task.package_ServiceID === packageServiceID
        ),
      };
    }
  }

  // Lấy danh sách service tasks theo service ID
  async getServiceTasksByServiceId(serviceID) {
    try {
      console.log(
        "ServiceTaskService: Getting tasks for service ID:",
        serviceID
      );

      const url = `${TEMPLATE_ENDPOINTS.SERVICE_TASKS}/getbyservice/${serviceID}`;
      console.log("ServiceTaskService: Fetching from URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "ServiceTaskService: Response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          "ServiceTaskService: Tasks received for service",
          serviceID,
          ":",
          data.length,
          "items"
        );
        return {
          success: true,
          data: data,
        };
      } else {
        console.log(
          "ServiceTaskService: HTTP Error:",
          response.status,
          response.statusText
        );
        // Fallback to mock data if API fails
        return {
          success: true,
          data: this.getMockServiceTasks(serviceID),
        };
      }
    } catch (error) {
      console.log(
        "ServiceTaskService: Network error, using mock data:",
        error.message
      );
      // Fallback to mock data if network fails
      return {
        success: true,
        data: this.getMockServiceTasks(serviceID),
      };
    }
  }

  // Generate mock service tasks based on service ID
  getMockServiceTasks(serviceID) {
    const mockTasks = {
      4: [
        // Ho tro tam ly (Psychological support)
        {
          serviceTaskID: 1,
          child_ServiceID: serviceID,
          package_ServiceID: null,
          description: "Tư vấn tâm lý ban đầu",
          taskOrder: 1,
          price: 1500,
          status: "active",
          quantity: 1,
        },
        {
          serviceTaskID: 2,
          child_ServiceID: serviceID,
          package_ServiceID: null,
          description: "Đánh giá tình trạng tâm lý",
          taskOrder: 2,
          price: 1200,
          status: "active",
          quantity: 1,
        },
      ],
      default: [
        {
          serviceTaskID: 1,
          child_ServiceID: serviceID,
          package_ServiceID: null,
          description: "Dịch vụ cơ bản",
          taskOrder: 1,
          price: 1500,
          status: "active",
          quantity: 1,
        },
      ],
    };

    return mockTasks[serviceID] || mockTasks.default;
  }

  // Format giá tiền
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }
}

export default new ServiceTaskService();
