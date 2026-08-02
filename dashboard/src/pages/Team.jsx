import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Users,
  Plus,
  Mail,
  Shield,
  Trash2,
  CheckCircle2,
  UserPlus,
} from 'lucide-react'

const INITIAL_MEMBERS = [
  {
    id: 'mem_01',
    name: 'Yash Tailor',
    email: 'yashtailor@sequential.ai',
    role: 'OWNER',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60',
    joinedAt: '2026-07-28',
    status: 'ACTIVE',
  },
  {
    id: 'mem_02',
    name: 'Elena Rostova',
    email: 'elena@sequential.ai',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60',
    joinedAt: '2026-07-30',
    status: 'ACTIVE',
  },
  {
    id: 'mem_03',
    name: 'Marcus Vance',
    email: 'marcus@sequential.ai',
    role: 'DEVELOPER',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
    joinedAt: '2026-08-01',
    status: 'ACTIVE',
  },
  {
    id: 'mem_04',
    name: 'Aisha Patel',
    email: 'aisha@sequential.ai',
    role: 'ANALYST',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
    joinedAt: '2026-08-02',
    status: 'ACTIVE',
  },
]

export default function Team() {
  const { org } = useAuth()
  const [members, setMembers] = useState(INITIAL_MEMBERS)
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('DEVELOPER')

  const handleInvite = (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    const newMember = {
      id: `mem_${Math.random().toString(36).substring(2, 8)}`,
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      avatar: '',
      joinedAt: 'Pending',
      status: 'INVITED',
    }

    setMembers([...members, newMember])
    setIsInviteOpen(false)
    setInviteEmail('')
  }

  const handleRemove = (id) => {
    setMembers(members.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Team Members & Permissions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage organization members, workspace access, and role-based access control (RBAC).
          </p>
        </div>

        <Button
          onClick={() => setIsInviteOpen(true)}
          className="rounded-lg h-8 px-3.5 text-xs font-semibold text-white shadow-xs"
          style={{ background: 'var(--primary)' }}
        >
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Invite Colleague
        </Button>
      </div>

      {/* Team Table */}
      <Card className="rounded-xl border-border bg-card shadow-xs overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-border">
          <CardTitle className="text-sm font-bold">Workspace Members ({members.length})</CardTitle>
          <CardDescription className="text-xs">
            Users authorized to trigger research pipelines and inspect telemetry
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/20 uppercase text-muted-foreground font-medium text-[10px]">
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-4">Role</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Joined Date</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-7 w-7 rounded-lg">
                          <AvatarImage src={m.avatar} alt={m.name} />
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                            {m.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-xs">{m.name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">{m.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-4">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono px-1.5 py-0 ${
                          m.role === 'OWNER'
                            ? 'border-primary/40 text-primary bg-primary/5'
                            : m.role === 'ADMIN'
                            ? 'border-violet-500/40 text-violet-400 bg-violet-500/5'
                            : 'border-border'
                        }`}
                      >
                        {m.role}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${
                        m.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          m.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-amber-400'
                        }`} />
                        {m.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">
                      {m.joinedAt}
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {m.role !== 'OWNER' && (
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleRemove(m.id)}
                          className="rounded-md text-destructive hover:bg-destructive/10 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Role Definitions Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <h4 className="text-xs font-bold">Admin</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Full control over billing subscriptions, credit refills, team members, and all API credentials.
          </p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-violet-400" />
            <h4 className="text-xs font-bold">Developer</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            Trigger parallel research pipelines, create dev API tokens, inspect execution traces and raw specs.
          </p>
        </Card>

        <Card className="rounded-xl border-border bg-card shadow-xs p-3.5">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <h4 className="text-xs font-bold">Analyst (Read-Only)</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
            View completed research reports, verified citations, and token telemetry without modification access.
          </p>
        </Card>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Invite Colleague to Workspace</DialogTitle>
            <DialogDescription className="text-xs">
              An invitation email with access credentials will be delivered immediately.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-3.5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="rounded-lg h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs font-semibold">Role Level</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger id="role" className="rounded-lg h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin (Full Billing & Keys)</SelectItem>
                  <SelectItem value="DEVELOPER">Developer (Pipeline Runner)</SelectItem>
                  <SelectItem value="ANALYST">Analyst (Read Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsInviteOpen(false)} className="rounded-lg text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-lg text-xs text-white font-medium shadow-xs" style={{ background: 'var(--primary)' }}>
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
