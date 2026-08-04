import { Copy } from 'lucide-react'
import { Check } from 'lucide-react'
import React, { useState } from 'react'
import { BsTypescript } from 'react-icons/bs'
import { FaPython } from 'react-icons/fa'
import { SiCurl } from 'react-icons/si'

const CodeDialog = ({
    prompt,
    activeCategoryMeta,
    normalizedCategory,
    mode,
    isStructuredOutput,
    schemaTemplate,
    location,
    language,
    alertThreshold,
    webhookUrl,
    pollingInterval,
    namespace,
    topK,
    similarityThreshold,
    extractRelations,
    setIsCodeModalOpen,
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState('python')
    const [isCopied, setIsCopied] = useState(false)

    // Generate Code Snippets dynamically
    const getCodeSnippet = () => {
        if (!prompt || prompt.trim() === '') {
            if (selectedLanguage === 'ts') {
                return '// Enter a query to see generated code'
            }
            return '# Enter a query to see generated code'
        }

        const currentQuery = prompt

        if (normalizedCategory === 'task') {
            if (selectedLanguage === 'python') {
                return `import sequential

# Initialize Sequential Client
client = sequential.Client(api_key="sk_live_seq_...")

# Create & Run Task
task = client.tasks.create(
    query="${currentQuery}",
    mode="${mode}",${isStructuredOutput
                        ? `\n    task_spec={\n        "format": "json",\n        "schema": ${schemaTemplate}\n    },`
                        : ''
                    }
    location="${location.split(' ')[0]}",
    language="${language.split(' ')[0]}"
)

print(f"Task ID: {task.id} | Status: {task.status}")
print(task.output.answer)`
            }

            if (selectedLanguage === 'ts') {
                return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const task = await client.tasks.create({
    query: "${currentQuery}",
    mode: "${mode}",${isStructuredOutput
                        ? `\n    taskSpec: {\n      format: "json",\n      schema: ${schemaTemplate}\n    },`
                        : ''
                    }
    location: "${location.split(' ')[0]}",
    language: "${language.split(' ')[0]}"
  });

  console.log("Task ID:", task.id);
  console.log("Output:", task.output.answer);
}

run();`
            }

            return `curl -X POST https://api.sequential.ai/v1/tasks \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${currentQuery}",
    "mode": "${mode}",
    "location": "${location.split(' ')[0]}",
    "language": "${language.split(' ')[0]}"${isStructuredOutput
                    ? `,\n    "taskSpec": { "format": "json" }`
                    : ''
                }
  }'`
        }

        if (normalizedCategory === 'monitor') {
            if (selectedLanguage === 'python') {
                return `import sequential

client = sequential.Client(api_key="sk_live_seq_...")

# Setup Live Stream Monitor
monitor = client.monitors.create(
    target="${currentQuery}",
    mode="${mode}",
    alert_threshold="${alertThreshold}",
    webhook_url="${webhookUrl}",
    interval="${pollingInterval}"
)

print(f"Monitor ID: {monitor.id} | Stream Status: {monitor.status}")
for event in monitor.stream():
    print(f"[{event.timestamp}] Status: {event.status_code} | Latency: {event.latency_ms}ms")`
            }

            if (selectedLanguage === 'ts') {
                return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const monitor = await client.monitors.create({
    target: "${currentQuery}",
    mode: "${mode}",
    alertThreshold: "${alertThreshold}",
    webhookUrl: "${webhookUrl}",
    interval: "${pollingInterval}"
  });

  console.log("Monitor Live:", monitor.id);
  monitor.on("event", (evt) => console.log("Stream Event:", evt));
}

run();`
            }

            return `curl -X POST https://api.sequential.ai/v1/monitors \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "target": "${currentQuery}",
    "mode": "${mode}",
    "alertThreshold": "${alertThreshold}",
    "webhookUrl": "${webhookUrl}"
  }'`
        }

        // Memory Category
        if (selectedLanguage === 'python') {
            return `import sequential

client = sequential.Client(api_key="sk_live_seq_...")

# Query Knowledge Graph & Vector Memory
memory_result = client.memory.query(
    query="${currentQuery}",
    namespace="${namespace}",
    mode="${mode}",
    top_k=${topK.replace('Top ', '')},
    threshold=${similarityThreshold},
    include_relations=${extractRelations ? 'True' : 'False'}
)

print(f"Retrieved {len(memory_result.entities)} entities:")
for entity in memory_result.entities:
    print(f"- {entity.name} (Similarity: {entity.score})")`
        }

        if (selectedLanguage === 'ts') {
            return `import { SequentialAI } from "@sequential-ai/sdk";

const client = new SequentialAI({
  apiKey: process.env.SEQUENTIAL_API_KEY,
});

async function run() {
  const memory = await client.memory.query({
    query: "${currentQuery}",
    namespace: "${namespace}",
    mode: "${mode}",
    topK: ${topK.replace('Top ', '')},
    threshold: ${similarityThreshold},
    includeRelations: ${extractRelations}
  });

  console.log("Retrieved Entities:", memory.entities);
}

run();`
        }

        return `curl -X POST https://api.sequential.ai/v1/memory/query \\
  -H "Authorization: Bearer sk_live_seq_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "${currentQuery}",
    "namespace": "${namespace}",
    "mode": "${mode}",
    "topK": ${topK.replace('Top ', '')},
    "threshold": ${similarityThreshold}
  }'`
    }

    const handleCopyCode = () => {
        navigator.clipboard.writeText(getCodeSnippet())
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    // Custom High-Quality Syntax Highlighter
    function SyntaxHighlightedCode({ code, language }) {
        const lines = code.split('\n')

        return (
            <div className="font-mono text-[12px] leading-relaxed select-text">
                {lines.map((line, lineIdx) => {
                    if (line.trim().startsWith('#') || line.trim().startsWith('//')) {
                        return (
                            <div key={lineIdx} className="table-row">
                                <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px]">
                                    {lineIdx + 1}
                                </span>
                                <span className="table-cell font-mono text-zinc-500 italic whitespace-pre">
                                    {line}
                                </span>
                            </div>
                        )
                    }

                    const tokenRegex =
                        /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|#[^\n]*|\/\/[^\n]*|\$[A-Z0-9_]+|--[a-z0-9-]+|-[a-zA-Z]|(?:import|from|const|let|var|async|await|function|return|def|print|as|class|try|except|new)\b|\b(?:\d+(?:\.\d+)?)\b|[a-zA-Z_][a-zA-Z0-9_]*(?=\()|[a-zA-Z_][a-zA-Z0-9_]*(?=:)|[{}\[\](),:;=+\-*\/\\&|<>!]+|[a-zA-Z0-9_.-]+|\s+)/g

                    const parts = []
                    let match

                    while ((match = tokenRegex.exec(line)) !== null) {
                        const text = match[0]
                        let colorClass = 'text-zinc-200'

                        if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
                            colorClass = 'text-emerald-400 dark:text-emerald-300'
                        } else if (text.startsWith('#') || text.startsWith('//')) {
                            colorClass = 'text-zinc-500 italic'
                        } else if (text.startsWith('$')) {
                            colorClass = 'text-purple-400 font-semibold'
                        } else if (text.startsWith('--') || text.startsWith('-')) {
                            colorClass = 'text-sky-400 font-medium'
                        } else if (
                            [
                                'import',
                                'from',
                                'const',
                                'let',
                                'var',
                                'async',
                                'await',
                                'function',
                                'return',
                                'def',
                                'print',
                                'as',
                                'class',
                                'try',
                                'except',
                                'new',
                                'curl',
                                'seq',
                            ].includes(text)
                        ) {
                            colorClass = 'text-pink-400 font-semibold'
                        } else if (['POST', 'GET', 'PUT', 'DELETE', 'PATCH'].includes(text)) {
                            colorClass = 'text-amber-400 font-bold'
                        } else if (/^\d+(\.\d+)?$/.test(text)) {
                            colorClass = 'text-orange-400'
                        } else if (['SequentialAI', 'Client', 'sequential'].includes(text)) {
                            colorClass = 'text-cyan-300 font-bold'
                        } else if (['tasks', 'monitors', 'memory', 'create', 'query', 'stream', 'search', 'run', 'log'].includes(text)) {
                            colorClass = 'text-blue-400'
                        } else if (['{', '}', '[', ']', '(', ')', ',', ';', '\\', ':', '='].includes(text)) {
                            colorClass = 'text-zinc-400'
                        }

                        parts.push(
                            <span key={parts.length} className={colorClass}>
                                {text}
                            </span>
                        )
                    }

                    return (
                        <div key={lineIdx} className="table-row hover:bg-zinc-800/30 transition-colors">
                            <span className="table-cell select-none text-right pr-4 text-zinc-600 font-mono text-[11px]">
                                {lineIdx + 1}
                            </span>
                            <span className="table-cell whitespace-pre">
                                {parts.length > 0 ? parts : line}
                            </span>
                        </div>
                    )
                })}
            </div>
        )
    }

  return (
      <>  <div
          className={`absolute bottom-16 right-5 z-30 flex flex-col rounded-xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-all duration-300 ${
              !prompt || prompt.trim() === '' 
                ? 'h-[180px] w-[min(420px,calc(100%-2.5rem))]' 
                : 'h-[450px] w-[min(660px,calc(100%-2.5rem))]'
          }`}
      >
          {/* Language Tabs */}
          <div className="flex items-center justify-between px-5 pt-3 pb-0 border-b border-zinc-200/80 dark:border-zinc-800/80 shrink-0">
              <div className="flex items-center gap-0">
                  {[
                      { id: 'curl', label: 'cURL', icon: SiCurl },
                      { id: 'ts', label: 'TypeScript', icon: BsTypescript },
                      { id: 'python', label: 'Python', icon: FaPython },
                  ].map((lang) => (
                      <button
                          key={lang.id}
                          type="button"
                          onClick={() => setSelectedLanguage(lang.id)}
                          className={`relative px-4 py-2 text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${selectedLanguage === lang.id
                              ? 'text-zinc-900 dark:text-zinc-100'
                              : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                              }`}
                      >
                          {lang.icon && <lang.icon className="h-3.5 w-3.5" />}

                          {lang.label}
                          {selectedLanguage === lang.id && (
                              <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-zinc-900 dark:bg-zinc-100 rounded-full" />
                          )}
                      </button>
                  ))}
              </div>
              <div className="flex items-center gap-2">
                  <button
                      type="button"
                      onClick={() => setIsCodeModalOpen(false)}
                      className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors p-1 rounded cursor-pointer"
                      title="Close (Esc)"
                  >
                      <span className="text-[10px] font-mono border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 rounded text-zinc-500 dark:text-zinc-400">Esc</span>
                  </button>
                  <button
                      type="button"
                      onClick={() => setIsCodeModalOpen(false)}
                      className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors p-1 rounded cursor-pointer"
                  >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                  </button>
              </div>
          </div>

          {/* Code Block — always dark for readability */}
          <div className="flex-1 overflow-auto m-4 rounded-xl px-5 py-4 bg-zinc-950 border border-zinc-200/50 dark:border-zinc-800/50 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
              <div className="table w-full">
                  <SyntaxHighlightedCode
                      code={getCodeSnippet()}
                      language={selectedLanguage}
                  />
              </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-3 border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-3">
                  
                  <button
                      type="button"
                      onClick={handleCopyCode}
                      className="text-xs flex items-center gap-2 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 transition-colors font-medium cursor-pointer shadow-sm"
                  >
                      <span>{isCopied ? 'Copied!' : 'Copy Code'}</span>
                      {isCopied ? (
                          <Check className="h-3.5 w-3.5" />
                      ) : (
                          <Copy className="h-3.5 w-3.5" />
                      )}
                  </button>
              </div>
          </div>
      </div></>
  )
}

export default CodeDialog