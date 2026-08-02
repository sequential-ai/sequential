import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, Terminal, Code2 } from 'lucide-react'

export function ApiCodeModal({
  isOpen,
  onOpenChange,
  prompt,
  mode = 'STANDARD',
  isStructuredOutput,
  schemaJson,
}) {
  const [selectedLanguage, setSelectedLanguage] = useState('python') // 'python' | 'node' | 'curl'
  const [isCopied, setIsCopied] = useState(false)

  const currentQuery = prompt || 'Research the leading AI coding platforms, compare their pricing and developer experience, and return the findings as structured data.'

  const getCodeSnippet = () => {
    if (selectedLanguage === 'python') {
      return `import sequential

# Initialize Sequential Client
client = sequential.Client(api_key="sk_live_seq_...")

# Create and Execute Autonomous Task
task = client.tasks.create(
    query="${currentQuery}",
    mode="${mode}",${
      isStructuredOutput
        ? `\n    task_spec={\n        "format": "json",\n        "schema": ${schemaJson || '{}'}\n    }`
        : ''
    }
)

# Access Execution Output & Metrics
print(f"Task ID: {task.id} | Status: {task.status}")
print(f"Latency: {task.execution.duration_ms}ms | Cost: \${task.execution.cost_usd}")
print(task.output.answer)`
    }

    if (selectedLanguage === 'node') {
      return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function runTask() {
  const task = await client.tasks.create({
    query: "${currentQuery}",
    mode: "${mode}",${
      isStructuredOutput
        ? `\n    taskSpec: {\n      format: "json",\n      schema: ${schemaJson || '{}'}\n    },`
        : ''
    }
  });

  console.log("Task ID:", task.id);
  console.log("Execution Time:", task.execution?.duration);
  console.log("Output:", task.output.answer);
}

runTask();`
    }

    return `curl -X POST https://api.sequential.ai/v1/tasks \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${currentQuery}",
    "mode": "${mode}"${
      isStructuredOutput
        ? `,\n    "taskSpec": { "format": "json", "schema": ${schemaJson ? schemaJson.replace(/\n/g, ' ') : '{}'} }`
        : ''
    }
  }'`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet())
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-xl p-5 bg-card border border-border/80">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              API Code Snippet
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyCode}
              className="rounded-md h-7 px-2.5 text-xs flex items-center gap-1 font-mono cursor-pointer"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {isCopied ? 'Copied' : 'Copy Code'}
            </Button>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Embed this Task API invocation directly into your autonomous agents or backend services.
          </DialogDescription>
        </DialogHeader>

        {/* Language Tabs */}
        <div className="flex items-center gap-2 border-b border-border/60 pb-2 mt-2">
          {[
            { id: 'python', label: 'Python SDK' },
            { id: 'node', label: 'TypeScript / Node.js' },
            { id: 'curl', label: 'cURL' },
          ].map((lang) => (
            <button
              key={lang.id}
              type="button"
              onClick={() => setSelectedLanguage(lang.id)}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold transition-all cursor-pointer ${
                selectedLanguage === lang.id
                  ? 'bg-primary text-white shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        {/* Code Terminal */}
        <div className="mt-2 relative rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-100 overflow-x-auto border border-zinc-800 shadow-inner">
          <pre className="leading-relaxed">{getCodeSnippet()}</pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
