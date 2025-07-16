import Chat from "../Model/chatModel.js";

const chatSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connected: " + socket.id);

    socket.on("joinRoom", (projectId) => {
      socket.join(projectId);
      console.log(`User ${socket.id} joined room: ${projectId}`);
    });

    socket.on("sendMessage", async ({ projectId, senderId, text }) => {
      const chat = new Chat({
        projectId,
       senderID: senderId,
        text,
        timestamp: new Date(),
      });
      await chat.save();

      io.to(projectId).emit("receiveMessage", chat);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);
    });
  });
};

export default chatSocket;
