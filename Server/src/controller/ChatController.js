import Chat from "../Model/chatModel.js";
// Get all messages for a specific project chat room
export const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const messages = await Chat.find({ projectId }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// (Optional) Post a new message (if you want REST as well as sockets)
export const postMessage = async (req, res) => {
  try {
    const { projectId, senderId, text } = req.body;
    const message = new chat({
      projectId,
      senderId,
      text,
      timestamp: new Date(),
    });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
};