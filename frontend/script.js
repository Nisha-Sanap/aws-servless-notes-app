const API_BASE_URL = "https://8samvw63id.execute-api.ap-south-1.amazonaws.com/prod";
const USER_ID = localStorage.getItem("loggedInUserId");
const USER_NAME = localStorage.getItem("loggedInUserName");

if (!USER_ID) {
    alert("Please login first.");
    window.location.href = "auth.html";
}

const noteType = document.getElementById("noteType");
const content = document.getElementById("content");
const contentLabel = document.getElementById("contentLabel");
const pdfFields = document.getElementById("pdfFields");
const noteForm = document.getElementById("noteForm");
const notesContainer = document.getElementById("notesContainer");
const sharedNotesContainer = document.getElementById("sharedNotesContainer");
const editingNoteId = document.getElementById("editingNoteId");
const submitBtn = document.getElementById("submitBtn");
const pdfFileInput = document.getElementById("pdfFile");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const typeFilter = document.getElementById("typeFilter");
const sharingFilter = document.getElementById("sharingFilter");

let allMyNotes = [];
let allSharedNotes = [];

document.getElementById("welcomeText").textContent = `Welcome, ${USER_NAME || USER_ID}!`;

// Show/hide fields
noteType.addEventListener("change", function () {
    if (noteType.value === "pdf") {
        pdfFields.style.display = "block";
        content.style.display = "none";
        contentLabel.style.display = "none";
    } else {
        pdfFields.style.display = "none";
        content.style.display = "block";
        contentLabel.style.display = "block";
    }
});

// Auto file name
pdfFileInput.addEventListener("change", function () {
    const file = pdfFileInput.files[0];
    if (file) {
        document.getElementById("fileName").value = file.name;
    }
});

// Add / Update Note
noteForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    try {
        let base64PDF = "";

        if (noteType.value === "pdf" && pdfFileInput.files[0]) {
            const file = pdfFileInput.files[0];
            base64PDF = await convertFileToBase64(file);
        }

        const noteData = {
            userId: USER_ID,
            title: document.getElementById("title").value,
            category: document.getElementById("category").value,
            noteType: noteType.value,
            content: content.value,
            fileName: document.getElementById("fileName").value,
            pdfFileData: base64PDF,
            isShared: document.getElementById("isShared").value === "true"
        };

        if (editingNoteId.value) {
            noteData.noteId = editingNoteId.value;

            const response = await fetch(`${API_BASE_URL}/update-note`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Update failed");
            }

            alert("Note updated successfully!");
        } else {
            const response = await fetch(`${API_BASE_URL}/create-note`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(noteData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Create failed");
            }

            alert("Note added successfully!");
        }

        resetForm();
        await loadNotes();
        await loadSharedNotes();

    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
    }
});

