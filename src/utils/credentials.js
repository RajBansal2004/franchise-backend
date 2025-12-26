exports.generateDSId = (fullName, mobile) => {
  const parts = fullName.trim().split(' ');
  const first = parts[0][0].toUpperCase();
  const last =
    parts.length > 1
      ? parts[parts.length - 1][0].toUpperCase()
      : first;

  return `${first}${last}${mobile}`;
};

exports.generateFranchiseId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$';
  let id = '';
  for (let i = 0; i < 12; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
};

exports.generatePassword = () => {
  return Math.random().toString(36).slice(-8) + '@1';
};
