"use client";

import { useState } from "react";
import { MessageCircle, Phone, ChevronDown, ChevronUp, Send } from "lucide-react";
import toast from "react-hot-toast";

const faqs = [
  { q: "How do I cancel a ride?", a: "Open your active ride, tap 'Cancel Ride', and confirm. Cancellation fees may apply if the driver is already en route." },
  { q: "What payment methods are accepted?", a: "We accept all major credit/debit cards (via Stripe), wallet balance, and cash for selected ride types." },
  { q: "How do I get a receipt?", a: "Receipts are automatically emailed after each completed ride. You can also download them from the Ride History page." },
  { q: "What if I left something in the car?", a: "Contact the driver directly through the app within 24 hours of your ride, or submit a lost item report to our support team." },
  { q: "How are fares calculated?", a: "Fares are based on distance, time, ride type, and demand (surge pricing). You'll always see the estimate before booking." },
  { q: "How do I report a safety issue?", a: "Use the SOS button during a ride, or visit Help & Support after your ride to submit a safety report. We treat all safety reports as highest priority." },
];

const categories = ["Payment Issue", "Ride Issue", "Driver Complaint", "Account Issue", "Lost Item", "Other"];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketForm, setTicketForm] = useState({ category: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!ticketForm.category || !ticketForm.subject || !ticketForm.message) {
      toast.error("Please fill all fields");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    toast.success("Support ticket submitted! We'll respond within 24 hours.");
    setTicketForm({ category: "", subject: "", message: "" });
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h2 className="section-title">Help & Support</h2>
        <p className="section-subtitle">Find answers or contact our support team.</p>
      </div>

      {/* Quick Contact */}
      <div className="grid grid-cols-2 gap-4">
        <a href="tel:+18007433798" className="card-hover flex items-center gap-3 text-cyber-green-400">
          <div className="w-10 h-10 bg-cyber-green-500/20 rounded-xl flex items-center justify-center">
            <Phone className="w-5 h-5 text-cyber-green-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Call Support</p>
            <p className="text-xs text-cyber-purple-400">24/7 helpline</p>
          </div>
        </a>
        <button className="card-hover flex items-center gap-3 text-cyber-purple-400 text-left">
          <div className="w-10 h-10 bg-cyber-purple-500/20 rounded-xl flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-cyber-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Live Chat</p>
            <p className="text-xs text-cyber-purple-400">Avg. 2 min response</p>
          </div>
        </button>
      </div>

      {/* FAQ */}
      <div className="card">
        <h3 className="font-semibold font-orbitron text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="font-medium text-gray-900 text-sm">{faq.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Support Ticket */}
      <div className="card space-y-4">
        <h3 className="font-semibold text-gray-900">Submit a Ticket</h3>
        <p className="text-sm text-gray-500">
          Can&apos;t find your answer? Send us a detailed message and we&apos;ll get back to you.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            value={ticketForm.category}
            onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
            className="input-field"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            value={ticketForm.subject}
            onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
            className="input-field"
            placeholder="Brief description of your issue"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            value={ticketForm.message}
            onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
            className="input-field resize-none"
            rows={5}
            placeholder="Describe your issue in detail…"
          />
        </div>

        <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2">
          {submitting ? (
            <span className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {submitting ? "Submitting…" : "Submit Ticket"}
        </button>
      </div>
    </div>
  );
}
