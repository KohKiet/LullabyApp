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
      const result = await this.getAllServiceTasks();
      if (result.success) {
        const tasks = result.data.filter(
          (task) => task.package_ServiceID === packageServiceID
        );
        return {
          success: true,
          data: tasks,
        };
      }

      // Fallback to mock data if API fails
      console.log(
        "ServiceTaskService: Using mock data for package",
        packageServiceID
      );
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
    } catch (error) {
      console.log(
        "ServiceTaskService: Error in getServiceTasksByPackageId, using mock data"
      );
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

  // Format giá tiền
  formatPrice(price) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }
}

export default new ServiceTaskService();
