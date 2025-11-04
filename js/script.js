document.addEventListener("DOMContentLoaded", () => {
    // Redirect to login if user is not logged in
    if (window.location.pathname.endsWith("dashboard.html") && !localStorage.getItem("loggedInUser")) {
    window.location.href = "login.html";
    }

    // ===== Notification Helper =====
    function showNotification(title, message) {
        if (Notification.permission === "granted") {
            new Notification(title, {
                body: message,
                icon: "icons/notify.png"
            });
        }
    }

    async function requestNotificationPermission() {
        if (Notification.permission === "default") {
            await Notification.requestPermission();
        }
    }

    // ===== Password Hashing Helper =====
    async function hashPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }

    // ===== Utility: Try Backend Fetch or Fallback to LocalStorage =====
    async function getTransactions() {
        try {
            const res = await fetch("/api/transactions");
            if (res.ok) return await res.json();
            throw new Error("Backend not available");
        } catch {
            return JSON.parse(localStorage.getItem("transactions")) || [];
        }
    }

    async function saveTransaction(newTransaction) {
        try {
            const res = await fetch("/api/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newTransaction),
            });
            if (res.ok) return await res.json();
            throw new Error("Backend save failed");
        } catch {
            const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
            transactions.push(newTransaction);
            localStorage.setItem("transactions", JSON.stringify(transactions));
        }
    }

    // ===== Theme Handling =====
    function applyTheme(theme) {
        const body = document.body;
        body.classList.remove("theme-default", "theme-cool", "theme-dark");
        switch (theme) {
            case "cool": body.classList.add("theme-cool"); break;
            case "dark": body.classList.add("theme-dark"); break;
            default: body.classList.add("theme-default"); break;
        }
    }

    // Load settings on startup
    const savedSettings = JSON.parse(localStorage.getItem("settings"));
    if (savedSettings) {
        applyTheme(savedSettings.theme || "default");
        if (savedSettings.notifications) {
            requestNotificationPermission();
        }
    }

    // ===== Registration =====
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!name || !email || !password) return alert("All fields are required.");

            const hashedPassword = await hashPassword(password);
            localStorage.setItem("user", JSON.stringify({ name, email, password: hashedPassword }));

            alert("Registration successful! You can now log in.");
            window.location.href = "login.html";
        });
    }

    // ===== Login =====
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value.trim();
            const password = document.getElementById("password").value.trim();

            if (!username || !password) return alert("Please enter both username and password.");

            const savedUser = JSON.parse(localStorage.getItem("user"));
            if (!savedUser) return alert("No registered user found. Please register first.");

            const hashedPassword = await hashPassword(password);

            if (username === savedUser.email && hashedPassword === savedUser.password) {
                localStorage.setItem("loggedInUser", savedUser.email);
                alert("Login successful!");
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid username or password.");
            }
        });
    }

    // ===== Add Transaction =====
    const transactionForm = document.getElementById("transaction-form");
    if (transactionForm) {
        const typeSelect = document.getElementById("type");
        const categorySelect = document.getElementById("category");

        const incomeCategories = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other Income"];
        const expenseCategories = ["Food", "Transport", "Rent", "Bills & Utilities", "Shopping",
                                   "Entertainment", "Healthcare", "Education", "Travel", "Miscellaneous"];

        typeSelect?.addEventListener("change", () => {
            categorySelect.innerHTML = '<option value="">Select</option>';
            const list = typeSelect.value === "Income" ? incomeCategories :
                         typeSelect.value === "Expense" ? expenseCategories : [];
            list.forEach(cat => {
                const opt = document.createElement("option");
                opt.value = cat;
                opt.textContent = cat;
                categorySelect.appendChild(opt);
            });
        });

        transactionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const type = document.getElementById("type").value;
            const amount = document.getElementById("amount").value.trim();
            const category = document.getElementById("category").value;
            const date = document.getElementById("date").value;

            if (!type || !amount || !category || !date)
                return alert("Please fill all fields.");

            const newTransaction = { type, amount, category, date };
            await saveTransaction(newTransaction);
            alert("Transaction added!");
            transactionForm.reset();
            categorySelect.innerHTML = '<option value="">Select a type first</option>';

            const notifySetting = JSON.parse(localStorage.getItem("settings"))?.notifications;
            if (notifySetting && Notification.permission === "granted") {
                showNotification(`New ${type} Added`, `${category}: ₹${amount}`);
            }
        });
    }

    // ===== Dashboard =====
    if (document.getElementById("total-income")) {
        (async () => {
            const transactions = await getTransactions();
            let totalIncome = 0, totalExpenses = 0;

            transactions.forEach(t => {
                const amt = parseFloat(t.amount);
                if (t.type === "Income") totalIncome += amt;
                else if (t.type === "Expense") totalExpenses += amt;
            });

            const balance = totalIncome - totalExpenses;
            document.getElementById("total-income").textContent = `₹${totalIncome.toFixed(2)}`;
            document.getElementById("total-expenses").textContent = `₹${totalExpenses.toFixed(2)}`;
            document.getElementById("balance").textContent = `₹${balance.toFixed(2)}`;

            const recentList = document.getElementById("recent-transactions");
            if (recentList) {
                recentList.innerHTML = "";
                const recent = transactions.slice(-5).reverse();
                if (!recent.length) {
                    recentList.innerHTML = "<li>No recent transactions found.</li>";
                } else {
                    recent.forEach(t => {
                        const li = document.createElement("li");
                        li.textContent = `${t.date} — ${t.type}: ${t.category} ₹${t.amount}`;
                        recentList.appendChild(li);
                    });
                }
            }
        })();
    }

    // ===== Settings Page =====
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
        const themeSelect = document.getElementById("theme");
        const notifCheckbox = document.getElementById("notifications");

        if (savedSettings) {
            themeSelect.value = savedSettings.theme || "default";
            notifCheckbox.checked = savedSettings.notifications || false;
        }

        // Add Reset Dummy Data button dynamically
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "Reset Dummy Data";
        resetBtn.type = "button";
        resetBtn.style.marginTop = "10px";
        settingsForm.appendChild(resetBtn);

        resetBtn.addEventListener("click", () => {
            localStorage.removeItem("transactions");
            alert("All dummy transactions cleared!");
            location.reload();
        });

        settingsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const theme = themeSelect.value;
            const notifications = notifCheckbox.checked;
            localStorage.setItem("settings", JSON.stringify({ theme, notifications }));
            applyTheme(theme);
            alert("Settings saved successfully!");
            if (notifications) {
                await requestNotificationPermission();
                if (Notification.permission === "granted") {
                    showNotification("Notifications Enabled", "You’ll now get alerts for transactions and reports!");
                }
            }
        });
    }

    // ===== Logout =====
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("loggedInUser");
            alert("Logged out successfully!");
            window.location.href = "login.html";
        });
    }

    // ===== Sidebar =====
    const sidebarContainer = document.getElementById("sidebar-container");
    const menuBtn = document.getElementById("menu-btn");
    const overlay = document.getElementById("overlay");

    if (sidebarContainer) {
        fetch("sidebar.html")
            .then(r => r.text())
            .then(data => {
                sidebarContainer.innerHTML = data;
                const sidebar = document.querySelector(".sidebar");
                const toggleSidebar = () => {
                    sidebar.classList.toggle("active");
                    overlay.classList.toggle("show");
                };
                menuBtn?.addEventListener("click", toggleSidebar);
                overlay?.addEventListener("click", toggleSidebar);
            })
            .catch(err => console.error("Error loading sidebar:", err));
    }

    // ===== Reports Page =====
    const generateBtn = document.getElementById("generate-report");
    if (generateBtn) {
        const incomeEl = document.getElementById("report-income");
        const expenseEl = document.getElementById("report-expenses");
        const balanceEl = document.getElementById("report-balance");
        const pieCtx = document.getElementById("pie-chart")?.getContext("2d");
        const barCtx = document.getElementById("bar-chart")?.getContext("2d");
        let pieChart, barChart;

        async function generateReport() {
            const selectedMonth = document.getElementById("report-month").value;
            const transactions = await getTransactions();
            const filtered = selectedMonth ? transactions.filter(t => t.date.startsWith(selectedMonth)) : transactions;

            let totalIncome = 0, totalExpense = 0;
            filtered.forEach(t => {
                const amt = parseFloat(t.amount);
                if (t.type === "Income") totalIncome += amt;
                else totalExpense += amt;
            });

            const balance = totalIncome - totalExpense;
            incomeEl.textContent = `₹${totalIncome.toFixed(2)}`;
            expenseEl.textContent = `₹${totalExpense.toFixed(2)}`;
            balanceEl.textContent = `₹${balance.toFixed(2)}`;

            if (pieChart) pieChart.destroy();
            if (barChart) barChart.destroy();

            pieChart = new Chart(pieCtx, {
                type: "pie",
                data: {
                    labels: ["Income", "Expenses"],
                    datasets: [{ data: [totalIncome, totalExpense], backgroundColor: ["#00b894", "#d63031"] }]
                },
                options: { responsive: true }
            });

            const categoryTotals = {};
            filtered.forEach(t => {
                categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount);
            });

            barChart = new Chart(barCtx, {
                type: "bar",
                data: {
                    labels: Object.keys(categoryTotals),
                    datasets: [{ label: "Amount (₹)", data: Object.values(categoryTotals), backgroundColor: "#0984e3" }]
                },
                options: { responsive: true, scales: { y: { beginAtZero: true } } }
            });

            const notifySetting = JSON.parse(localStorage.getItem("settings"))?.notifications;
            if (notifySetting && Notification.permission === "granted") {
                showNotification("Report Generated", "Your report is ready!");
            }
        }

        generateBtn.addEventListener("click", generateReport);
    }
});

// ===== Register Service Worker =====
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js")
    .then(() => console.log("✅ Service Worker Registered"))
    .catch(err => console.error("❌ SW registration failed:", err));
}


