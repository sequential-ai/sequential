import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Skeleton } from 'boneyard-js/react'
import { useAuth } from '@/context/AuthContext'
import { Skeleton as UiSkeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  FolderKanban,
  Plus,
  Search,
  Layers,
  ArrowUpRight,
  Sparkles,
  Users,
  Coins,
  Calendar,
  MoreVertical,
} from 'lucide-react'

const INITIAL_PROJECTS = [
  {
    id: 'prj_alpha_fin',
    name: 'FinTech Compliance & Regulatory AI',
    slug: 'fintech-compliance',
    description: 'Automated synthesis of global banking regulations, SEC filings, and AML compliance matrices.',
    taskCount: 24,
    totalTokens: 420000,
    cost: 4.20,
    members: 4,
    updatedAt: '2 hours ago',
    color: '#F2541B',
  },
  {
    id: 'prj_quantum_hw',
    name: 'Quantum Interconnects Research',
    slug: 'quantum-interconnects',
    description: 'Scouting silicon photonics breakthroughs and cryo-CMOS memory scaling whitepapers.',
    taskCount: 16,
    totalTokens: 280000,
    cost: 2.80,
    members: 2,
    updatedAt: '1 day ago',
    color: '#6B3DFF',
  },
  {
    id: 'prj_pharma_bio',
    name: 'BioTech Target Identification',
    slug: 'biotech-targets',
    description: 'Autonomous literature mining for oncology small-molecule pathway candidates and clinical trials.',
    taskCount: 38,
    totalTokens: 890000,
    cost: 8.90,
    members: 6,
    updatedAt: '3 days ago',
    color: '#C23DBE',
  },
  {
    id: 'prj_sec_audit',
    name: 'Smart Contract Formal Verification',
    slug: 'smart-contract-audit',
    description: 'Automated static analysis, EVM bytecode disassembly, and zero-day vulnerability discovery.',
    taskCount: 12,
    totalTokens: 195000,
    cost: 1.95,
    members: 3,
    updatedAt: '5 days ago',
    color: '#CFF23A',
  },
]

function ProjectsFallback() {
  return (
    <div className="space-y-5 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1.5">
          <UiSkeleton className="h-7 w-48 rounded-lg" />
          <UiSkeleton className="h-4 w-72 rounded-md" />
        </div>
        <UiSkeleton className="h-8 w-32 rounded-lg" />
      </div>
      <UiSkeleton className="h-9 w-full max-w-sm rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-5 rounded-xl border border-border/80 bg-card space-y-4">
            <div className="flex items-center justify-between">
              <UiSkeleton className="h-6 w-32 rounded" />
              <UiSkeleton className="h-5 w-16 rounded-full" />
            </div>
            <UiSkeleton className="h-10 w-full rounded" />
            <div className="flex justify-between items-center pt-2 border-t border-border/40">
              <UiSkeleton className="h-4 w-20 rounded" />
              <UiSkeleton className="h-4 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Projects() {
  const { isSyncing } = useAuth()
  const [projects, setProjects] = useState(INITIAL_PROJECTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateProject = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    const newPrj = {
      id: `prj_${Math.random().toString(36).substring(2, 8)}`,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description || 'No description provided.',
      taskCount: 0,
      totalTokens: 0,
      cost: 0.0,
      members: 1,
      updatedAt: 'Just now',
      color: '#F2541B',
    }

    setProjects([newPrj, ...projects])
    setIsNewModalOpen(false)
    setName('')
    setDescription('')
  }

  return (
    <Skeleton
      name="projects-page"
      loading={isSyncing}
      fallback={<ProjectsFallback />}
      className="w-full min-w-0"
    >
      <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Research Workspaces</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize multi-agent tasks, team permissions, and token budgets across domains.
          </p>
        </div>
        <Button
          onClick={() => setIsNewModalOpen(true)}
          className="rounded-lg h-8 px-3.5 text-xs font-semibold text-white shadow-xs"
          style={{ background: 'var(--primary)' }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create Project
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Filter workspaces by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-8 h-8 rounded-lg text-xs bg-card border-border"
        />
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filtered.map((prj) => (
          <Card
            key={prj.id}
            className="rounded-xl border-border bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: prj.color }}
                  >
                    <FolderKanban className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">{prj.name}</CardTitle>
                    <span className="font-mono text-[10px] text-muted-foreground">/{prj.slug}</span>
                  </div>
                </div>

                <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
                  {prj.members} Members
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {prj.description}
              </p>

              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/20 border border-border text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Tasks</span>
                  <p className="text-xs font-bold font-mono mt-0.5">{prj.taskCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Tokens</span>
                  <p className="text-xs font-bold font-mono mt-0.5">{(prj.totalTokens / 1000).toFixed(0)}k</p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase">Spend</span>
                  <p className="text-xs font-bold font-mono text-emerald-400 mt-0.5">${prj.cost.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Calendar className="h-3 w-3" /> Updated {prj.updatedAt}
                </span>

                <Button asChild variant="ghost" size="xs" className="rounded-md h-6 text-[11px] gap-1 hover:text-primary">
                  <Link to="/dashboard/tasks">
                    Open Tasks <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Project Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Research Workspace</DialogTitle>
            <DialogDescription className="text-xs">
              Group related research queries, token quotas, and share with team members.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-3.5 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">Workspace Name</Label>
              <Input
                id="name"
                placeholder="e.g. Autonomous Oncology Pipeline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg h-8 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="desc" className="text-xs font-semibold">Description</Label>
              <Textarea
                id="desc"
                placeholder="Brief summary of research scope..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="rounded-lg text-xs resize-none"
              />
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNewModalOpen(false)} className="rounded-lg text-xs">
                Cancel
              </Button>
              <Button type="submit" size="sm" className="rounded-lg text-xs text-white font-medium shadow-xs" style={{ background: 'var(--primary)' }}>
                Create Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </Skeleton>
  )
}
