# Admin User Creation Scripts

## How Password Hashing Works

The `User` model has a **pre-save hook** that automatically hashes passwords using bcrypt:

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

**This means:**
1. ✅ When you create a user through the model, the password is automatically hashed
2. ✅ The hashed password is stored in the database
3. ✅ During login, `matchPassword()` compares the plain password with the hash
4. ❌ You CANNOT insert plain passwords directly into MongoDB

## Creating Admin Users

### Method 1: Using the Script (Recommended)

1. **Edit the script** `createAdmin.js`:
   ```javascript
   const adminData = {
     name: 'Your Name',
     email: 'youremail@example.com',
     password: 'your-password', // Will be hashed automatically
     role: 'admin',
     department: 'Management',
     isEmailVerified: true,
     isActive: true
   };
   ```

2. **Run the script**:
   ```bash
   cd server/scripts
   node createAdmin.js
   ```

3. **Login** with the email and password you specified

### Method 2: MongoDB Shell (Advanced)

If you want to insert directly via MongoDB shell, you need to hash the password first:

```javascript
// In Node.js console or separate script
const bcrypt = require('bcryptjs');
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash('your-password', salt);
console.log(hashedPassword);
```

Then insert into MongoDB:
```javascript
db.users.insertOne({
  name: "Admin User",
  email: "admin@example.com",
  password: "$2a$10$hashed_password_string_here",
  role: "admin",
  department: "Management",
  isEmailVerified: true,
  isActive: true,
  createdAt: new Date()
})
```

## Create Multiple Admins

Modify `createAdmin.js` to loop through an array:

```javascript
const admins = [
  {
    name: 'Admin 1',
    email: 'admin1@internsync.com',
    password: 'admin123',
    department: 'HR'
  },
  {
    name: 'Admin 2',
    email: 'admin2@internsync.com',
    password: 'admin456',
    department: 'Engineering'
  }
];

for (const adminData of admins) {
  await User.create({ ...adminData, role: 'admin', isEmailVerified: true });
}
```

## Login Flow with Hashed Passwords

1. User enters email and password in login form
2. Backend finds user by email
3. Backend calls `user.matchPassword(enteredPassword)`
4. `matchPassword` uses bcrypt to compare:
   ```javascript
   return await bcrypt.compare(enteredPassword, this.password);
   ```
5. If match, generate JWT token and login succeeds

**The magic**: bcrypt can verify if a plain password matches a hash without needing to decrypt the hash!
