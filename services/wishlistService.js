import { BASE_URL } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class WishlistService {
  // Helper function to create fetch with timeout
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

  // Add nursing specialist to wishlist
  async addToWishlist(nursingID, customerID) {
    try {
      const url = `${BASE_URL}/api/Wishlist`;
      const requestBody = {
        nursingID: nursingID,
        customerID: customerID,
      };

      console.log("🔍 Add to wishlist API URL:", url);
      console.log("🔍 Add to wishlist request body:", requestBody);

      const response = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          accept: "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "🔍 Add to wishlist response status:",
        response.status
      );
      console.log("🔍 Add to wishlist response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Add to wishlist response data:", data);
        return { success: true, data: data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("🔍 Add to wishlist error response:", errorData);
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      console.error("🔍 Add to wishlist catch error:", error);
      return { success: false, error: error.message };
    }
  }

  // Remove nursing specialist from wishlist
  async removeFromWishlist(wishlistID) {
    try {
      const response = await this.fetchWithTimeout(
        `${BASE_URL}/api/Wishlist/${wishlistID}`,
        {
          method: "DELETE",
          headers: {
            accept: "*/*",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.message || `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all wishlist items for a customer
  async getWishlistByCustomer(customerID) {
    try {
      const url = `${BASE_URL}/api/Wishlist/GetAllByCustomer/${customerID}`;
      console.log("🔍 Wishlist API URL:", url);

      const response = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          accept: "*/*",
        },
      });

      console.log(
        "🔍 Wishlist API response status:",
        response.status
      );
      console.log("🔍 Wishlist API response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Wishlist API response data:", data);
        return { success: true, data: data };
      } else {
        const errorText = await response.text();
        console.log("🔍 Wishlist API error response:", errorText);
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }
    } catch (error) {
      console.error("🔍 Wishlist API catch error:", error);
      return { success: false, error: error.message };
    }
  }

  // Check if a nursing specialist is in customer's wishlist
  async isInWishlist(nursingID, customerID) {
    try {
      const result = await this.getWishlistByCustomer(customerID);
      if (result.success && result.data) {
        return result.data.some(
          (item) => item.nursingID === nursingID
        );
      }
      return false;
    } catch (error) {
      console.error("Error checking wishlist:", error);
      return false;
    }
  }
}

// Export singleton instance
export default new WishlistService();
