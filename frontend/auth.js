const API_BASE_URL = "https://8samvw63id.execute-api.ap-south-1.amazonaws.com/prod";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const showLoginBtn = document.getElementById("showLoginBtn");
const showRegisterBtn = document.getElementById("showRegisterBtn");
const messageBox = document.getElementById("messageBox");

// Toggle Forms
showLoginBtn.addEventListener("click", () => {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    showLoginBtn.classList.add("active");
    showRegisterBtn.classList.remove("active");
    messageBox.textContent = "";
});

showRegisterBtn.addEventListener("click", () => {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    showRegisterBtn.classList.add("active");
    showLoginBtn.classList.remove("active");
    messageBox.textContent = "";
});

// Register User
registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const userId = document.getElementById("registerUsername").value.trim();
    const password = document.getElementById("registerPassword").value.trim();

    if (!name || !userId || !password) {
        messageBox.textContent = "Please fill all register fields.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                userId,
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            messageBox.style.color = "green";
            messageBox.textContent = "Registration successful! Please login.";

            registerForm.reset();

            // Switch to login
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            showLoginBtn.classList.add("active");
            showRegisterBtn.classList.remove("active");
        } else {
            messageBox.style.color = "red";
            messageBox.textContent = result.error || "Registration failed.";
        }
    } catch (error) {
        console.error("Register Error:", error);
        messageBox.style.color = "red";
        messageBox.textContent = "Error during registration.";
    }
});

// Login User
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const userId = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!userId || !password) {
        messageBox.textContent = "Please fill all login fields.";
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userId,
                password
            })
        });

        const result = await response.json();

        if (response.ok) {
            messageBox.style.color = "green";
            messageBox.textContent = "Login successful! Redirecting...";

            localStorage.setItem("loggedInUserId", result.userId || userId);
            localStorage.setItem("loggedInUserName", result.name || userId);

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);
        } else {
            messageBox.style.color = "red";
            messageBox.textContent = result.error || "Login failed.";
        }
    } catch (error) {
        console.error("Login Error:", error);
        messageBox.style.color = "red";
        messageBox.textContent = "Error during login.";
    }
});