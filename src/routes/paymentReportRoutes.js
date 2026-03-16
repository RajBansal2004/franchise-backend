const router = require("express").Router();
const ctrl = require("../controllers/paymentReportController");
const auth = require("../middlewares/auth.middleware");
const permit = require("../middlewares/role.middleware");

router.get(
 "/admin/payment-reports",
 auth,
 permit("ADMIN"),
 ctrl.getAllPaymentReports
);

router.put(
 "/admin/payment-verify/:id",
 auth,
 permit("ADMIN"),
 ctrl.verifyPayment
);

router.get(
 "/franchise/my-income",
 auth,
 permit("FRANCHISE"),
 ctrl.getMyIncomeReport
);

module.exports = router;