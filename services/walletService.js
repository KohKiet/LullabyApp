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

  // Nạp tiền vào ví bằng PayOS (Mobile)
  async topUpWalletMobile(walletID, amount, retryCount = 0) {
    const maxRetries = 2;

    try {
      console.log(
        "WalletService: Starting PayOS top-up for walletID:",
        walletID,
        "amount:",
        amount,
        "retry:",
        retryCount
      );

      const url = `${WALLET_ENDPOINTS.BASE_URL}/api/TransactionHistory/AddMoneyToWalletMobile`;
      console.log("WalletService: PayOS API URL:", url);

      const requestBody = {
        walletID: walletID,
        amount: amount,
      };
      console.log("WalletService: Request body:", requestBody);

      const response = await this.fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json-patch+json",
          },
          body: JSON.stringify(requestBody),
        },
        30000 // 30 seconds timeout for payment
      );

      console.log("WalletService: Response status:", response.status);
      console.log("WalletService: Response ok:", response.ok);

      if (response.ok) {
        // Kiểm tra content-type để xử lý response đúng
        const contentType = response.headers.get("content-type");
        console.log(
          "WalletService: Response content-type:",
          contentType
        );

        let data;
        if (contentType && contentType.includes("application/json")) {
          // Response là JSON
          data = await response.json();
          console.log("WalletService: JSON response data:", data);
        } else {
          // Response có thể là text (URL string)
          const responseText = await response.text();
          console.log(
            "WalletService: Text response data:",
            responseText
          );

          // Kiểm tra xem có phải PayOS URL không
          if (responseText.includes("pay.payos.vn")) {
            data = responseText; // Trả về URL string
          } else {
            // Thử parse JSON nếu có thể
            try {
              data = JSON.parse(responseText);
              console.log(
                "WalletService: Parsed JSON from text:",
                data
              );
            } catch (parseError) {
              console.log(
                "WalletService: Could not parse response as JSON, treating as text"
              );
              data = responseText;
            }
          }
        }

        return { success: true, data: data };
      } else {
        let errorMessage = "Nạp tiền thất bại";
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.message || errorData.error || errorMessage;
          console.log(
            "WalletService: Error response data:",
            errorData
          );
        } catch (parseError) {
          console.log(
            "WalletService: Could not parse error response:",
            parseError
          );
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error("WalletService: PayOS top-up error:", error);

      // Retry logic cho network failures
      if (
        retryCount < maxRetries &&
        (error.message.includes("Network request failed") ||
          error.message.includes("fetch") ||
          error.name === "AbortError")
      ) {
        console.log(
          `WalletService: Retrying... (${
            retryCount + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        ); // Exponential backoff
        return this.topUpWalletMobile(
          walletID,
          amount,
          retryCount + 1
        );
      }

      // Phân loại lỗi để user hiểu rõ hơn
      let userErrorMessage = "Đã xảy ra lỗi khi nạp tiền";

      if (error.name === "AbortError") {
        userErrorMessage =
          "Yêu cầu nạp tiền bị timeout. Vui lòng thử lại.";
      } else if (error.message.includes("Network request failed")) {
        userErrorMessage =
          "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.";
      } else if (error.message.includes("fetch")) {
        userErrorMessage = "Lỗi kết nối mạng. Vui lòng thử lại sau.";
      }

      return {
        success: false,
        error: userErrorMessage,
        originalError: error.message,
      };
    }
  }

  // Lấy thông tin ví theo accountID (cải thiện)
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
          // Tạo wallet mới nếu chưa có
          return {
            success: false,
            error: "Wallet not found",
            shouldCreate: true,
          };
        }
      } else {
        return { success: false, error: allResult.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new WalletService();
