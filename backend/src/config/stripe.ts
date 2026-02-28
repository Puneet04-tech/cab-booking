import Stripe from "stripe";
import logger from "../utils/logger";

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY is not set. Payment features will not work.");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2023-10-16",
  appInfo: {
    name: "RideSwift",
    version: "1.0.0",
  },
});

export default stripe;