// Load My Notes
async function loadNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-notes?userId=${USER_ID}`);
        const notes = await response.json();

        allMyNotes = notes || [];
        applyFilters();
    } catch (error) {
        console.error("Error loading notes:", error);
        notesContainer.innerHTML = `<div class="empty-msg">Error loading notes.</div>`;
    }
}

// Load Shared Notes
async function loadSharedNotes() {
    try {
        const response = await fetch(`${API_BASE_URL}/shared-notes`);
        const notes = await response.json();

        allSharedNotes = notes || [];
        displaySharedNotes(allSharedNotes);
    } catch (error) {
        console.error("Error loading shared notes:", error);
        sharedNotesContainer.innerHTML = `<div class="empty-msg">Error loading shared notes.</div>`;
    }
}

// Apply Search + Filters
function applyFilters() {
    let filtered = [...allMyNotes];

    const searchValue = searchInput.value.toLowerCase().trim();
    const categoryValue = categoryFilter.value.toLowerCase().trim();
    const typeValue = typeFilter.value;
    const sharingValue = sharingFilter.value;

    if (searchValue) {
        filtered = filtered.filter(note =>
            (note.title || "").toLowerCase().includes(searchValue)
        );
    }

    if (categoryValue) {
        filtered = filtered.filter(note =>
            (note.category || "").toLowerCase().includes(categoryValue)
        );
    }

    if (typeValue !== "all") {
        filtered = filtered.filter(note => note.noteType === typeValue);
    }

    if (sharingValue === "shared") {
        filtered = filtered.filter(note => note.isShared === true);
    } else if (sharingValue === "private") {
        filtered = filtered.filter(note => note.isShared === false);
    }

    displayNotes(filtered);
}

// Display My Notes
function displayNotes(notes) {
    notesContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
        notesContainer.innerHTML = `<div class="empty-msg">No notes found.</div>`;
        return;
    }

    notes.forEach(note => {
        const noteCard = document.createElement("div");
        noteCard.classList.add("note-card");

        noteCard.innerHTML = `
            <h3>${note.title || "Untitled Note"}</h3>
            <p><strong>Category:</strong> ${note.category || ""}</p>
            <p>
                <span class="badge ${note.noteType === "pdf" ? "badge-pdf" : "badge-text"}">
                    ${note.noteType ? note.noteType.toUpperCase() : "TEXT"}
                </span>
                <span class="badge ${note.isShared ? "badge-shared" : "badge-private"}">
                    ${note.isShared ? "SHARED" : "PRIVATE"}
                </span>
            </p>
            <p><strong>${note.noteType === "text" ? "Content" : "File"}:</strong> ${
                note.noteType === "text" ? (note.content || "") : (note.fileName || "PDF File")
            }</p>
        `;

        const actionDiv = document.createElement("div");
        actionDiv.classList.add("note-actions");

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("edit-btn");
        editBtn.onclick = () => editNote(note);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deleteNote(note.noteId);

        actionDiv.appendChild(editBtn);
        actionDiv.appendChild(deleteBtn);

        if (note.noteType === "pdf" && note.pdfUrl) {
            const link = document.createElement("a");
            link.href = note.pdfUrl;
            link.target = "_blank";
            link.textContent = "Download PDF";
            link.classList.add("download-btn");
            actionDiv.appendChild(link);
        }

        noteCard.appendChild(actionDiv);
        notesContainer.appendChild(noteCard);
    });
}

// Display Shared Notes
function displaySharedNotes(notes) {
    sharedNotesContainer.innerHTML = "";

    if (!notes || notes.length === 0) {
        sharedNotesContainer.innerHTML = `<div class="empty-msg">No shared notes found.</div>`;
        return;
    }

    notes.forEach(note => {
        const noteCard = document.createElement("div");
        noteCard.classList.add("note-card");

        noteCard.innerHTML = `
            <h3>${note.title || "Untitled Note"}</h3>
            <p><strong>Shared By:</strong> ${note.userId || ""}</p>
            <p><strong>Category:</strong> ${note.category || ""}</p>
            <p>
                <span class="badge ${note.noteType === "pdf" ? "badge-pdf" : "badge-text"}">
                    ${note.noteType ? note.noteType.toUpperCase() : "TEXT"}
                </span>
                <span class="badge badge-shared">SHARED</span>
            </p>
            <p><strong>${note.noteType === "text" ? "Content" : "File"}:</strong> ${
                note.noteType === "text" ? (note.content || "") : (note.fileName || "PDF File")
            }</p>
        `;

        const actionDiv = document.createElement("div");
        actionDiv.classList.add("note-actions");

        if (note.noteType === "pdf" && note.pdfUrl) {
            const link = document.createElement("a");
            link.href = note.pdfUrl;
            link.target = "_blank";
            link.textContent = "Download PDF";
            link.classList.add("download-btn");
            actionDiv.appendChild(link);
        }

        noteCard.appendChild(actionDiv);
        sharedNotesContainer.appendChild(noteCard);
    });
}

// Delete Note
async function deleteNote(noteId) {
    if (!confirm("Delete this note?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/delete-note`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: USER_ID, noteId })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Delete failed");
        }

        alert("Note deleted successfully!");
        await loadNotes();
        await loadSharedNotes();
    } catch (error) {
        alert("Error: " + error.message);
    }
}

// Edit Note
function editNote(note) {
    document.getElementById("title").value = note.title || "";
    document.getElementById("category").value = note.category || "";
    noteType.value = note.noteType || "text";
    content.value = note.content || "";
    document.getElementById("fileName").value = note.fileName || "";
    document.getElementById("isShared").value = note.isShared ? "true" : "false";
    editingNoteId.value = note.noteId;

    noteType.dispatchEvent(new Event("change"));
    submitBtn.textContent = "Update Note";
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Reset Form
function resetForm() {
    noteForm.reset();
    editingNoteId.value = "";
    submitBtn.textContent = "Add Note";
    noteType.dispatchEvent(new Event("change"));
    document.getElementById("fileName").value = "";
}

// Logout
function logoutUser() {
    localStorage.removeItem("loggedInUserId");
    localStorage.removeItem("loggedInUserName");
    alert("Logged out successfully!");
    window.location.href = "auth.html";
}

// Convert PDF to Base64
function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            const base64String = reader.result.split(",")[1];
            resolve(base64String);
        };

        reader.onerror = error => reject(error);
    });
}

// Filter event listeners
searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("input", applyFilters);
typeFilter.addEventListener("change", applyFilters);
sharingFilter.addEventListener("change", applyFilters);

// Load on page start
loadNotes();
loadSharedNotes();