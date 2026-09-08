const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function seedHRUser() {
  const email = String(process.env.HR_EMAIL || 'hr@attendance.local').trim().toLowerCase();
  const password = String(process.env.HR_PASSWORD || 'HR@12345');
  const name = String(process.env.HR_NAME || 'HR Administrator').trim();

  let user = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 12);

  if (!user) {
    user = await User.create({
      name,
      email,
      password: passwordHash,
      role: 'HR',
      casualLeaveBalance: 12
    });
    console.log(`HR account seeded: ${email}`);
  } else {
    const needsReset = user.role !== 'HR' || !(await bcrypt.compare(password, user.password));
    user.name = name;
    user.role = 'HR';
    if (needsReset) user.password = passwordHash;
    await user.save();
    console.log(`HR account ready: ${email}`);
  }

  return { email, password };
}

module.exports = { seedHRUser };
