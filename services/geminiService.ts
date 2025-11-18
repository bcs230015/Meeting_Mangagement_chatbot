// File: services/geminiService.ts

import {
  GoogleGenAI,
  FunctionDeclaration,
  Type,
  Chat,
  GenerateContentResponse,
  Part,
} from "@google/genai";
import { loginAndGetToken } from "./authService.js"; // Đã thêm .js

const API_KEY = process.env.API_KEY; // Hoặc GEMINI_API_KEY, tùy file .env
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

// Cấu hình URL backend Java Spring Boot (đã có /v1)
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080/api/v1";

const ai = new GoogleGenAI({ apiKey: API_KEY });

// === ĐỊNH NGHĨA FUNCTION (Giữ nguyên) ===
const bookMeetingRoomFunctionDeclaration: FunctionDeclaration = {
  name: "bookMeetingRoom",
  parameters: {
    type: Type.OBJECT,
    description:
      "Books a meeting room based on user specifications. Finds an available room first.",
    properties: {
      numberOfPeople: {
        type: Type.INTEGER,
        description: "The number of people attending the meeting.",
      },
      dateTime: {
        type: Type.STRING,
        description:
          "The START date and time of the meeting in ISO 8601 format (e.g., 2025-11-17T14:00:00).",
      },
      durationInHours: {
        type: Type.INTEGER,
        description:
          "Duration of the meeting in hours. Default to 1 if not specified.",
      },
      roomName: {
        type: Type.STRING,
        description:
          "Optional name of the specific room the user wants to book.",
      },
    },
    required: ["numberOfPeople", "dateTime"],
  },
};

// === HƯỚNG DẪN HỆ THỐNG (Giữ nguyên) ===
const systemInstruction = `You are a helpful and friendly chatbot for a meeting room booking management system.
Your primary goal is to help users book meeting rooms.
When a user wants to book a room, like "tôi muốn đặt phòng 3 người lúc 5 giờ chiều mai, họp 2 tiếng" (I want to book a room for 3 people at 5pm tomorrow for 2 hours), you must use the 'bookMeetingRoom' tool.
CRITICAL: You must accurately parse the date.
- "hôm nay" (today), "ngày mai" (tomorrow), "ngày kia" (day after tomorrow), or specific dates (e.g., "ngày 20 tháng 11").
- ALWAYS convert this relative time to a full ISO 8601 string (e.g., '2025-11-18T17:00:00').
- If the user says "10h sáng" (10 AM) and the current time is 5 PM (17:00), you MUST assume they mean "10h sáng MAI" (tomorrow), not today.

You must extract:
1.  numberOfPeople (Số lượng người)
2.  dateTime (Thời gian bắt đầu, CHUYỂN sang định dạng ISO 8601)
3.  durationInHours (Thời lượng họp, tính bằng giờ, mặc định là 1 nếu không nói)
Always be polite and confirm the booking details with the user.`;

export const initializeChat = (): Chat => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: systemInstruction,
      tools: [{ functionDeclarations: [bookMeetingRoomFunctionDeclaration] }],
    },
  });
};

