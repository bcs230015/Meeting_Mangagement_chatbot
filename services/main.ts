import "dotenv/config";
import { initializeChat, sendMessage } from "./geminiService.js";
import { loginAndGetToken } from "./authService.js";
import * as readline from "readline/promises"; // Để tạo giao diện chat terminal

// --- CẤU HÌNH ĐĂNG NHẬP ĐỂ TEST ---
// Thay thế bằng tài khoản admin/user trong DB của bạn
const TEST_USERNAME = "Binhb211@gmail.com";
const TEST_PASSWORD = "12345678";
// -----------------------------------

const run = async () => {
  try {
    // === BƯỚC 1: LẤY TOKEN ===
    const jwtToken = await loginAndGetToken(TEST_USERNAME, TEST_PASSWORD);

    // === BƯỚC 2: KHỞI TẠO CHAT ===
    const chat = initializeChat();

    // === BƯỚC 3: CHẠY VÒNG LẶP CHAT ===
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n--- Chatbot đã sẵn sàng (Đã đăng nhập!) ---");

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const userMessage = await rl.question("Bạn: ");
      if (userMessage.toLowerCase() === "exit") {
        rl.close();
        break;
      }

      // Gửi tin nhắn và token đến service
      const botResponse = await sendMessage(chat, userMessage, jwtToken);
      console.log(`Bot: ${botResponse}\n`);
    }
  } catch (error: any) {
    console.error("\nĐã xảy ra lỗi nghiêm trọng:", error.message);
    process.exit(1);
  }
};

run();
