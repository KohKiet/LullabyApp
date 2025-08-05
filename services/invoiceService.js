import { API_CONFIG } from "./apiConfig";

const NETWORK_TIMEOUT = 10000;

class InvoiceService {
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
      console.error("InvoiceService fetch error:", error);
      return { success: false, error: error.message };
    }
  }

  async getAllInvoices() {
    try {
      console.log("InvoiceService: Getting all invoices...");
      const url = `${API_CONFIG.BASE_URL}/api/Invoice/GetAll`;

      const result = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("InvoiceService: GetAll result:", result);
      return result;
    } catch (error) {
      console.error("Error getting all invoices:", error);
      return { success: false, error: error.message };
    }
  }

  async getInvoiceById(invoiceID) {
    try {
      console.log(
        "InvoiceService: Getting invoice by ID:",
        invoiceID
      );
      const url = `${API_CONFIG.BASE_URL}/api/Invoice/${invoiceID}`;

      const result = await this.fetchWithTimeout(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("InvoiceService: GetById result:", result);
      return result;
    } catch (error) {
      console.error("Error getting invoice by ID:", error);
      return { success: false, error: error.message };
    }
  }

  async getInvoiceByBookingId(bookingID) {
    try {
      console.log(
        "InvoiceService: Getting invoice by booking ID:",
        bookingID
      );

      // Lấy tất cả invoices và tìm theo bookingID
      const allInvoicesResult = await this.getAllInvoices();

      if (allInvoicesResult.success) {
        const invoice = allInvoicesResult.data.find(
          (inv) => inv.bookingID === parseInt(bookingID)
        );

        if (invoice) {
          console.log(
            "InvoiceService: Found invoice for booking:",
            invoice
          );
          return { success: true, data: invoice };
        } else {
          console.log(
            "InvoiceService: No invoice found for booking ID:",
            bookingID
          );
          return { success: false, error: "Invoice not found" };
        }
      } else {
        return allInvoicesResult;
      }
    } catch (error) {
      console.error("Error getting invoice by booking ID:", error);
      return { success: false, error: error.message };
    }
  }

  formatStatus(status) {
    switch (status) {
      case "pending":
        return "Chờ thanh toán";
      case "paid":
        return "Đã thanh toán";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  }

  formatDate(dateString) {
    if (!dateString) return "Chưa thanh toán";
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

export default new InvoiceService();
