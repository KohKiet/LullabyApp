# 🔧 Hướng dẫn khắc phục vấn đề kết nối API

## 📋 Kiểm tra trước khi bắt đầu

### 1. Đảm bảo Backend Server đang chạy

```bash
# Kiểm tra server có đang chạy không
curl http://localhost:5294/api/accounts/getall
```

### 2. Kiểm tra port và URL

- **Backend URL**: `http://localhost:5294`
- **Port**: `5294`
- **Base Path**: `/api`

## 🚀 Các bước khắc phục

### Bước 1: Kiểm tra môi trường

App sẽ tự động detect platform và sử dụng URL phù hợp:

- **Android Emulator**: `http://10.0.2.2:5294`
- **iOS Simulator**: `http://localhost:5294`
- **Web**: `http://localhost:5294`
- **Thiết bị thật**: Cần IP của máy tính

### Bước 2: Nếu dùng thiết bị thật

#### Tìm IP của máy tính:

```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
```

#### Cập nhật BASE_URL trong `services/apiConfig.js`:

```javascript
// Thay localhost bằng IP thật của máy tính
BASE_URL = "http://192.168.1.100:5294"; // Thay IP này
```

### Bước 3: Kiểm tra Firewall

- Tắt Windows Firewall tạm thời
- Hoặc thêm exception cho port 5294

### Bước 4: Kiểm tra CORS (nếu có lỗi)

Đảm bảo backend có CORS policy cho mobile app:

```csharp
// Trong Startup.cs hoặc Program.cs
app.UseCors(builder => {
    builder.AllowAnyOrigin()
           .AllowAnyMethod()
           .AllowAnyHeader();
});
```

## 🧪 Test kết nối

### Sử dụng ApiStatusIndicator

1. Mở app trong development mode
2. Xem component ApiStatusIndicator trên trang login
3. Nhấn "Direct Test" để test kết nối trực tiếp
4. Kiểm tra console logs

### Test thủ công

```bash
# Test từ máy tính
curl -X GET http://localhost:5294/api/accounts/getall

# Test từ thiết bị (thay IP)
curl -X GET http://192.168.1.100:5294/api/accounts/getall
```

## 🔍 Debug Logs

### Logs cần kiểm tra:

```
API Base URL: http://10.0.2.2:5294 (Development)
Checking API connection...
API connection failed: Network request failed
```

### Các trạng thái có thể:

- ✅ **API Connected**: Kết nối thành công
- ❌ **API Disconnected**: Không thể kết nối
- 🔄 **Checking...**: Đang kiểm tra

## 🛠️ Các giải pháp khác

### 1. Sử dụng ngrok (cho test nhanh)

```bash
# Cài đặt ngrok
npm install -g ngrok

# Tạo tunnel
ngrok http 5294

# Sử dụng URL ngrok trong app
BASE_URL = "https://abc123.ngrok.io";
```

### 2. Sử dụng Expo Tunnel

```bash
# Chạy với tunnel
expo start --tunnel
```

### 3. Kiểm tra Network Security

Thêm vào `app.json`:

```json
{
  "expo": {
    "android": {
      "networkSecurityConfig": {
        "cleartextTrafficPermitted": true
      }
    }
  }
}
```

## 📱 Test với Mock Data

Nếu không thể kết nối API, app sẽ tự động sử dụng mock data:

### Credentials để test:

```
Email: nguyenvana@email.com
Password: password123

Email: tranthib@email.com
Password: password123

Email: levanc@email.com
Password: password123
```

## 🆘 Nếu vẫn không được

1. **Kiểm tra backend logs** - xem có lỗi gì không
2. **Test với Postman** - đảm bảo API hoạt động
3. **Kiểm tra network** - ping IP của máy tính
4. **Restart server** - đôi khi cần restart
5. **Clear cache** - `expo start -c`

## 📞 Hỗ trợ

Nếu vẫn gặp vấn đề, hãy cung cấp:

- Platform (Android/iOS)
- Emulator hay thiết bị thật
- Logs từ console
- Screenshot của ApiStatusIndicator
