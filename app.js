// ==================== DATA STORAGE ====================
// Load data from localStorage or use empty arrays
let users = JSON.parse(localStorage.getItem('users')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Save data to localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// ==================== POPUP (PROFESSIONAL) ====================
let activePopupEl = null;

function showPopup(title, message, variant = 'error') {
    // Close any existing popup
    if (activePopupEl) {
        activePopupEl.remove();
        activePopupEl = null;
    }

    const variants = {
        error: {
            titleClass: 'text-red-600 dark:text-red-400',
            borderClass: 'border-red-200 dark:border-red-900/40'
        },
        warning: {
            titleClass: 'text-amber-600 dark:text-amber-400',
            borderClass: 'border-amber-200 dark:border-amber-900/40'
        },
        info: {
            titleClass: 'text-indigo-600 dark:text-indigo-400',
            borderClass: 'border-indigo-200 dark:border-indigo-900/40'
        }
    };

    const v = variants[variant] || variants.error;

    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 opacity-0 transition-opacity duration-150';

    const modal = document.createElement('div');
    modal.className = `w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border ${v.borderClass} overflow-hidden transform scale-95 opacity-0 transition-all duration-150`;

    const header = document.createElement('div');
    header.className = 'px-5 py-4 border-b border-gray-200 dark:border-gray-700';

    const titleEl = document.createElement('h3');
    titleEl.className = `text-base font-semibold ${v.titleClass}`;
    titleEl.textContent = title;

    const body = document.createElement('div');
    body.className = 'px-5 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line';
    body.textContent = message;

    const footer = document.createElement('div');
    footer.className = 'px-5 py-4 bg-gray-50 dark:bg-gray-900/30 flex justify-end';

    const okBtn = document.createElement('button');
    okBtn.type = 'button';
    okBtn.className = 'px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500';
    okBtn.textContent = 'OK';

    function closePopup() {
        overlay.classList.remove('opacity-100');
        modal.classList.remove('opacity-100', 'scale-100');
        modal.classList.add('opacity-0', 'scale-95');

        setTimeout(function() {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            if (activePopupEl === overlay) activePopupEl = null;
            document.removeEventListener('keydown', onKeyDown);
        }, 160);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') closePopup();
    }

    okBtn.addEventListener('click', closePopup);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closePopup();
    });
    document.addEventListener('keydown', onKeyDown);

    header.appendChild(titleEl);
    footer.appendChild(okBtn);

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    activePopupEl = overlay;

    // Animate in
    requestAnimationFrame(function() {
        overlay.classList.add('opacity-100');
        modal.classList.remove('opacity-0', 'scale-95');
        modal.classList.add('opacity-100', 'scale-100');
        okBtn.focus();
    });
}

// ==================== VALIDATION HELPERS ====================
function normalizeSpaces(str) {
    return String(str || '').replace(/\s+/g, ' ').trim();
}

function normalizeUserKey(name) {
    return normalizeSpaces(name).toLowerCase();
}

function isValidUserName(name) {
    // Only alphabets and single spaces between words, must start with a letter
    return /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name);
}

function isValidDescription(desc) {
    // Must start with a valid alphabet
    return /^[A-Za-z]/.test(desc);
}

// ==================== MONEY (PRECISE) ====================
// We store money internally in paise (integer) using BigInt to avoid floating point errors.
// `amountPaise` is persisted as a string in localStorage.
function parseMoneyToPaise(value) {
    const raw = String(value || '').trim();
    if (raw === '') return null;

    // Disallow negatives, exponents (1e5), and non-digit chars
    if (!/^\d+(?:\.\d+)?$/.test(raw)) return null;

    const parts = raw.split('.');
    const intPart = parts[0] || '0';
    const fracPart = parts[1] || '';

    // Round to 2 decimals (paise) using 3rd digit
    const frac3 = (fracPart + '000').slice(0, 3);
    const paise2 = frac3.slice(0, 2);
    const third = frac3.charAt(2);

    let paise = BigInt(intPart) * 100n + BigInt(paise2 || '0');
    if (third >= '5') paise += 1n;

    return paise;
}

