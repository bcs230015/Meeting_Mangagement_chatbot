// File: authService.ts

// Cấu hình URL backend Java Spring Boot của bạn
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080/api/v1";

/**
 * Gọi API /api/auth/login để lấy JWT token
 * @param username Tên đăng nhập của nhân viên
 * @param password Mật khẩu
 * @returns Access Token (JWT)
 */
export const loginAndGetToken = async (
  username: string,
  password: string
): Promise<string> => {
  console.log(`Đang đăng nhập với user: ${username}...`);

  // 1. Tạo body request (giống hệt LoginRequest.java)
  const loginPayload = {
    username: username, // Hoặc 'email', tùy vào LoginRequest.java của bạn
    password: password,
  };

  try {
    const response = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginPayload),
    });

    if (!response.ok) {
      throw new Error(
        `Lỗi đăng nhập: ${response.status} ${response.statusText}`
      );
    }

    // 2. Phân tích response (giống AuthResponse.java)
    const authResponse = await response.json();

    if (!authResponse.accessToken) {
      throw new Error("Không tìm thấy 'accessToken' trong kết quả trả về.");
    }

    console.log("Đăng nhập thành công!");
    return authResponse.accessToken; // Trả về token
  } catch (error) {
    console.error("Không thể đăng nhập:", error);
    throw error;
  }
};
