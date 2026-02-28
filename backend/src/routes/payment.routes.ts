import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as paymentController from "../controllers/payment.controller";
import { paymentRateLimiter } from "../middleware/rateLimiter.middleware";

const router = Router();

// Stripe webhook – raw body, no auth
router.post("/webhook", paymentController.stripeWebhook);

// All other payment routes require auth
router.use(authenticate);

router.post("/create-intent", paymentRateLimiter, paymentController.createPaymentIntent);
router.get("/cards",            paymentController.getSavedCards);
router.post("/cards",           paymentController.addCard);
router.delete("/cards/:id",     paymentController.removeCard);
router.get("/transactions",     paymentController.getTransactions);
router.get("/receipt/:rideId",  paymentController.getReceipt);
router.post("/receipt/:rideId/resend", paymentController.resendReceipt);
router.get("/wallet/balance",   paymentController.getWalletBalance);
router.post("/wallet/topup",    paymentController.topUpWallet);
router.post("/wallet/deduct",   paymentController.deductFromWallet);
router.post("/process-ride",    paymentController.processRidePayment);

export default router;