// === HÀM GỌI API BACKEND (CẬP NHẬT LỚN) ===
const handleFunctionCall = async (
  chat: Chat,
  functionCalls: any[],
  jwtToken: string
): Promise<GenerateContentResponse> => {
  const call = functionCalls[0];
  let bookingResult: string;

  if (call.name === "bookMeetingRoom") {
    const { numberOfPeople, dateTime, durationInHours = 1 } = call.args;

    try {
      // === BƯỚC 1: TÍNH TOÁN THỜI GIAN ===
      const startTime = new Date(dateTime);
      const endTime = new Date(
        startTime.getTime() + durationInHours * 60 * 60 * 1000
      ); // === BƯỚC 2: TÌM PHÒNG TRỐNG

      console.log("Đang gọi API: GET /rooms/available...");
      const params = new URLSearchParams({
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        capacity: numberOfPeople.toString(),
      });

      const availableRoomsResponse = await fetch(
        `${BACKEND_URL}/rooms/available?${params.toString()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );

      if (!availableRoomsResponse.ok) {
        throw new Error(
          `Lỗi khi tìm phòng: ${availableRoomsResponse.status} ${availableRoomsResponse.statusText}`
        );
      }

      const availableRooms: any[] = await availableRoomsResponse.json();

      if (availableRooms.length === 0) {
        // Nếu backend không trả về phòng nào
        bookingResult = `Rất tiếc, tôi đã kiểm tra nhưng không còn phòng nào trống cho ${numberOfPeople} người vào thời gian đó.`;
      } else {
        // Đã tìm thấy phòng! Lấy phòng đầu tiên
        const selectedRoom = availableRooms[0]; // { id: 5, name: "Room C", ... }
        console.log(
          `Đã tìm thấy phòng: ${selectedRoom.name} (ID: ${selectedRoom.id})`
        ); // === BƯỚC 3: TẠO PAYLOAD (Giống MeetingCreationRequest.java) ===

        const meetingPayload = {
          title: `Meeting booked by Chatbot`,
          roomId: selectedRoom.id, // Dùng ID phòng thật
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          participantIds: [], // Backend sẽ tự thêm người đặt từ JWT
        }; // === BƯỚC 4: ĐẶT PHÒNG (Gọi MeetingController) ===

        console.log("Calling Backend API: POST /meetings");
        const meetingResponse = await fetch(`${BACKEND_URL}/meetings`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(meetingPayload),
        });

        if (meetingResponse.ok) {
          const createdMeeting = await meetingResponse.json();
          bookingResult = `✅ Đã đặt phòng thành công! Phòng ${
            selectedRoom.name
          } (ID: ${createdMeeting.id}) lúc ${startTime.toLocaleString()}`;
        } else {
          // === SỬA LỖI XỬ LÝ "UNDEFINED" ===
          const statusCode = meetingResponse.status;
          const errorBodyText = await meetingResponse.text();
          console.error(`[DEBUG] Backend Error ${statusCode}:`, errorBodyText);

          let errorMessage = `Lỗi HTTP ${statusCode}`;
          try {
            const errorData = JSON.parse(errorBodyText);

            // Kiểm tra lỗi Validation (giống RoomRequest.java)
            if (
              errorData.errors &&
              Array.isArray(errorData.errors) &&
              errorData.errors.length > 0
            ) {
              errorMessage = errorData.errors[0].defaultMessage;
            }
            // Kiểm tra lỗi (GlobalExceptionHandler hoặc Spring mặc định)
            else {
              errorMessage =
                errorData.message ||
                errorData.error ||
                "Lỗi không xác định từ backend";
            }
          } catch (e) {
            // Nếu body lỗi không phải JSON
            errorMessage = errorBodyText.substring(0, 100); // Cắt ngắn nếu lỗi là trang HTML
          }
          bookingResult = `❌ Lỗi: Không thể đặt. Hệ thống báo: ${errorMessage}`;
        }
      }
    } catch (error: any) {
      console.error("Handle function call error:", error);
      bookingResult = `❌ Đã xảy ra lỗi khi gọi hệ thống: ${error.message}`;
    }
  } else {
    bookingResult = "Lỗi: Không tìm thấy hàm xử lý.";
  } // === BƯỚC 5: TRẢ KẾT QUẢ VỀ CHO GEMINI ===

  const functionResponsePart: Part = {
    functionResponse: {
      name: "bookMeetingRoom",
      response: { result: bookingResult },
    },
  };

  return await chat.sendMessage({ message: [functionResponsePart] });
};

// === HÀM GỬI TIN NHẮN (Giữ nguyên) ===
export const sendMessage = async (
  chat: Chat,
  message: string,
  jwtToken: string
): Promise<string> => {
  let response = await chat.sendMessage({ message });

  const functionCalls = response.functionCalls;

  if (functionCalls && functionCalls.length > 0) {
    response = await handleFunctionCall(chat, functionCalls, jwtToken);
  }

  return response.text;
};
