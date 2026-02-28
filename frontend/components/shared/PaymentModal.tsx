"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, QrCode, Wallet } from "lucide-react";
import Image from "next/image";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  rideId: string;
  onPaymentSuccess: () => void;
  walletBalance: number;
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  rideId,
  onPaymentSuccess,
  walletBalance,
}: PaymentModalProps) {
  const [showQR, setShowQR] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [qrData, setQrData] = useState("");

  useEffect(() => {
    if (showQR) {
      // Generate QR code data (fake QR code URL)
      const qrInfo = `RIDESWIFT_PAY:${rideId}:${amount}:${Date.now()}`;
      setQrData(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrInfo)}`);
      
      // Auto-process payment after 3 seconds (simulating QR scan)
      const timer = setTimeout(() => {
        processPayment();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showQR, rideId, amount]);

  const processPayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setPaymentComplete(true);
      setIsProcessing(false);
      
      // Call success callback after showing confirmation
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 1500);
  };

  const handlePayWithWallet = () => {
    if (walletBalance < amount) {
      return; // Insufficient balance
    }
    setShowQR(true);
  };

  if (!isOpen) return null;

  const isPendingRide = rideId === "pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-dark-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-cyber-dark-800 rounded-2xl border-2 border-cyber-purple-500 shadow-neon-lg w-full max-w-md relative overflow-hidden">
        {/* Close button */}
        {!paymentComplete && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cyber-purple-400 hover:text-cyber-green-500 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Animated orbs background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-32 h-32 bg-cyber-purple-500/20 rounded-full blur-3xl -top-16 -left-16 animate-neonPulse" />
          <div className="absolute w-32 h-32 bg-cyber-green-500/20 rounded-full blur-3xl -bottom-16 -right-16 animate-neonPulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative p-6">
          {!showQR && !paymentComplete && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-cyber-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyber-purple-500 shadow-neon">
                  <Wallet className="w-8 h-8 text-cyber-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 font-orbitron">
                  {isPendingRide ? 'Pay to Book Ride' : 'Complete Payment'}
                </h2>
                <p className="text-cyber-purple-400 text-sm">
                  {isPendingRide ? 'Secure your ride with advance payment' : 'Your ride has been completed'}
                </p>
              </div>

              {/* Amount */}
              <div className="bg-cyber-dark-900/50 rounded-xl p-6 mb-6 border border-cyber-purple-500/30">
                <p className="text-cyber-purple-400 text-sm mb-1 text-center">
                  Total Amount
                </p>
                <p className="text-4xl font-bold text-cyber-green-500 text-center font-orbitron">
                  ${amount.toFixed(2)}
                </p>
              </div>

              {/* Wallet Balance */}
              <div className="bg-cyber-purple-500/10 rounded-lg p-4 mb-6 border border-cyber-purple-500/30">
                <div className="flex justify-between items-center">
                  <span className="text-cyber-purple-400 text-sm">Wallet Balance</span>
                  <span className="text-cyber-green-500 font-bold font-orbitron">
                    ${walletBalance.toFixed(2)}
                  </span>
                </div>
                {walletBalance < amount && (
                  <p className="text-cyber-pink-500 text-xs mt-2">
                    Insufficient balance. Please top up your wallet.
                  </p>
                )}
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayWithWallet}
                disabled={walletBalance < amount}
                className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 font-orbitron ${
                  walletBalance >= amount
                    ? 'bg-cyber-green-500 text-cyber-dark-900 hover:bg-cyber-green-600 shadow-neon-green border-2 border-cyber-green-500'
                    : 'bg-cyber-dark-700 text-cyber-purple-400 cursor-not-allowed border-2 border-cyber-dark-600'
                }`}
              >
                {walletBalance >= amount ? 'Scan QR to Pay' : 'Insufficient Balance'}
              </button>
            </>
          )}

          {showQR && !paymentComplete && (
            <div className="text-center">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-white mb-2 font-orbitron">
                  {isProcessing ? 'Processing Payment...' : 'Scan QR Code'}
                </h2>
                <p className="text-cyber-purple-400 text-sm">
                  {isProcessing ? 'Please wait...' : 'Scan with any UPI app to pay'}
                </p>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl p-4 mb-4 inline-block border-4 border-cyber-purple-500 shadow-neon">
                {qrData ? (
                  <Image
                    src={qrData}
                    alt="Payment QR Code"
                    width={200}
                    height={200}
                    className={isProcessing ? 'opacity-50' : ''}
                  />
                ) : (
                  <div className="w-[200px] h-[200px] flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-cyber-purple-500 animate-pulse" />
                  </div>
                )}
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-cyber-green-500">
                  <div className="w-2 h-2 bg-cyber-green-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cyber-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-cyber-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              )}

              {!isPendingRide && (
                <p className="text-cyber-purple-400 text-xs mt-4">
                  Ride ID: {rideId}
                </p>
              )}
            </div>
          )}

          {paymentComplete && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-cyber-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-cyber-green-500 shadow-neon-green animate-fade-in">
                <CheckCircle className="w-12 h-12 text-cyber-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-cyber-green-500 mb-2 font-orbitron">
                Payment Successful!
              </h2>
              <p className="text-cyber-purple-400 text-sm mb-4">
                {isPendingRide 
                  ? `Ride payment of $${amount.toFixed(2)} confirmed` 
                  : `$${amount.toFixed(2)} deducted from your wallet`}
              </p>
              <p className="text-cyber-green-500/70 text-xs">
                {isPendingRide ? 'Finding nearby drivers...' : 'Ride completed successfully'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
