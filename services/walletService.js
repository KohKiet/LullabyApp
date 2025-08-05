import { WALLET_ENDPOINTS } from "./apiConfig";

// Network timeout (10 seconds)
const NETWORK_TIMEOUT = 10000;

class WalletService {
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

  // Lấy tất cả wallets
  async getAllWallets() {
    try {
      const response = await this.fetchWithTimeout(
        WALLET_ENDPOINTS.GET_ALL_WALLETS,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy wallet theo ID
  async getWalletById(walletID) {
    try {
      const response = await this.fetchWithTimeout(
        WALLET_ENDPOINTS.GET_WALLET_BY_ID(walletID),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      } else {
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Lấy wallet theo accountID
  async getWalletByAccountId(accountID) {
    try {
      const allResult = await this.getAllWallets();
      if (allResult.success) {
        const wallet = allResult.data.find(
          (w) => w.accountID === accountID
        );
        if (wallet) {
          return { success: true, data: wallet };
        } else {
          return {
            success: false,
            error: "Wallet not found",
          };
        }
      } else {
        return { success: false, error: allResult.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Format amount to VND
  formatAmount(amount) {
    if (amount === null || amount === undefined) return "0 VNĐ";

    // Convert to number if it's a string
    const numAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return "0 VNĐ";

    // Format with commas for thousands
    return numAmount.toLocaleString("vi-VN") + " VNĐ";
  }

  // Format amount without VNĐ suffix (for input fields)
  formatAmountForInput(amount) {
    if (amount === null || amount === undefined) return "0";

    const numAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) return "0";

    return numAmount.toLocaleString("vi-VN");
  }

  // Parse amount from formatted string
  parseAmount(formattedAmount) {
    if (!formattedAmount) return 0;

    // Remove all non-digit characters (commas, spaces, VNĐ, etc.)
    const cleanAmount = formattedAmount.replace(/[^\d]/g, "");
    return parseInt(cleanAmount) || 0;
  }
}

// Export singleton instance
export default new WalletService();
