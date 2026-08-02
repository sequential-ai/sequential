import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  FileCode2,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Code2,
  LayoutList,
} from 'lucide-react'

const DEFAULT_FIELDS = [
  { name: 'title', type: 'string', required: true },
  { name: 'keyFindings', type: 'string[]', required: true },
  { name: 'confidence', type: 'number', required: true },
]

export function OutputContract({
  isStructuredOutput,
  setIsStructuredOutput,
  schemaJson,
  setSchemaJson,
}) {
  const [activeTab, setActiveTab] = useState('visual')
  const [fields, setFields] = useState(DEFAULT_FIELDS)
  const [copiedSchema, setCopiedSchema] = useState(false)

  // Sync visual fields to schema JSON
  const syncFieldsToJson = (currentFields) => {
    const obj = {}
    currentFields.forEach((f) => {
      if (!f.name) return
      if (f.type === 'string[]') {
        obj[f.name] = ['string']
      } else if (f.type === 'number') {
        obj[f.name] = 0.95
      } else if (f.type === 'boolean') {
        obj[f.name] = true
      } else if (f.type === 'object') {
        obj[f.name] = { key: 'value' }
      } else {
        obj[f.name] = 'string'
      }
    })
    setSchemaJson(JSON.stringify(obj, null, 2))
  }

  const handleAddField = () => {
    const newField = { name: `field_${fields.length + 1}`, type: 'string', required: false }
    const updated = [...fields, newField]
    setFields(updated)
    syncFieldsToJson(updated)
  }

  const handleUpdateField = (index, key, value) => {
    const updated = [...fields]
    updated[index][key] = value
    setFields(updated)
    syncFieldsToJson(updated)
  }

  const handleRemoveField = (index) => {
    const updated = fields.filter((_, i) => i !== index)
    setFields(updated)
    syncFieldsToJson(updated)
  }

  const handleCopySchema = () => {
    navigator.clipboard.writeText(schemaJson)
    setCopiedSchema(true)
    setTimeout(() => setCopiedSchema(false), 2000)
  }

  const loadPreset = (type) => {
    let presetFields = []
    if (type === 'research') {
      presetFields = [
        { name: 'topic', type: 'string', required: true },
        { name: 'summary', type: 'string', required: true },
        { name: 'citations', type: 'string[]', required: true },
        { name: 'confidenceScore', type: 'number', required: true },
      ]
    } else if (type === 'benchmark') {
      presetFields = [
        { name: 'model', type: 'string', required: true },
        { name: 'latencyMs', type: 'number', required: true },
        { name: 'tokensPerSec', type: 'number', required: true },
        { name: 'verdict', type: 'string', required: true },
      ]
    }
    setFields(presetFields)
    syncFieldsToJson(presetFields)
  }

  return (
    <Card className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 min-w-0 flex flex-col justify-between">
      {/* Header & Toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">Output Contract</h2>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-medium text-muted-foreground hover:text-foreground">
            <span className="font-mono text-[11px]">Structured output</span>
            <Switch
              checked={isStructuredOutput}
              onCheckedChange={setIsStructuredOutput}
              className="scale-80"
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Define how Sequential should structure and validate the final response object.
        </p>
      </div>

      {/* Contract Body */}
      {!isStructuredOutput ? (
        /* Disabled State */
        <div className="p-4 rounded-lg bg-muted/20 border border-dashed border-border/80 text-center space-y-2 my-auto py-8">
          <div className="w-8 h-8 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xs font-semibold text-foreground">Natural Prose Synthesis</h3>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
              Sequential will determine the best response format with rich markdown and verified citations.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStructuredOutput(true)}
            className="h-7 text-xs rounded-md font-mono mt-1 cursor-pointer"
          >
            Enable TaskSpec Schema
          </Button>
        </div>
      ) : (
        /* Enabled Tabs (Visual Builder | JSON Schema) */
        <div className="space-y-3 pt-1 animate-fade-in flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-2.5">
            <div className="flex items-center justify-between">
              <TabsList className="grid grid-cols-2 h-7 rounded-md p-0.5 bg-muted/60 text-xs">
                <TabsTrigger value="visual" className="text-[11px] rounded-xs font-mono font-medium flex items-center gap-1">
                  <LayoutList className="h-3 w-3" />
                  Visual Builder
                </TabsTrigger>
                <TabsTrigger value="json" className="text-[11px] rounded-xs font-mono font-medium flex items-center gap-1">
                  <Code2 className="h-3 w-3" />
                  JSON Schema
                </TabsTrigger>
              </TabsList>

              {/* Preset quick loader */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => loadPreset('research')}
                  className="px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  + Research
                </button>
                <button
                  type="button"
                  onClick={() => loadPreset('benchmark')}
                  className="px-1.5 py-0.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  + Benchmark
                </button>
              </div>
            </div>

            {/* Tab 1: Visual Builder */}
            <TabsContent value="visual" className="space-y-2 focus-visible:outline-none">
              <div className="rounded-lg border border-border/70 overflow-hidden bg-background/50">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/70 text-[10px] font-mono text-muted-foreground bg-muted/30">
                      <th className="py-1.5 px-2.5 font-semibold">Field</th>
                      <th className="py-1.5 px-2 font-semibold">Type</th>
                      <th className="py-1.5 px-2 font-semibold text-center">Req</th>
                      <th className="py-1.5 px-2 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 font-mono text-[11px]">
                    {fields.map((field, idx) => (
                      <tr key={idx} className="hover:bg-muted/20">
                        <td className="py-1.5 px-2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                            className="w-full bg-transparent border-0 font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 rounded px-1"
                            placeholder="field_name"
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <select
                            value={field.type}
                            onChange={(e) => handleUpdateField(idx, 'type', e.target.value)}
                            className="bg-transparent border-0 font-mono text-primary text-[11px] focus:outline-none cursor-pointer"
                          >
                            <option value="string">string</option>
                            <option value="string[]">string[]</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                            <option value="object">object</option>
                          </select>
                        </td>
                        <td className="py-1.5 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => handleUpdateField(idx, 'required', e.target.checked)}
                            className="rounded border-border accent-primary cursor-pointer"
                          />
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveField(idx)}
                            className="text-muted-foreground hover:text-rose-500 cursor-pointer p-0.5"
                            title="Delete field"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddField}
                  className="h-7 px-2.5 text-xs font-mono rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Add field
                </Button>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {fields.length} schema fields
                </span>
              </div>
            </TabsContent>

            {/* Tab 2: JSON Schema Editor */}
            <TabsContent value="json" className="space-y-2 focus-visible:outline-none">
              <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between pb-1 text-[10px] text-zinc-400 border-b border-zinc-800/80 mb-2">
                  <span>TaskSpec JSON Contract</span>
                  <button
                    type="button"
                    onClick={handleCopySchema}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    {copiedSchema ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </button>
                </div>
                <textarea
                  value={schemaJson}
                  onChange={(e) => setSchemaJson(e.target.value)}
                  rows={6}
                  className="w-full bg-transparent border-0 text-zinc-100 font-mono text-[11px] leading-relaxed resize-none focus:outline-none"
                  spellCheck={false}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>Validation: Strict DAG Schema</span>
        <span className="text-primary font-semibold">Ready</span>
      </div>
    </Card>
  )
}
