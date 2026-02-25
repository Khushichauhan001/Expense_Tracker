// ==================== DATA STORAGE ====================
// Load data from localStorage or use empty arrays
let users = JSON.parse(localStorage.getItem('users')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Save data to localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

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
    
    const name = userNameInput.value.trim();
    if (name === '') return;
    
    // Create user with unique ID
    const newUser = {
        id: 'U' + Date.now(),
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
    const amount = parseFloat(expenseAmountInput.value) || 0;
    const selectedCount = document.querySelectorAll('.participant-checkbox:checked').length;
    
    if (amount > 0 && selectedCount > 0) {
        const perPerson = (amount / selectedCount).toFixed(2);
        splitPreview.textContent = `₹${perPerson} per person (${selectedCount} participant${selectedCount > 1 ? 's' : ''})`;
        splitPreview.classList.remove('hidden');
    } else {
        splitPreview.classList.add('hidden');
    }
}

// Add new expense
expenseForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const description = document.getElementById('expenseDesc').value.trim();
    const amount = parseFloat(expenseAmountInput.value);
    const paidBy = paidBySelect.value;
    
    // Get selected participants
    const participants = [];
    document.querySelectorAll('.participant-checkbox:checked').forEach(function(cb) {
        participants.push(cb.value);
    });
    
    // Validation
    if (!description || !amount || amount <= 0 || !paidBy || participants.length === 0) {
        alert('Please fill all fields and select at least one participant');
        return;
    }
    
    // Create expense
    const newExpense = {
        id: 'E' + Date.now(),
        description: description,
        amount: amount,
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
        
        // Get participant names
        const participantNames = expense.participants.map(getUserName).join(', ');
        const perPerson = (expense.amount / expense.participants.length).toFixed(2);
        
        div.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-gray-800 dark:text-white">${expense.description}</h3>
                <span class="text-lg font-bold text-indigo-500">₹${expense.amount.toFixed(2)}</span>
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
                    <span class="font-medium">₹${perPerson}</span>
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
    // Step 1: Calculate who owes whom
    const debts = {}; // { vishalId: { prateekId: 250 } } means vishal owes prateek 250
    
    expenses.forEach(function(expense) {
        const paidBy = expense.paidBy;
        const participants = expense.participants;
        const amount = expense.amount;
        
        // Calculate share per person (in paise to avoid floating point errors)
        const amountInPaise = Math.round(amount * 100);
        const shareInPaise = Math.floor(amountInPaise / participants.length);
        
        // Each participant (except payer) owes payer their share
        participants.forEach(function(participantId) {
            if (participantId !== paidBy) {
                // Initialize nested object if needed
                if (!debts[participantId]) {
                    debts[participantId] = {};
                }
                if (!debts[participantId][paidBy]) {
                    debts[participantId][paidBy] = 0;
                }
                debts[participantId][paidBy] += shareInPaise;
            }
        });
    });
    
    // Step 2: Simplify debts (if A owes B ₹100 and B owes A ₹60, then A owes B ₹40)
    const simplifiedBalances = [];
    const processed = {};
    
    Object.keys(debts).forEach(function(debtor) {
        Object.keys(debts[debtor]).forEach(function(creditor) {
            // Create unique key for this pair
            const pairKey = [debtor, creditor].sort().join('-');
            
            if (processed[pairKey]) return;
            processed[pairKey] = true;
            
            // Get amounts both ways
            const debtorOwes = (debts[debtor] && debts[debtor][creditor]) || 0;
            const creditorOwes = (debts[creditor] && debts[creditor][debtor]) || 0;
            
            // Calculate net amount
            const netAmountInPaise = debtorOwes - creditorOwes;
            
            if (netAmountInPaise > 0) {
                simplifiedBalances.push({
                    from: debtor,
                    to: creditor,
                    amount: netAmountInPaise / 100
                });
            } else if (netAmountInPaise < 0) {
                simplifiedBalances.push({
                    from: creditor,
                    to: debtor,
                    amount: Math.abs(netAmountInPaise) / 100
                });
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
        
        // Balance card
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg';
        div.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-red-500 font-medium">${fromName}</span>
                <span class="text-gray-400">→</span>
                <span class="text-green-500 font-medium">${toName}</span>
            </div>
            <span class="text-lg font-bold text-indigo-500">₹${balance.amount.toFixed(2)}</span>
        `;
        balancesList.appendChild(div);
        
        // Summary item
        const li = document.createElement('li');
        li.innerHTML = `<strong>${fromName}</strong> owes <strong>${toName}</strong> ₹${balance.amount.toFixed(2)}`;
        summaryList.appendChild(li);
    });
}

// ==================== INITIALIZE APP ====================
loadTheme();
renderUsers();
updateExpenseForm();
renderExpenses();
renderBalances();
