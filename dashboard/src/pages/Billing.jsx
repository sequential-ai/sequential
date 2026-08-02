import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  CreditCard,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart2,
  Download,
  Wifi,
  Sparkles,
  Check,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

const INITIAL_INVOICES = [
  {
    id: 'INV-2026-0081',
    date: 'Aug 1, 2026',
    description: 'Developer Pro Plan - Monthly Renewal',
    amount: '$49.00',
    status: 'Paid',
    pdfUrl: '#',
  },
  {
    id: 'INV-2026-0045',
    date: 'Jul 1, 2026',
    description: 'Developer Pro Plan - Monthly Renewal',
    amount: '$49.00',
    status: 'Paid',
    pdfUrl: '#',
  },
  {
    id: 'INV-2026-0012',
    date: 'Jun 15, 2026',
    description: 'Credit Top-Up (10,000 Credits)',
    amount: '$50.00',
    status: 'Paid',
    pdfUrl: '#',
  },
]

// Reusable Realistic Virtual Credit Card Component
function VirtualCreditCard({ card, onRemove, onSetDefault }) {
  const isVisa = card.brand?.toLowerCase() === 'visa' || !card.brand
  const isMastercard = card.brand?.toLowerCase() === 'mastercard'

  return (
    <div className="relative group w-full max-w-sm">
      {/* 3D Glass Titanium Card */}
      <div className="relative aspect-[1.586/1] w-full rounded-2xl p-5 sm:p-6 bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-800 text-white shadow-xl border border-zinc-700/60 overflow-hidden flex flex-col justify-between transition-all duration-300 group-hover:shadow-2xl group-hover:border-primary/50 group-hover:-translate-y-0.5">
        
        {/* Holographic Gloss Sheen */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/30 pointer-events-none" />
        <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

        {/* Card Header: Brand & Contactless */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-widest font-bold text-zinc-300">
              Sequential Card
            </span>
            {card.isDefault && (
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 text-[9px] font-mono font-semibold uppercase">
                Default
              </span>
            )}
          </div>
          <Wifi className="h-4 w-4 text-zinc-400 rotate-90" />
        </div>

        {/* EMV Brass Smart Chip */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-300/50 shadow-inner flex flex-col justify-around px-1 py-0.5">
            <div className="w-full h-px bg-amber-800/40" />
            <div className="w-full h-px bg-amber-800/40" />
          </div>
        </div>

        {/* Embossed Card Number */}
        <div className="relative z-10 font-mono text-lg sm:text-xl tracking-[0.22em] font-semibold text-zinc-100 drop-shadow-sm">
          •••• &nbsp;•••• &nbsp;•••• &nbsp;{card.last4 || '4242'}
        </div>

        {/* Card Footer: Holder, Expiry & Card Network Badge */}
        <div className="flex items-end justify-between relative z-10">
          <div className="space-y-0.5">
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-mono block">
              Cardholder
            </span>
            <span className="font-mono text-xs uppercase font-semibold text-zinc-200 tracking-wider">
              {card.holderName || 'WORKSPACE ADMIN'}
            </span>
          </div>

          <div className="space-y-0.5 text-center">
            <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-mono block">
              Expires
            </span>
            <span className="font-mono text-xs font-semibold text-zinc-200">
              {card.expiry || '12/28'}
            </span>
          </div>

          {/* Network Logo */}
          <div className="flex items-center font-bold text-sm font-sans tracking-tight">
            {isMastercard ? (
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-red-500/90" />
                <div className="w-6 h-6 rounded-full bg-amber-500/90" />
              </div>
            ) : (
              <span className="italic font-black text-base text-zinc-100 tracking-wider">
                VISA
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Controls below Card */}
      <div className="flex items-center justify-between pt-2 px-1 text-xs">
        {!card.isDefault ? (
          <button
            type="button"
            onClick={() => onSetDefault && onSetDefault(card.id)}
            className="text-muted-foreground hover:text-foreground text-[11px] font-medium cursor-pointer transition-colors"
          >
            Set as default
          </button>
        ) : (
          <span className="text-emerald-500 text-[11px] font-medium flex items-center gap-1">
            <Check className="h-3 w-3" /> Active default
          </span>
        )}

        <button
          type="button"
          onClick={() => onRemove && onRemove(card.id)}
          className="text-destructive/80 hover:text-destructive text-[11px] font-medium cursor-pointer transition-colors flex items-center gap-1"
        >
          <Trash2 className="h-3 w-3" /> Remove
        </button>
      </div>
    </div>
  )
}

export default function Billing() {
  const { org } = useAuth()
  const orgName = org?.name || 'Gmail'

  // Tab State: 'overview' | 'payment_methods' | 'billing_history'
  const [activeTab, setActiveTab] = useState('overview')

  // Show balance details toggle
  const [showBalanceDetails, setShowBalanceDetails] = useState(false)

  // Current balance dollars calculation
  const [balanceAmount, setBalanceAmount] = useState(19.93)

  // Auto-reload state
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false)
  const [autoReloadThreshold, setAutoReloadThreshold] = useState('5.00')
  const [autoReloadAmount, setAutoReloadAmount] = useState('20.00')

  // Modals state
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState(false)
  const [selectedTopUpAmount, setSelectedTopUpAmount] = useState(25)
  const [customTopUpAmount, setCustomTopUpAmount] = useState('')

  const [isAutoReloadOpen, setIsAutoReloadOpen] = useState(false)
  const [isAddPaymentMethodOpen, setIsAddPaymentMethodOpen] = useState(false)

  // Payment methods list with initial card
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: 'card_default_1',
      brand: 'Visa',
      last4: '4242',
      holderName: `${orgName.toUpperCase()} ADMIN`,
      expiry: '08/29',
      isDefault: true,
    },
  ])

  // New card form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [cardZip, setCardZip] = useState('')

  // Handle Add Balance
  const handleAddBalanceSubmit = (e) => {
    e.preventDefault()
    const amountToAdd = customTopUpAmount ? parseFloat(customTopUpAmount) : selectedTopUpAmount
    if (isNaN(amountToAdd) || amountToAdd <= 0) return

    setBalanceAmount((prev) => parseFloat((prev + amountToAdd).toFixed(2)))
    setIsAddBalanceOpen(false)
    setCustomTopUpAmount('')
  }

  // Handle Add Payment Method
  const handleAddCardSubmit = (e) => {
    e.preventDefault()
    if (!cardNumber) return

    const cleanNum = cardNumber.replace(/\s+/g, '')
    const last4 = cleanNum.slice(-4) || '4242'
    const newCard = {
      id: `card_${Date.now()}`,
      brand: cleanNum.startsWith('5') ? 'Mastercard' : 'Visa',
      last4,
      holderName: cardHolder.toUpperCase() || 'WORKSPACE ADMIN',
      expiry: cardExpiry || '12/28',
      isDefault: paymentMethods.length === 0,
    }

    setPaymentMethods([...paymentMethods, newCard])
    setIsAddPaymentMethodOpen(false)
    setCardNumber('')
    setCardHolder('')
    setCardExpiry('')
    setCardCvc('')
    setCardZip('')
  }

  const handleRemoveCard = (cardId) => {
    setPaymentMethods(paymentMethods.filter((c) => c.id !== cardId))
  }

  const handleSetDefaultCard = (cardId) => {
    setPaymentMethods(
      paymentMethods.map((c) => ({
        ...c,
        isDefault: c.id === cardId,
      }))
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing</h1>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-6 border-b border-border/80 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`text-xs font-semibold pb-2.5 transition-colors cursor-pointer relative ${
            activeTab === 'overview'
              ? 'text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payment_methods')}
          className={`text-xs font-semibold pb-2.5 transition-colors cursor-pointer relative ${
            activeTab === 'payment_methods'
              ? 'text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Payment methods
          {activeTab === 'payment_methods' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('billing_history')}
          className={`text-xs font-semibold pb-2.5 transition-colors cursor-pointer relative ${
            activeTab === 'billing_history'
              ? 'text-foreground font-bold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Billing History
          {activeTab === 'billing_history' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />
          )}
        </button>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Card 1: Balance Card */}
          <Card className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">
                {orgName}'s Balance
              </span>
              <div className="text-4xl font-bold font-mono tracking-tight text-foreground">
                ${balanceAmount.toFixed(2)}
              </div>
            </div>

            {/* Show details collapsible */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
              >
                Show details
                {showBalanceDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              {showBalanceDetails && (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-2 max-w-md">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Prepaid balance:</span>
                    <span className="font-mono font-medium text-foreground">${balanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Active credits:</span>
                    <span className="font-mono font-medium text-foreground">
                      {Math.round(balanceAmount * 160).toLocaleString()} credits
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Promotional / Grant credits:</span>
                    <span className="font-mono font-medium text-foreground">$0.00</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Expiring credits:</span>
                    <span className="font-mono font-medium text-foreground">None</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              {/* Add to balance */}
              <Button
                size="sm"
                onClick={() => setIsAddBalanceOpen(true)}
                className="rounded-lg h-8 px-4 text-xs font-semibold text-white dark:text-zinc-900 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 shadow-xs cursor-pointer"
              >
                Add to balance
              </Button>

              {/* Auto-reload Off/On Pill */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAutoReloadOpen(true)}
                className="rounded-lg h-8 px-3 text-xs font-medium border-border/80 hover:bg-muted cursor-pointer flex items-center gap-2"
              >
                <span>Auto-reload</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[11px] font-mono text-muted-foreground uppercase font-semibold">
                  {autoReloadEnabled ? 'On' : 'Off'}
                </span>
              </Button>

              {/* Analytics / Usage Icon Button */}
              <Button
                asChild
                variant="outline"
                size="icon"
                className="rounded-lg h-8 w-8 border-border/80 hover:bg-muted cursor-pointer"
                title="View Usage & Analytics"
              >
                <a href="/dashboard/tasks">
                  <BarChart2 className="h-4 w-4 text-muted-foreground" />
                </a>
              </Button>
            </div>
          </Card>

          {/* Section 2: Payment Methods */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Payment methods</h2>
              <a
                href="https://billing.stripe.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer font-normal"
              >
                Update billing information on Stripe
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Orange Alert Banner */}
            <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3.5 flex items-center gap-3 text-xs text-orange-600 dark:text-orange-400 font-medium">
              <CreditCard className="h-4 w-4 shrink-0 text-orange-500" />
              <span>
                <strong>Add a payment method</strong> to become eligible for free monthly credits
              </span>
            </div>

            {/* Render Saved Virtual Cards */}
            {paymentMethods.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {paymentMethods.map((pm) => (
                  <VirtualCreditCard
                    key={pm.id}
                    card={pm}
                    onRemove={handleRemoveCard}
                    onSetDefault={handleSetDefaultCard}
                  />
                ))}
              </div>
            )}

            {/* Add a payment method trigger */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAddPaymentMethodOpen(true)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 cursor-pointer font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                Add a payment method
              </button>
            </div>
          </div>

          {/* Section 3: Task API */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">Task API</h2>
            </div>

            <Card className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">Developer Pro Plan</h3>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes 10,000 monthly synthesis credits, 8 parallel research workers, and priority DAG execution.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xl font-bold font-mono text-foreground">$49.00<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
                  <span className="text-[11px] text-muted-foreground">Renews on Sep 1, 2026</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60 text-xs">
                <div className="p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Task Unit Cost</span>
                  <span className="font-semibold text-foreground mt-0.5 block font-mono">$0.0062 / step</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Worker Concurrency</span>
                  <span className="font-semibold text-foreground mt-0.5 block font-mono">8 Concurrent Nodes</span>
                </div>
                <div className="p-3 rounded-xl bg-muted/30">
                  <span className="text-muted-foreground block text-[11px]">Rate Limit</span>
                  <span className="font-semibold text-foreground mt-0.5 block font-mono">120 req / min</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Payment Methods Tab */}
      {activeTab === 'payment_methods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">Saved Payment Methods</h2>
              <p className="text-xs text-muted-foreground">Manage your active billing cards and payment preferences.</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsAddPaymentMethodOpen(true)}
              className="rounded-lg h-8 px-3 text-xs text-white font-semibold shadow-xs"
              style={{ background: 'var(--primary)' }}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Payment Method
            </Button>
          </div>

          {paymentMethods.length === 0 ? (
            <Card className="rounded-xl border border-border/80 bg-card p-8 text-center space-y-3">
              <div className="mx-auto w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <CreditCard className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">No payment method on file</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Add a credit card or link your billing account to activate auto-reload and uninterrupted task processing.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddPaymentMethodOpen(true)}
                className="rounded-lg text-xs"
              >
                Add Card
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paymentMethods.map((pm) => (
                <VirtualCreditCard
                  key={pm.id}
                  card={pm}
                  onRemove={handleRemoveCard}
                  onSetDefault={handleSetDefaultCard}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === 'billing_history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">Invoices & Receipts</h2>
          </div>

          <Card className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/70 text-[11px] font-mono font-medium text-muted-foreground/80 bg-muted/20">
                    <th className="py-2.5 px-4 font-semibold">Invoice</th>
                    <th className="py-2.5 px-4 font-semibold">Date</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold">Amount</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 text-right font-semibold">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 text-xs">
                  {INITIAL_INVOICES.map((inv) => (
                    <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">{inv.id}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">{inv.date}</td>
                      <td className="py-3 px-4 text-foreground">{inv.description}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-foreground">{inv.amount}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-mono">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add To Balance Dialog */}
      <Dialog open={isAddBalanceOpen} onOpenChange={setIsAddBalanceOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add to balance</DialogTitle>
            <DialogDescription className="text-xs">
              Instantly top-up your Sequential workspace balance with credits.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddBalanceSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select Top-Up Amount</Label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      setSelectedTopUpAmount(amt)
                      setCustomTopUpAmount('')
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedTopUpAmount === amt && !customTopUpAmount
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/80 hover:bg-muted text-foreground'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="custom-amt" className="text-xs font-semibold">Or Custom Amount ($)</Label>
              <Input
                id="custom-amt"
                type="number"
                min="5"
                placeholder="Enter custom dollar amount"
                value={customTopUpAmount}
                onChange={(e) => setCustomTopUpAmount(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddBalanceOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg text-xs text-white font-semibold shadow-xs"
                style={{ background: 'var(--primary)' }}
              >
                Confirm Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Auto-Reload Dialog */}
      <Dialog open={isAutoReloadOpen} onOpenChange={setIsAutoReloadOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Auto-Reload Settings</DialogTitle>
            <DialogDescription className="text-xs">
              Automatically reload your balance when credits run low so API tasks are never interrupted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/70">
              <div>
                <span className="text-xs font-semibold text-foreground block">Enable Auto-Reload</span>
                <span className="text-[11px] text-muted-foreground">Charge default card on low balance</span>
              </div>
              <input
                type="checkbox"
                checked={autoReloadEnabled}
                onChange={(e) => setAutoReloadEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary cursor-pointer"
              />
            </div>

            {autoReloadEnabled && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">When balance falls below</Label>
                  <Input
                    type="number"
                    value={autoReloadThreshold}
                    onChange={(e) => setAutoReloadThreshold(e.target.value)}
                    className="rounded-lg h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Reload amount ($)</Label>
                  <Input
                    type="number"
                    value={autoReloadAmount}
                    onChange={(e) => setAutoReloadAmount(e.target.value)}
                    className="rounded-lg h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsAutoReloadOpen(false)}
                className="rounded-lg text-xs w-full text-white font-semibold shadow-xs"
                style={{ background: 'var(--primary)' }}
              >
                Save Settings
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Payment Method Dialog with Live Interactive Card Preview */}
      <Dialog open={isAddPaymentMethodOpen} onOpenChange={setIsAddPaymentMethodOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Payment Method</DialogTitle>
            <DialogDescription className="text-xs">
              Enter your credit card details securely encrypted and processed via Stripe.
            </DialogDescription>
          </DialogHeader>

          {/* Live Virtual Card Preview */}
          <div className="pt-2">
            <VirtualCreditCard
              card={{
                last4: cardNumber.replace(/\s+/g, '').slice(-4) || '••••',
                holderName: cardHolder || 'YOUR NAME',
                expiry: cardExpiry || 'MM/YY',
                isDefault: false,
              }}
            />
          </div>

          <form onSubmit={handleAddCardSubmit} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label htmlFor="card-name" className="text-xs font-semibold">Cardholder Name</Label>
              <Input
                id="card-name"
                placeholder="Yash Tupkar"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                className="rounded-lg h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="card-num" className="text-xs font-semibold">Card Number</Label>
              <Input
                id="card-num"
                placeholder="4242 •••• •••• 4242"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="rounded-lg h-8 text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="card-exp" className="text-xs font-semibold">MM / YY</Label>
                <Input
                  id="card-exp"
                  placeholder="12/28"
                  maxLength={5}
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  className="rounded-lg h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-cvc" className="text-xs font-semibold">CVC</Label>
                <Input
                  id="card-cvc"
                  placeholder="123"
                  maxLength={4}
                  value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value)}
                  className="rounded-lg h-8 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="card-zip" className="text-xs font-semibold">ZIP Code</Label>
                <Input
                  id="card-zip"
                  placeholder="94107"
                  value={cardZip}
                  onChange={(e) => setCardZip(e.target.value)}
                  className="rounded-lg h-8 text-xs font-mono"
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddPaymentMethodOpen(false)}
                className="rounded-lg text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={!cardNumber.trim()}
                className="rounded-lg text-xs text-white font-semibold shadow-xs"
                style={{ background: 'var(--primary)' }}
              >
                Save Card
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
