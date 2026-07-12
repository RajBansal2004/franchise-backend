module.exports = function applyIncome(user, amount) {

    if (amount <= 0) {
        return 0;
    }

    let cap = Infinity;

    if (user.activationBP === 51)
        cap = 100000;

    if (user.activationBP === 101)
        cap = 150000;

    let payable = amount;

    if (user.totalIncome >= cap) {

        payable = 0;

    }
    else if (user.totalIncome + payable > cap) {

        payable = cap - user.totalIncome;

    }

    if (payable < 0)
        payable = 0;

    return payable;

};