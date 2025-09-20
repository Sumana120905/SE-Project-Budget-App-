document.addEventListener("DOMContentLoaded", () => {
    // ===== Login Form =====
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (username === "" || password === "") {
                alert("Please enter both username and password.");
                return;
            }

            // Demo check (replace with backend later)
            if (username === "admin" && password === "1234") {
                alert("Login successful!");
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid username or password.");
            }
        });
    }

    // ===== Registration Form =====
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!name || !email || !password) {
                alert("All fields are required.");
                return;
            }

            // Store user in localStorage (demo)
            localStorage.setItem("user", JSON.stringify({ name, email, password }));
            alert("Registration successful! You can now log in.");
            window.location.href = "login.html";
        });
    }

    // ===== Add Transaction Form =====
    const transactionForm = document.getElementById("transaction-form");
    if (transactionForm) {
        transactionForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const amount = document.getElementById("amount").value.trim();
            const category = document.getElementById("category").value;
            const date = document.getElementById("date").value;

            if (!amount || !category || !date) {
                alert("Please fill all fields.");
                return;
            }

            // Save to localStorage (demo)
            const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
            transactions.push({ amount, category, date });
            localStorage.setItem("transactions", JSON.stringify(transactions));

            alert("Transaction added!");
            transactionForm.reset();
        });
    }

    // ===== Settings Page =====
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        settingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const theme = document.getElementById("theme").value;
            const notifications = document.getElementById("notifications").checked;

            // Save settings in localStorage (demo)
            localStorage.setItem("settings", JSON.stringify({ theme, notifications }));
            alert("Settings saved successfully!");
        });
    }

    // ===== Logout (under Settings) =====
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            alert("Logged out successfully!");
            window.location.href = "login.html";
        });
    }
});
