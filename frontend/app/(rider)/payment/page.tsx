"use client";

import { useState, useEffect } from "react";
import { CreditCard, Plus, Trash2, Lock, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import toast from "react-hot-toast";
import { paymentApi } from "@/lib/api";

interface SavedCard {
  id: number;
  last4: string;
  brand: string;
  expiry_month: number;
  expiry_year: number;
  is_default: boolean;
}

interface Transaction {
  ride_id: string;
  pickup_address: string;
  dropoff_address: string;
  final_fare: string | null;
  estimated_fare: string;
  payment_method: string;
  completed_at: string | null;
  created_at: string;
  status: string;
}

export default function PaymentPage() {
  const [walletBalance, setWalletBalance] = useState(0);
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [balanceRes, cardsRes, transactionsRes] = await Promise.all([
        paymentApi.getWalletBalance(),
        paymentApi.getSavedCards(),
        paymentApi.getTransactions(),
      ]);

      setWalletBalance(balanceRes.data?.data?.balance ?? 0);
      // Ensure cards is always an array
      const cardsData = Array.isArray(cardsRes.data?.data) 
        ? cardsRes.data.data 
        : [];
      setCards(cardsData);
      // Ensure transactions is always an array
      const transactionsData = Array.isArray(transactionsRes.data?.data)
        ? transactionsRes.data.data
        : [];
      setTransactions(transactionsData);
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to load payment data");
      // Set defaults on error
      setWalletBalance(0);
      setCards([]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeCard = async (id: number) => {
    try {
      await paymentApi.removeCard(String(id));
      setCards(cards.filter((c) => c.id !== id));
      toast.success("Card removed");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to remove card");
    }
  };

  const handleAddCard = async () => {
    if (!newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name) {
      toast.error("Please fill all card details");
      return;
    }
    
    try {
      const response = await paymentApi.addCard(newCard);
      const savedCard = response.data?.data;
      
      // Add the new card to the list
      if (savedCard) {
        setCards([...cards, savedCard]);
      }
      
      toast.success("Card added successfully");
      setShowAddCard(false);
      setNewCard({ number: "", expiry: "", cvv: "", name: "" });
      
      // Refresh cards to ensure consistency
      await fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to add card");
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount <= 0 || amount > 10000) {
      toast.error("Please enter a valid amount (max $10,000)");
      return;
    }

    try {
      const response = await paymentApi.topUpWallet(amount);
      const newBalance = response.data?.data?.balance ?? walletBalance + amount;
      setWalletBalance(newBalance);
      toast.success(`✓ Wallet topped up by $${amount.toFixed(2)}`);
      setShowTopUp(false);
      setTopUpAmount("");
      
      // Refresh data to ensure consistency
      await fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to top up wallet");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getTransactionDescription = (tx: Transaction) => {
    if (tx.status === "cancelled") {
      return `Cancelled – ${tx.pickup_address.split(",")[0]}`;
    }
    return `Ride – ${tx.pickup_address.split(",")[0]}`;
  };

  const getTransactionAmount = (tx: Transaction) => {
    const fare = parseFloat(tx.final_fare || tx.estimated_fare || "0");
    return tx.payment_method === "wallet" ? -fare : fare;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-purple-500 mx-auto shadow-neon"></div>
          <p className="mt-4 text-cyber-purple-400">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="section-title">Payments & Wallet</h2>
        <p className="section-subtitle">Manage your payment methods and view transaction history.</p>
      </div>

      {/* Wallet */}
      <div className="bg-gradient-to-r from-cyber-purple-600 via-cyber-pink-500 to-cyber-green-500 rounded-2xl p-6 text-white shadow-neon-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.2)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />
        <div className="relative z-10">
          <p className="text-white/80 text-sm mb-1 font-orbitron">Available Balance</p>
          <p className="text-4xl font-bold font-orbitron mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">${(walletBalance ?? 0).toFixed(2)}</p>
        
        {!showTopUp ? (
          <div className="flex gap-3">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Top Up
            </button>
            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors opacity-50 cursor-not-allowed">
              Withdraw
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter amount ($10 - $10,000)"
                className="flex-1 px-4 py-2 rounded-xl bg-white/20 border-2 border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50"
                min="10"
                max="10000"
                step="10"
              />
            </div>
            <div className="flex gap-2">
              {[50, 100, 200, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopUpAmount(String(amt))}
                  className="flex-1 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTopUp}
                className="flex-1 bg-white text-primary-600 hover:bg-white/90 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Confirm Top Up
              </button>
              <button
                onClick={() => {
                  setShowTopUp(false);
                  setTopUpAmount("");
                }}
                className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Saved Cards */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-orbitron text-white">Saved Cards</h3>
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="flex items-center gap-1 text-sm text-cyber-purple-400 hover:text-cyber-purple-300 hover:drop-shadow-[0_0_5px_rgba(123,63,242,0.6)] font-medium transition-all duration-300"
          >
            <Plus className="w-4 h-4" /> Add Card
          </button>
        </div>

        <div className="space-y-3">
          {cards.length === 0 ? (
            <p className="text-center text-cyber-purple-400 py-4">No saved cards yet</p>
          ) : (
            cards.map((card) => (
              <div key={card.id} className="flex items-center gap-3 p-3 bg-cyber-dark-800/50 rounded-xl border border-cyber-purple-500/20">
                <div className="w-10 h-10 bg-cyber-purple-500/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-cyber-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {card.brand} •••• {card.last4}
                  </p>
                  <p className="text-xs text-cyber-purple-400">
                    Expires {String(card.expiry_month).padStart(2, "0")}/{String(card.expiry_year).slice(-2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {card.is_default && <span className="badge badge-success text-xs">Default</span>}
                  <button onClick={() => removeCard(card.id)} className="text-cyber-purple-400 hover:text-cyber-pink-400 transition-colors duration-300">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {showAddCard && (
          <div className="mt-4 pt-4 border-t border-cyber-purple-500/20 space-y-3">
            <div className="flex items-center gap-2 text-sm text-cyber-green-400 mb-3">
              <Lock className="w-4 h-4 text-cyber-green-400" />
              <span>Secured by Stripe – we never store card details</span>
            </div>
            <input
              value={newCard.name}
              onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
              placeholder="Cardholder Name"
              className="input-field"
            />
            <input
              value={newCard.number}
              onChange={(e) => setNewCard({ ...newCard, number: e.target.value })}
              placeholder="Card Number (e.g. 4242 4242 4242 4242)"
              className="input-field"
              maxLength={19}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={newCard.expiry}
                onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                placeholder="MM/YY"
                className="input-field"
              />
              <input
                value={newCard.cvv}
                onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value })}
                placeholder="CVV"
                className="input-field"
                maxLength={4}
                type="password"
              />
            </div>
            <button onClick={handleAddCard} className="btn-primary w-full">
              Add Card Securely
            </button>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="card">
        <h3 className="font-semibold font-orbitron text-white mb-4">Transaction History</h3>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-cyber-purple-400 py-4">No transactions yet</p>
          ) : (
            transactions.slice(0, 10).map((tx) => {
              const amount = getTransactionAmount(tx);
              const isCredit = amount > 0;
              const date = formatDate(tx.completed_at || tx.created_at);
              const desc = getTransactionDescription(tx);

              return (
                <div key={tx.ride_id} className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isCredit ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {isCredit ? (
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{desc}</p>
                    <p className="text-xs text-gray-400">{date}</p>
                  </div>
                  <p
                    className={`font-semibold text-sm flex-shrink-0 ${
                      isCredit ? "text-green-600" : "text-gray-900"
                    }`}
                  >
                    {isCredit ? "+" : "-"}${Math.abs(amount).toFixed(2)}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
