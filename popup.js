document.addEventListener('DOMContentLoaded', () => {
  const pm = new PasswordManager();
  let masterKey = null;

  // UI Elements
  const loginSection = document.getElementById('loginSection');
  const registerSection = document.getElementById('registerSection');
  const managerSection = document.getElementById('managerSection');
  
  const loginUsername = document.getElementById('loginUsername');
  const loginPassword = document.getElementById('loginPassword');
  const registerUsername = document.getElementById('registerUsername');
  const registerPassword = document.getElementById('registerPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  
  const website = document.getElementById('website');
  const password = document.getElementById('password');
  const savePassword = document.getElementById('savePassword');
  const randomizer = document.getElementById('randomizer');
  const passwordList = document.getElementById('passwordList');

  // Generate random password
  function generateRandomPassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*+-_=?';
    
    let result = '';
    
    // Ensure at least one of each type
    result += lowercase[Math.floor(Math.random() * lowercase.length)];
    result += uppercase[Math.floor(Math.random() * uppercase.length)];
    result += numbers[Math.floor(Math.random() * numbers.length)];
    result += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly (6 more characters for total of 10)
    const allChars = lowercase + uppercase + numbers + special;
    for(let i = 0; i < 6; i++) {
      result += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return result.split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }

  // Randomizer button handler
  randomizer.addEventListener('click', () => {
    const randomPassword = generateRandomPassword();
    password.value = randomPassword;
    // Show the password briefly
    password.type = 'text';
    setTimeout(() => {
      password.type = 'password';
    }, 2000); // Show for 2 seconds
  });

  // Switch between login and register forms
  showRegister.addEventListener('click', () => {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
  });

  showLogin.addEventListener('click', () => {
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  });

  // Register handler
  registerBtn.addEventListener('click', async () => {
    if (!registerUsername.value || !registerPassword.value || !confirmPassword.value) {
      alert('Please fill in all fields!');
      return;
    }

    if (registerPassword.value !== confirmPassword.value) {
      alert('Passwords do not match!');
      return;
    }

    if (registerPassword.value.length < 8) {
      alert('Password must be at least 8 characters!');
      return;
    }

    // Check if username already exists
    chrome.storage.sync.get(['users'], async (result) => {
      const users = result.users || {};
      
      if (users[registerUsername.value]) {
        alert('Username already exists!');
        return;
      }

      // Hash the password before storing
      const salt = await pm.generateSalt();
      const hashedPassword = await pm.hashMasterPassword(registerPassword.value, salt);
      
      users[registerUsername.value] = {
        password: hashedPassword,
        salt: salt
      };

      chrome.storage.sync.set({ users }, () => {
        alert('Registration successful! Please login.');
        registerSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        registerUsername.value = '';
        registerPassword.value = '';
        confirmPassword.value = '';
      });
    });
  });

  // Login handler
  loginBtn.addEventListener('click', async () => {
    if (!loginUsername.value || !loginPassword.value) {
      alert('Please fill in all fields!');
      return;
    }

    chrome.storage.sync.get(['users'], async (result) => {
      const users = result.users || {};
      const user = users[loginUsername.value];

      if (!user) {
        alert('Invalid username or password!');
        return;
      }

      const hashedPassword = await pm.hashMasterPassword(loginPassword.value, user.salt);
      
      if (hashedPassword !== user.password) {
        alert('Invalid username or password!');
        return;
      }

      masterKey = hashedPassword;
      loginSection.classList.add('hidden');
      managerSection.classList.remove('hidden');
      loadPasswords();
    });
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    masterKey = null;
    loginUsername.value = '';
    loginPassword.value = '';
    managerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  });

  // Save password handler
  savePassword.addEventListener('click', async () => {
    if (!website.value || !password.value) {
      alert('Please fill in all fields!');
      return;
    }

    const encrypted = await pm.encrypt(password.value, masterKey);
    
    // Store in Chrome storage
    chrome.storage.sync.get(['passwords'], (result) => {
      const passwords = result.passwords || {};
      passwords[website.value] = encrypted;
      
      chrome.storage.sync.set({ passwords }, () => {
        alert('Password saved!');
        loadPasswords();
        website.value = '';
        password.value = '';
      });
    });
  });

  // Load stored passwords
  function loadPasswords() {
    chrome.storage.sync.get(['passwords'], (result) => {
      const passwords = result.passwords || {};
      passwordList.innerHTML = '';
      
      Object.keys(passwords).forEach(site => {
        const div = document.createElement('div');
        div.className = 'password-item';
        
        const websiteName = document.createElement('span');
        websiteName.className = 'website-name';
        websiteName.textContent = site;
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        
        const showBtn = document.createElement('button');
        showBtn.textContent = 'Show';
        showBtn.className = 'show-btn';
        showBtn.onclick = () => {
          const encrypted = passwords[site];
          alert(`Transformed password for ${site}: ${encrypted.data}`);
        };
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete-btn';
        deleteBtn.onclick = () => {
          if (confirm(`Are you sure you want to delete the password for ${site}?`)) {
            delete passwords[site];
            chrome.storage.sync.set({ passwords }, loadPasswords);
          }
        };
        
        buttonGroup.appendChild(showBtn);
        buttonGroup.appendChild(deleteBtn);
        
        div.appendChild(websiteName);
        div.appendChild(buttonGroup);
        passwordList.appendChild(div);
      });
    });
  }
}); 