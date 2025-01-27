document.getElementById('signupForm').addEventListener('submit', async function (event) {
    event.preventDefault(); // Prevent form submission
  
    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
  
    // Check if passwords match
    if (passwordField.value !== confirmPasswordField.value) {
      alert('Passwords do not match!');
      return;
    }
  
    // Hash the password
    const hashedPassword = await hashPassword(passwordField.value);
  
    // Create a hidden input field to send the hashed password
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = 'hashedPassword';
    hiddenInput.value = hashedPassword;
  
    // Add the hidden input to the form and clear plain text password
    const form = document.getElementById('signupForm');
    form.appendChild(hiddenInput);
    passwordField.value = '';
    confirmPasswordField.value = '';
  
    // Submit the form
    form.submit();
  });
  
  // Function to hash the password using SHA-256
  async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }
  