import { API_CONFIG } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class TransactionHistoryService {
  async fetchWithTimeout(url, options, timeout = NETWORK_TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("TransactionHistoryService fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  async payInvoice(invoiceID, bookingID) {
    try {
      console.log("TransactionHistoryService: payInvoice called");
      console.log("TransactionHistoryService: invoiceID:", invoiceID);
      console.log("TransactionHistoryService: bookingID:", bookingID);
      console.log(
        "TransactionHistoryService: BASE_URL:",
        API_CONFIG.BASE_URL
      );

      const url = `${API_CONFIG.BASE_URL}/api/Invoice`;
      console.log("TransactionHistoryService: Full URL:", url);

      const requestBody = {
        bookingID: bookingID,
        content: "Thanh toán booking",
      };
      console.log(
        "TransactionHistoryService: Request body:",
        requestBody
      );

      const result = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json-patch+json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log(
        "TransactionHistoryService: Pay invoice result:",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "TransactionHistoryService: Error paying invoice:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  async getAllTransactionHistory() {
    try {
      console.log(
        "TransactionHistoryService: Getting all transaction history..."
      );
      const url = `${API_CONFIG.BASE_URL}/api/TransactionHistory/GetAll`;

      const result = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "TransactionHistoryService: GetAll result:",
        result
      );
      return result;
    } catch (error) {
      console.error("Error getting all transaction history:", error);
      return { success: false, error: error.message };
    }
  }

  async getTransactionHistoryByAccount(accountID) {
    try {
      console.log(
        "TransactionHistoryService: Getting transaction history for account:",
        accountID
      );
      const url = `${API_CONFIG.BASE_URL}/api/TransactionHistory/GetAllByAccount/${accountID}`;

      const result = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "TransactionHistoryService: GetByAccount result:",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "Error getting transaction history by account:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  async getTransactionHistoryById(transactionID) {
    try {
      console.log(
        "TransactionHistoryService: Getting transaction by ID:",
        transactionID
      );
      const url = `${API_CONFIG.BASE_URL}/api/TransactionHistory/${transactionID}`;

      const result = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "TransactionHistoryService: GetById result:",
        result
      );
      return result;
    } catch (error) {
      console.error("Error getting transaction by ID:", error);
      return { success: false, error: error.message };
    }
  }

  // NEW: Refund money back to wallet by invoiceID
  async refundMoneyToWallet(invoiceID) {
    try {
      console.log(
        "TransactionHistoryService: refundMoneyToWallet called with invoiceID:",
        invoiceID
      );
      const url = `${API_CONFIG.BASE_URL}/api/TransactionHistory/RefundMoneyToWallet/${invoiceID}`;
      const result = await this.fetchWithTimeout(url, {
        method: "POST",
        headers: {
          accept: "*/*",
        },
        body: "",
      });
      console.log(
        "TransactionHistoryService: refundMoneyToWallet result:",
        result
      );
      return result;
    } catch (error) {
      console.error(
        "TransactionHistoryService: Error refunding money to wallet:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  formatTransactionType(type) {
    switch (type) {
      case "Pay by wallet":
        return "Thanh toán bằng ví";
      case "Top up":
        return "Nạp tiền";
      case "Refund":
        return "Hoàn tiền";
      default:
        return type;
    }
  }

  formatDate(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  }
}

export default new TransactionHistoryService();
