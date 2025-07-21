import UserNote from "../Model/NotesModel.js";

export const saveUserNote = async (req, res) => {
  const { projectId } = req.params;
  const { note, senderId } = req.body; // should be 'note', not 'notes'
  const newNote = {
    text: note, // assuming note is a string
    senderId,
  };
  try {
    let userNote = await UserNote.findOne({ projectId });

    console.log("New note to save:", newNote);
    if (userNote) {
      userNote.notes.push(newNote); // append new note
      await userNote.save();
    } else {
      userNote = new UserNote({
        projectId,
        notes: [newNote],
      });
      await userNote.save();
    }
    return res.status(201).json({ notes: userNote.notes });
  } catch (error) {
    console.error("Error saving user note:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const getUserNotes = async (req, res) => {
  const { projectId } = req.params; // Assuming you're passing projectId in params
  const { senderId } = req.query; // SenderId passed in query, NOT params

  try {
    const userNote = await UserNote.findOne({ projectId });

    if (!userNote) {
      return res.status(200).json({ notes: [] });
    }

    // Filter notes by senderId
    const filteredNotes = userNote.notes.filter(
      (note) => note.senderId.toString() === senderId
    );

    return res.status(200).json({ notes: filteredNotes });
  } catch (error) {
    console.error("Error fetching user notes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// delete notes
export const deleteUserNote = async (req, res) => {
  const { projectId } = req.params;
  try {
    await UserNote.deleteOne({ projectId });
    return res.status(200).json({ message: "Notes deleted successfully" });
  } catch (error) {
    console.error("Error deleting user notes:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