function formatPaise(paise) {
    const p = BigInt(paise);
    const isNegative = p < 0n;
    const abs = isNegative ? -p : p;

    const rupees = abs / 100n;
    const remPaise = abs % 100n;

    return (isNegative ? '-' : '') + rupees.toString() + '.' + remPaise.toString().padStart(2, '0');
}

function divRound(numerator, divisor) {
    const n = BigInt(numerator);
    const d = BigInt(divisor);
    if (d === 0n) return 0n;
    return (n + d / 2n) / d;
}

function getExpenseAmountPaise(expense) {
    // Preferred new format
    if (expense && expense.amountPaise != null) {
        try {
            return BigInt(expense.amountPaise);
        } catch (e) {
            // fallthrough
        }
    }

    // Legacy formats
    if (expense && typeof expense.amount === 'number' && Number.isFinite(expense.amount)) {
        // Best effort conversion (may be lossy for very large legacy values)
        return BigInt(Math.round(expense.amount * 100));
    }

    if (expense && typeof expense.amount === 'string') {
        const p = parseMoneyToPaise(expense.amount);
        return p == null ? 0n : p;
    }

    return 0n;
}

function computeEqualShares(amountPaise, participants) {
    const n = participants.length;
    if (n === 0) return {};

    const total = BigInt(amountPaise);
    const count = BigInt(n);

    const base = total / count;
    const remainder = total % count;

    const shares = {};
    participants.forEach(function(pid, idx) {
        shares[pid] = base + (BigInt(idx) < remainder ? 1n : 0n);
    });

    return shares;
}

function getNextUserId() {
    let maxId = 0;
    users.forEach(function(u) {
        const idNum = parseInt(String(u.id), 10);
        if (Number.isFinite(idNum)) maxId = Math.max(maxId, idNum);
    });
    return String(maxId + 1);
}

function migrateLegacyDataIfNeeded() {
    let changed = false;

    // 1) Ensure user IDs are small sequential numbers: 1,2,3...
    const hasNonNumericUserId = users.some(function(u) {
        return !/^\d+$/.test(String(u.id));
    });

    if (users.length > 0 && hasNonNumericUserId) {
        const idMap = {};

        users.forEach(function(u, idx) {
            const oldId = String(u.id);
            const newId = String(idx + 1);
            idMap[oldId] = newId;
            u.id = newId;
        });

        // Update expense references to user IDs
        expenses.forEach(function(exp) {
            if (exp && exp.paidBy && idMap[exp.paidBy]) {
                exp.paidBy = idMap[exp.paidBy];
            }
            if (exp && Array.isArray(exp.participants)) {
                exp.participants = exp.participants.map(function(pid) {
                    return idMap[pid] || pid;
                });
            }
        });

        changed = true;
    }

    // Ensure all user IDs are strings
    users.forEach(function(u) {
        if (u && typeof u.id !== 'string') {
            u.id = String(u.id);
            changed = true;
        }
    });

    // 2) Ensure expenses have amountPaise (string)
    expenses.forEach(function(exp) {
        if (!exp) return;

        if (exp.amountPaise == null) {
            let paise = null;

            if (typeof exp.amount === 'number' && Number.isFinite(exp.amount)) {
                // Convert number -> string to parse; best-effort for legacy data
                paise = parseMoneyToPaise(exp.amount.toString());
            } else if (typeof exp.amount === 'string') {
                paise = parseMoneyToPaise(exp.amount);
            }

            if (paise != null) {
                exp.amountPaise = paise.toString();
                changed = true;
            }
        }
    });

    if (changed) saveData();
}

migrateLegacyDataIfNeeded();

// ==================== THEME TOGGLE ====================
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// Load saved theme or default to light
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        themeIcon.textContent = '☀️';
    } else {
        document.documentElement.classList.remove('dark');
        themeIcon.textContent = '🌙';
    }
}

