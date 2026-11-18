
/* NEXO FINANCE — versión 2 */
(() => {
  "use strict";

  const STORAGE_KEY = "nexo-finance-v1";
  const $ = (id) => document.getElementById(id);

  const uid = () =>
    window.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const money = (n) =>
    new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD"
    }).format(Number(n) || 0);

  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);

  const oldData = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      return null;
    }
  })();

  function createInitialData() {
    const oldTransactions = Array.isArray(oldData?.transactions)
      ? oldData.transactions
      : [];

    const migratedTransactions = oldTransactions.map((t) => ({
      id: t.id || uid(),
      type: t.type === "income" ? "income" : "expense",
      description: t.description || "Movimiento anterior",
      amount: Math.abs(Number(t.amount) || 0),
      category: t.category || "Otros",
      date: t.date || today(),
      accountId: "cash-default",
      paymentMethod: "Efectivo",
      balanceApplied: true
    }));

    const historicalBalance = migratedTransactions.reduce(
      (total, t) => total + (t.type === "income" ? t.amount : -t.amount),
      0
    );

    return {
      schemaVersion: 2,
      theme: oldData?.theme || "light",
      accounts: [{
        id: "cash-default",
        name: "Efectivo",
        type: "cash",
        balance: historicalBalance
      }],
      transactions: migratedTransactions,
      debts: [],
      budgets: [],
      goals: [],
      commitments: []
    };
  }

  let data = oldData?.schemaVersion === 2
    ? oldData
    : createInitialData();

  data.accounts ||= [];
  data.transactions ||= [];
  data.debts ||= [];
  data.budgets ||= [];
  data.goals ||= [];
  data.commitments ||= [];
  data.schemaVersion = 2;

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function openDialog(id) {
    const dialog = $(id);
    if (dialog?.showModal) dialog.showModal();
    else if (dialog) dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (dialog?.close) dialog.close();
    else dialog?.removeAttribute("open");
  }

  function totalBalances() {
    return data.accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }

  function totalPayable() {
    return data.debts
      .filter((d) => d.type === "payable")
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }

  function totalReceivable() {
    return data.debts
      .filter((d) => d.type === "receivable")
      .reduce((sum, d) => sum + Number(d.amount || 0), 0);
  }

  function reservedMoney() {
    return data.commitments.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  }

  function monthTransactions() {
    const month = today().slice(0, 7);
    return data.transactions.filter((t) => String(t.date).slice(0, 7) === month);
  }

  function sumType(list, type) {
    return list
      .filter((t) => t.type === type)
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  function setText(id, value) {
    if ($(id)) $(id).textContent = value;
  }

  function renderDashboard() {
    const month = monthTransactions();
    const balances = totalBalances();
    const payable = totalPayable();
    const receivable = totalReceivable();
    const commitments = reservedMoney();

    setText("netWorth", money(balances - payable + receivable));
    setText("available", money(balances));
    setText("freeMoney", money(balances - commitments));
    setText("monthIncome", money(sumType(month, "income")));
    setText("monthExpense", money(sumType(month, "expense")));
    setText("totalDebts", money(payable));
    setText("commitments", money(commitments));

    const preview = $("accountPreview");
    if (preview) {
      preview.innerHTML = data.accounts.length
        ? data.accounts.slice(0, 4).map((a) => `
          <div class="account-row">
            <div class="item-info">
              <strong>${escapeHTML(a.name)}</strong>
              <small>${escapeHTML(accountTypeName(a.type))}</small>
            </div>
            <strong>${money(a.balance)}</strong>
          </div>
        `).join("")
        : '<p class="empty-state">Todavía no tienes cuentas registradas.</p>';
    }

    const recent = $("recentTransactions");
    if (recent) {
      const list = [...data.transactions]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)))
        .slice(0, 5);
      recent.innerHTML = transactionHTML(list);
    }
  }

  function accountTypeName(type) {
    return ({
      cash: "Efectivo",
      bank: "Cuenta bancaria",
      deuna: "De Una!",
      savings: "Ahorros",
      other: "Otra cuenta"
    })[type] || "Cuenta";
  }

  function renderAccounts() {
    const container = $("accountsList");
    if (!container) return;

    container.innerHTML = data.accounts.length
      ? data.accounts.map((a) => `
        <div class="account-row">
          <div class="item-info">
            <strong>${escapeHTML(a.name)}</strong>
            <small>${escapeHTML(accountTypeName(a.type))}</small>
          </div>
          <strong>${money(a.balance)}</strong>
        </div>
      `).join("")
      : '<p class="empty-state">Agrega tu primera cuenta.</p>';
  }

  function transactionHTML(list) {
    if (!list.length) {
      return '<p class="empty-state">Todavía no hay movimientos registrados.</p>';
    }

    return list.map((t) => {
      const positive = t.type === "income";
      return `
        <div class="transaction-row">
          <div class="item-info">
            <strong>${escapeHTML(t.description)}</strong>
            <small>${escapeHTML(t.category)} · ${escapeHTML(t.date || "")}</small>
            <small>${escapeHTML(t.paymentMethod || "")}</small>
          </div>
          <strong class="${positive ? "amount-positive" : "amount-negative"}">
            ${positive ? "+" : "−"}${money(t.amount)}
          </strong>
        </div>
      `;
    }).join("");
  }

  function renderTransactions() {
    const container = $("transactionsList");
    if (!container) return;

    const list = [...data.transactions]
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    container.innerHTML = transactionHTML(list);
  }

  function fillAccountSelects() {
    ["entryAccount", "transferFrom", "transferTo"].forEach((id) => {
      const select = $(id);
      if (!select) return;

      const previous = select.value;
      select.innerHTML = data.accounts.map((a) => `
        <option value="${escapeHTML(a.id)}">${escapeHTML(a.name)}</option>
      `).join("");

      if (data.accounts.some((a) => a.id === previous)) {
        select.value = previous;
      }
    });
  }

  function renderAnalysis() {
    const month = monthTransactions();
    const income = sumType(month, "income");
    const expenses = sumType(month, "expense");

    const summary = $("analysisSummary");
    if (summary) {
      summary.innerHTML = `
        <div class="account-row"><span>Ingresos del mes</span><strong>${money(income)}</strong></div>
        <div class="account-row"><span>Gastos del mes</span><strong>${money(expenses)}</strong></div>
        <div class="account-row"><span>Resultado del mes</span><strong>${money(income - expenses)}</strong></div>
      `;
    }

    const categories = {};
    month.filter((t) => t.type === "expense").forEach((t) => {
      categories[t.category] = (categories[t.category] || 0) + Number(t.amount || 0);
    });

    const categoryContainer = $("categoryAnalysis");
    if (categoryContainer) {
      const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
      const max = Math.max(1, ...entries.map((e) => e[1]));

      categoryContainer.innerHTML = entries.length
        ? entries.map(([name, amount]) => `
          <div class="analysis-bar">
            <div class="account-row">
              <span>${escapeHTML(name)}</span>
              <strong>${money(amount)}</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${Math.max(2, amount / max * 100)}%"></div>
            </div>
          </div>
        `).join("")
        : '<p class="empty-state">Aún no hay gastos este mes.</p>';
    }

    const monthly = $("monthlyAnalysis");
    if (monthly) {
      const months = {};
      data.transactions.forEach((t) => {
        const key = String(t.date || "").slice(0, 7);
        if (!key) return;
        months[key] ||= { income: 0, expense: 0 };
        months[key][t.type] += Number(t.amount || 0);
      });

      monthly.innerHTML = Object.entries(months)
        .sort((a, b) => b[0].localeCompare(a[0]))
        .slice(0, 12)
        .map(([key, values]) => `
          <div class="account-row">
            <div class="item-info">
              <strong>${escapeHTML(key)}</strong>
              <small>Ingresos: ${money(values.income)} · Gastos: ${money(values.expense)}</small>
            </div>
            <strong>${money(values.income - values.expense)}</strong>
          </div>
        `).join("") || '<p class="empty-state">Sin información todavía.</p>';
    }
  }

  function renderPlanning() {
    const budgets = $("budgetsList");
    if (budgets) {
      budgets.innerHTML = data.budgets.length
        ? data.budgets.map((b) => {
          const spent = data.transactions
            .filter((t) => t.type === "expense" && t.category === b.category &&
              String(t.date).slice(0, 7) === today().slice(0, 7))
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const percent = Math.min(100, spent / Math.max(1, b.amount) * 100);
          return `
            <div class="panel">
              <div class="account-row">
                <strong>${escapeHTML(b.category)}</strong>
                <strong>${money(spent)} / ${money(b.amount)}</strong>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${percent}%"></div>
              </div>
            </div>
          `;
        }).join("")
        : '<p class="empty-state">Todavía no tienes presupuestos.</p>';
    }

    const goals = $("goalsList");
    if (goals) {
      goals.innerHTML = data.goals.length
        ? data.goals.map((g) => {
          const percent = Math.min(100, Number(g.saved || 0) / Math.max(1, g.target) * 100);
          return `
            <div class="panel">
              <div class="account-row">
                <strong>${escapeHTML(g.name)}</strong>
                <strong>${money(g.saved)} / ${money(g.target)}</strong>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${percent}%"></div>
              </div>
            </div>
          `;
        }).join("")
        : '<p class="empty-state">Todavía no tienes metas de ahorro.</p>';
    }

    const debts = $("debtsList");
    if (debts) {
      debts.innerHTML = data.debts.length
        ? data.debts.map((d) => `
          <div class="account-row">
            <div class="item-info">
              <strong>${escapeHTML(d.name)}</strong>
              <small>${d.type === "receivable" ? "Me deben" : "Debo"}${d.dueDate ? " · " + escapeHTML(d.dueDate) : ""}</small>
            </div>
            <strong>${money(d.amount)}</strong>
          </div>
        `).join("")
        : '<p class="empty-state">No tienes deudas registradas.</p>';
    }
  }

  function render() {
    document.documentElement.dataset.theme = data.theme || "light";
    document.body.dataset.theme = data.theme || "light";

    fillAccountSelects();
    renderDashboard();
    renderAccounts();
    renderTransactions();
    renderAnalysis();
    renderPlanning();

    if ($("settingsTheme")) $("settingsTheme").value = data.theme || "light";
    if ($("themeBtn")) $("themeBtn").textContent = data.theme === "dark" ? "☀️" : "🌙";
  }

  let currentEntryType = "expense";

  function openEntry(type) {
    if (!data.accounts.length) {
      alert("Primero agrega una cuenta para registrar movimientos.");
      openDialog("accountDialog");
      return;
    }

    currentEntryType = type;
    if ($("entryTitle")) {
      $("entryTitle").textContent = type === "income" ? "Registrar ingreso" : "Registrar gasto";
    }
    if ($("entryDate")) $("entryDate").value = today();
    if ($("entryAmount")) $("entryAmount").value = "";
    if ($("entryDescription")) $("entryDescription").value = "";

    const category = $("entryCategory");
    if (category) {
      const options = type === "income"
        ? ["Salario", "Trabajo", "Servicios", "Negocio", "Extraordinario", "Otros"]
        : ["Alimentación", "Transporte", "Vivienda", "Salud", "Educación", "Compras", "Servicios", "Entretenimiento", "Deudas", "Otros"];

      category.innerHTML = options.map((v) =>
        `<option value="${escapeHTML(v)}">${escapeHTML(v)}</option>`
      ).join("");
    }

    fillAccountSelects();
    openDialog("entryDialog");
  }

  $("entryForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const amount = Number($("entryAmount")?.value);
    const account = data.accounts.find((a) => a.id === $("entryAccount")?.value);

    if (!Number.isFinite(amount) || amount <= 0 || !account) {
      alert("Revisa el valor y la cuenta seleccionada.");
      return;
    }

    const transaction = {
      id: uid(),
      type: currentEntryType,
      description: $("entryDescription")?.value.trim() || (currentEntryType === "income" ? "Ingreso" : "Gasto"),
      amount,
      category: $("entryCategory")?.value || "Otros",
      date: $("entryDate")?.value || today(),
      accountId: account.id,
      paymentMethod: $("paymentMethod")?.value || accountTypeName(account.type),
      balanceApplied: true
    };

    account.balance += currentEntryType === "income" ? amount : -amount;
    data.transactions.push(transaction);

    save();
    closeDialog($("entryDialog"));
    render();
  });

  $("accountForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = $("accountName")?.value.trim();
    const type = $("accountType")?.value || "other";
    const balance = Number($("accountBalance")?.value || 0);

    if (!name || !Number.isFinite(balance)) {
      alert("Ingresa un nombre y un saldo válido.");
      return;
    }

    data.accounts.push({
      id: uid(),
      name,
      type,
      balance
    });

    save();
    $("accountForm").reset();
    closeDialog($("accountDialog"));
    render();
  });

  $("transferForm")?.addEventListener("submit", (event) => {
    event.preventDefault();

    const from = data.accounts.find((a) => a.id === $("transferFrom")?.value);
    const to = data.accounts.find((a) => a.id === $("transferTo")?.value);
    const amount = Number($("transferAmount")?.value);

    if (!from || !to || from.id === to.id || !Number.isFinite(amount) || amount <= 0) {
      alert("Selecciona dos cuentas diferentes e ingresa un valor válido.");
      return;
    }

    if (from.balance < amount) {
      alert("El saldo de la cuenta de origen no es suficiente.");
      return;
    }

    from.balance -= amount;
    to.balance += amount;

    data.transactions.push({
      id: uid(),
      type: "transfer",
      description: `Transferencia: ${from.name} → ${to.name}`,
      amount,
      category: "Transferencia",
      date: $("transferDate")?.value || today(),
      accountId: from.id,
      paymentMethod: "Transferencia",
      balanceApplied: true
    });

    save();
    closeDialog($("transferDialog"));
    render();
  });

  $("addAccount")?.addEventListener("click", () => {
    $("accountForm")?.reset();
    openDialog("accountDialog");
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "expense" || action === "income") openEntry(action);
      if (action === "transfer") {
        if (data.accounts.length < 2) {
          alert("Necesitas al menos dos cuentas para hacer una transferencia.");
          return;
        }
        if ($("transferDate")) $("transferDate").value = today();
        fillAccountSelects();
        openDialog("transferDialog");
      }
    });
  });

  $("addBudget")?.addEventListener("click", () => {
    const category = prompt("¿Para qué categoría será el presupuesto?");
    if (!category?.trim()) return;

    const amount = Number(prompt("¿Cuál será el límite mensual en dólares?"));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Ingresa un valor válido.");
      return;
    }

    data.budgets.push({ id: uid(), category: category.trim(), amount });
    save();
    render();
  });

  $("addGoal")?.addEventListener("click", () => {
    const name = prompt("Nombre de tu meta de ahorro:");
    if (!name?.trim()) return;

    const target = Number(prompt("¿Cuánto deseas ahorrar en dólares?"));
    if (!Number.isFinite(target) || target <= 0) {
      alert("Ingresa un valor válido.");
      return;
    }

    data.goals.push({ id: uid(), name: name.trim(), target, saved: 0 });
    save();
    render();
  });

  $("addDebt")?.addEventListener("click", () => {
    const name = prompt("Nombre o concepto de la deuda:");
    if (!name?.trim()) return;

    const amount = Number(prompt("Valor pendiente en dólares:"));
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Ingresa un valor válido.");
      return;
    }

    const type = confirm("Pulsa Aceptar si es dinero que TÚ debes. Pulsa Cancelar si es dinero que te deben.")
      ? "payable"
      : "receivable";

    const dueDate = prompt("Fecha de vencimiento (opcional, formato AAAA-MM-DD):") || "";

    data.debts.push({
      id: uid(),
      name: name.trim(),
      amount,
      type,
      dueDate
    });

    save();
    render();
  });

  // Navegación entre secciones
  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => showPage(button.dataset.page));
  });

  function showPage(page) {
    document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));
    const target = $(`page-${page}`);
    if (target) target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === page);
    });
  }

  // Acceso a ajustes desde la barra superior
  if ($("themeBtn") && !$("settingsShortcut")) {
    const settingsButton = document.createElement("button");
    settingsButton.id = "settingsShortcut";
    settingsButton.type = "button";
    settingsButton.className = "icon-button";
    settingsButton.textContent = "⚙️";
    settingsButton.title = "Ajustes";
    settingsButton.addEventListener("click", () => showPage("settings"));
    $("themeBtn").insertAdjacentElement("afterend", settingsButton);
  }

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => {
      closeDialog(button.closest("dialog"));
    });
  });

  function toggleTheme() {
    data.theme = data.theme === "dark" ? "light" : "dark";
    save();
    render();
  }

  $("themeBtn")?.addEventListener("click", toggleTheme);

  $("settingsTheme")?.addEventListener("change", (event) => {
    data.theme = event.target.value === "dark" ? "dark" : "light";
    save();
    render();
  });

  // Copia de seguridad
  $("backupBtn")?.addEventListener("click", () => {
    const backup = {
      app: "Nexo Finance",
      version: 2,
      exportedAt: new Date().toISOString(),
      data
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nexo-finance-respaldo-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  // Restaurar copia de seguridad
  $("restoreBtn")?.addEventListener("click", () => $("restoreFile")?.click());

  $("restoreFile")?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const backup = JSON.parse(content);
      const restored = backup.data || backup;

      if (!Array.isArray(restored.accounts) || !Array.isArray(restored.transactions)) {
        throw new Error("Formato no válido");
      }

      if (!confirm("Esto reemplazará los datos actuales por los del respaldo. ¿Deseas continuar?")) {
        event.target.value = "";
        return;
      }

      data = {
        schemaVersion: 2,
        theme: restored.theme || "light",
        accounts: restored.accounts,
        transactions: restored.transactions,
        debts: restored.debts || [],
        budgets: restored.budgets || [],
        goals: restored.goals || [],
        commitments: restored.commitments || []
      };

      save();
      render();
      alert("Respaldo restaurado correctamente.");
    } catch {
      alert("No se pudo restaurar. Comprueba que seleccionaste un respaldo válido de Nexo Finance.");
    }

    event.target.value = "";
  });

  // Valores iniciales de fechas
  if ($("entryDate")) $("entryDate").value = today();
  if ($("transferDate")) $("transferDate").value = today();

  save();
  render();
})();
