exports.calculateCommission = (totalAmount, percent) => {
  const amount = (totalAmount * percent) / 100;
  return { amount, percent };
};
