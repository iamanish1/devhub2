import UserNote from "../Model/NotesModel.js";

export const saveUserNote = async (req, res) => {
    const { projectId } = req.params;
    const { note } = req.body; // should be 'note', not 'notes'
    try {
        let userNote = await UserNote.findOne({ projectId });
        if (userNote) {
            userNote.notes.push(note); // append new note
            await userNote.save();
        } else {
            userNote = new UserNote({
                projectId,
                notes: [note],
            });
            await userNote.save();
        }
        return res.status(201).json({ notes: userNote.notes });
    } catch (error) {
        console.error("Error saving user note:", error);
        return res.status(500).json({ message: "Internal server error" , error: error.message });
    }
};

export const getUserNotes = async (req, res) => {
    const { projectId } = req.params;
    try {
        const userNote = await UserNote.findOne({ projectId });
        // If not found, return empty array
        return res.status(200).json({ notes: userNote ? userNote.notes : [] });
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
}
