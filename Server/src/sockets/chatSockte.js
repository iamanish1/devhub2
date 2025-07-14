import { Server } from "socket.io";
import Chat from "../Model/chatModel.js";

const chatSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`User ${socket.id} joined room: ${room}`);
    });

    socket.on("sendMessage", async ({ room, message, userId }) => {
      const chat = new Chat({ room, message, userId });
      await chat.save();

      io.to(room).emit("receiveMessage", chatMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);
    });
  });
};

export default chatSocket;