// Toggle between light and dark theme
themeToggle.addEventListener('click', function() {
    const isDark = document.documentElement.classList.toggle('dark');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// ==================== USER MANAGEMENT ====================
const userForm = document.getElementById('userForm');
const userNameInput = document.getElementById('userName');
const userList = document.getElementById('userList');
const noUsers = document.getElementById('noUsers');

// Add new user
userForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const rawName = userNameInput.value;
    const name = normalizeSpaces(rawName);

    if (name === '') return;

    // Validate: only alphabets and spaces, must start with a letter
    if (!/^[A-Za-z]/.test(name)) {
        showPopup('Invalid Name', 'Name must start with a letter.\nPlease begin your name with an alphabet.', 'error');
        return;
    }
    if (!isValidUserName(name)) {
        showPopup('Invalid Name', 'Name can only contain alphabets and spaces.\nNumbers and special characters are not allowed.', 'error');
        return;
    }

    // Check for duplicate name (case-insensitive)
    const nameKey = normalizeUserKey(name);
    const isDuplicate = users.some(function(u) {
        return normalizeUserKey(u.name) === nameKey;
    });

    if (isDuplicate) {
        showPopup('Duplicate Name', 'A user with the name "' + name + '" already exists.\nEach user must have a unique name.', 'warning');
        return;
    }

    // Create user with sequential numeric ID
    const newUser = {
        id: getNextUserId(),
        name: name
    };

    users.push(newUser);
    saveData();
    userNameInput.value = '';

    renderUsers();
    updateExpenseForm();
});

