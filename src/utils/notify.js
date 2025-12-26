exports.sendCredentials = async (mobile, message) => {
  console.log(`📩 SMS to ${mobile}: ${message}`);
};

exports.sendEmail = async (email, message) => {
  console.log(`📧 Email to ${email}: ${message}`);
};