// Display all users
function renderUsers() {
    userList.innerHTML = '';
    
    if (users.length === 0) {
        noUsers.classList.remove('hidden');
        return;
    }
    
    noUsers.classList.add('hidden');
    
    users.forEach(function(user) {
        const li = document.createElement('li');
        li.className = 'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
        
        // Get first letter for avatar
        const initial = user.name.charAt(0).toUpperCase();
        
        li.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                ${initial}
            </div>
            <div>
                <div class="font-medium text-gray-800 dark:text-white">${user.name}</div>
                <div class="text-xs text-gray-400">${user.id}</div>
            </div>
        `;
        
        userList.appendChild(li);
    });
}

// ==================== EXPENSE FORM ====================
const expenseForm = document.getElementById('expenseForm');
const needMoreUsers = document.getElementById('needMoreUsers');
const paidBySelect = document.getElementById('paidBy');
const participantList = document.getElementById('participantList');
const selectAllBtn = document.getElementById('selectAll');
const clearAllBtn = document.getElementById('clearAll');
const splitPreview = document.getElementById('splitPreview');
const expenseAmountInput = document.getElementById('expenseAmount');

// Update expense form based on users
function updateExpenseForm() {
    if (users.length < 2) {
        expenseForm.classList.add('hidden');
        needMoreUsers.classList.remove('hidden');
        return;
    }
    
    expenseForm.classList.remove('hidden');
    needMoreUsers.classList.add('hidden');
    
    // Update "Paid By" dropdown
    paidBySelect.innerHTML = '<option value="">Select who paid</option>';
    users.forEach(function(user) {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        paidBySelect.appendChild(option);
    });
    
    // Update participants checkboxes
    participantList.innerHTML = '';
    users.forEach(function(user) {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600';
        label.innerHTML = `
            <input type="checkbox" value="${user.id}" class="participant-checkbox w-4 h-4 accent-indigo-500">
            <span class="text-sm text-gray-700 dark:text-gray-300">${user.name}</span>
        `;
        participantList.appendChild(label);
    });
    
    updateSplitPreview();
}

// Select all participants
selectAllBtn.addEventListener('click', function() {
    document.querySelectorAll('.participant-checkbox').forEach(function(cb) {
        cb.checked = true;
    });
    updateSplitPreview();
});

// Clear all participants
clearAllBtn.addEventListener('click', function() {
    document.querySelectorAll('.participant-checkbox').forEach(function(cb) {
        cb.checked = false;
    });
    updateSplitPreview();
});

// Update split preview when amount or participants change
expenseAmountInput.addEventListener('input', updateSplitPreview);
participantList.addEventListener('change', updateSplitPreview);

function updateSplitPreview() {
    const paise = parseMoneyToPaise(expenseAmountInput.value);
    const selectedParticipantEls = document.querySelectorAll('.participant-checkbox:checked');
    const selectedCount = selectedParticipantEls.length;

    if (paise != null && paise > 0n && selectedCount > 0) {
        // Show the base per-person share (smallest share, in case of remainder)
        const base = paise / BigInt(selectedCount);
        const remainder = paise % BigInt(selectedCount);
        const perPersonDisplay = remainder === 0n
            ? '\u20B9' + formatPaise(base)
            : '\u20B9' + formatPaise(base) + '\u2013\u20B9' + formatPaise(base + 1n);

        splitPreview.textContent = perPersonDisplay + ' per person (' + selectedCount + ' participant' + (selectedCount > 1 ? 's' : '') + ')';
        splitPreview.classList.remove('hidden');
    } else {
        splitPreview.classList.add('hidden');
    }
}

// Add new expense
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const rawDesc = document.getElementById('expenseDesc').value;
    const description = normalizeSpaces(rawDesc);
    const paidBy = paidBySelect.value;

    // Get selected participants
    const participants = [];
    document.querySelectorAll('.participant-checkbox:checked').forEach(function(cb) {
        participants.push(cb.value);
    });

    // -- Description validation --
    if (!description) {
        showPopup('Missing Description', 'Please enter a description for the expense.', 'error');
        return;
    }
    if (!isValidDescription(description)) {
        showPopup('Invalid Description', 'Description must start with a letter.\nPlease do not begin with a number or special character.', 'error');
        return;
    }

    // -- Amount validation --
    const amountRaw = expenseAmountInput.value;
    const amountPaise = parseMoneyToPaise(amountRaw);

    if (amountPaise == null || amountPaise === 0n) {
        showPopup('Invalid Amount', 'Please enter a valid amount greater than zero.', 'error');
        return;
    }

    // -- Other fields --
    if (!paidBy) {
        showPopup('Missing Field', 'Please select who paid for this expense.', 'error');
        return;
    }
    if (participants.length === 0) {
        showPopup('Missing Field', 'Please select at least one participant to split the expense.', 'error');
        return;
    }

    // Create expense (store amountPaise as string for precision)
    const newExpense = {
        id: 'E' + Date.now(),
        description: description,
        amountPaise: amountPaise.toString(),
        paidBy: paidBy,
        participants: participants
    };

    expenses.push(newExpense);
    saveData();

    // Reset form
    expenseForm.reset();
    splitPreview.classList.add('hidden');

    renderExpenses();
    renderBalances();
});

// ==================== EXPENSE LIST ====================
const expensesList = document.getElementById('expensesList');
const noExpenses = document.getElementById('noExpenses');

// Get user name by ID
function getUserName(userId) {
    const user = users.find(function(u) {
        return u.id === userId;
    });
    return user ? user.name : 'Unknown';
}

// Display all expenses
function renderExpenses() {
    expensesList.innerHTML = '';
    
    if (expenses.length === 0) {
        noExpenses.classList.remove('hidden');
        return;
    }
    
    noExpenses.classList.add('hidden');
    
    expenses.forEach(function(expense) {
        const div = document.createElement('div');
        div.className = 'p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border-l-4 border-indigo-500';

        // Use precise paise arithmetic
        const totalPaise = getExpenseAmountPaise(expense);
        const n = expense.participants.length;
        const basePaise = n > 0 ? totalPaise / BigInt(n) : 0n;
        const remPaise = n > 0 ? totalPaise % BigInt(n) : 0n;
        const perPersonDisplay = remPaise === 0n
            ? '\u20B9' + formatPaise(basePaise)
            : '\u20B9' + formatPaise(basePaise) + '\u2013\u20B9' + formatPaise(basePaise + 1n);

        // Get participant names
        const participantNames = expense.participants.map(getUserName).join(', ');

        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-gray-800 dark:text-white">${expense.description}</h3>
                <span class="text-lg font-bold text-indigo-500">\u20B9${formatPaise(totalPaise)}</span>
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div class="flex justify-between">
                    <span>Paid by:</span>
                    <span class="font-medium">${getUserName(expense.paidBy)}</span>
                </div>
                <div class="flex justify-between">
                    <span>Split among:</span>
                    <span class="font-medium text-right max-w-[60%]">${participantNames}</span>
                </div>
                <div class="flex justify-between">
                    <span>Per person:</span>
                    <span class="font-medium">${perPersonDisplay}</span>
                </div>
            </div>
            <div class="text-xs text-gray-400 mt-2">${expense.id}</div>
        `;

        expensesList.appendChild(div);
    });
}

// ==================== BALANCE CALCULATION ====================
const balancesList = document.getElementById('balancesList');
const noBalances = document.getElementById('noBalances');
const balanceSummary = document.getElementById('balanceSummary');
const summaryList = document.getElementById('summaryList');

// Calculate and display balances
function renderBalances() {
    // Step 1: Calculate who owes whom (using BigInt paise)
    // debts[participantId][paidById] = paise (BigInt)
    const debts = {};

    expenses.forEach(function(expense) {
        const paidBy = expense.paidBy;
        const participants = expense.participants;
        const totalPaise = getExpenseAmountPaise(expense);

        // Distribute exactly using computeEqualShares (handles remainders)
        const shares = computeEqualShares(totalPaise, participants);

        participants.forEach(function(participantId) {
            if (participantId === paidBy) return;

            const owedPaise = shares[participantId] || 0n;

            if (!debts[participantId]) debts[participantId] = {};
            if (!debts[participantId][paidBy]) debts[participantId][paidBy] = 0n;
            debts[participantId][paidBy] += owedPaise;
        });
    });

    // Step 2: Simplify debts (net off mutual debts)
    const simplifiedBalances = [];
    const processed = {};

    Object.keys(debts).forEach(function(debtor) {
        Object.keys(debts[debtor]).forEach(function(creditor) {
            const pairKey = [debtor, creditor].sort().join('-');
            if (processed[pairKey]) return;
            processed[pairKey] = true;

            const debtorOwes = (debts[debtor] && debts[debtor][creditor]) || 0n;
            const creditorOwes = (debts[creditor] && debts[creditor][debtor]) || 0n;

            const netPaise = debtorOwes - creditorOwes;

            if (netPaise > 0n) {
                simplifiedBalances.push({ from: debtor, to: creditor, paise: netPaise });
            } else if (netPaise < 0n) {
                simplifiedBalances.push({ from: creditor, to: debtor, paise: -netPaise });
            }
        });
    });

    // Step 3: Display balances
    balancesList.innerHTML = '';
    summaryList.innerHTML = '';

    if (simplifiedBalances.length === 0) {
        noBalances.classList.remove('hidden');
        balanceSummary.classList.add('hidden');
        return;
    }

    noBalances.classList.add('hidden');
    balanceSummary.classList.remove('hidden');

    simplifiedBalances.forEach(function(balance) {
        const fromName = getUserName(balance.from);
        const toName = getUserName(balance.to);
        const amountStr = formatPaise(balance.paise);

        // Balance card
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-red-500 font-medium">${fromName}</span>
                <span class="text-gray-400">\u2192</span>
                <span class="text-green-500 font-medium">${toName}</span>
            </div>
            <span class="text-lg font-bold text-indigo-500">\u20B9${amountStr}</span>
        `;
        balancesList.appendChild(div);

        // Summary item
        const li = document.createElement('li');
        li.innerHTML = `<strong>${fromName}</strong> owes <strong>${toName}</strong> \u20B9${amountStr}`;
        summaryList.appendChild(li);
    });
}

// ==================== INITIALIZE APP ====================
loadTheme();
renderUsers();
updateExpenseForm();
renderExpenses();
renderBalances();
