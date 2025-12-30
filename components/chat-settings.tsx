import { Button } from './ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip'
import { LLMModelConfig } from '@/lib/models'
import { Settings2 } from 'lucide-react'

export function ChatSettings({
  apiKeyConfigurable,
  baseURLConfigurable,
  languageModel,
  onLanguageModelChange,
}: {
  apiKeyConfigurable: boolean
  baseURLConfigurable: boolean
  languageModel: LLMModelConfig
  onLanguageModelChange: (model: LLMModelConfig) => void
}) {
  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-sm w-6 h-6 text-muted-foreground" aria-label="Settings">
                <Settings2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>LLM settings</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="start">
        {apiKeyConfigurable && (
          <>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                name="apiKey"
                type="password"
                placeholder="Auto"
                required={true}
                defaultValue={languageModel.apiKey}
                onChange={(e) =>
                  onLanguageModelChange({
                    apiKey:
                      e.target.value.length > 0 ? e.target.value : undefined,
                  })
                }
                className="text-sm"
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        {baseURLConfigurable && (
          <>
            <div className="flex flex-col gap-2 px-2 py-2">
              <Label htmlFor="baseURL">Base URL</Label>
              <Input
                name="baseURL"
                type="text"
                placeholder="Auto"
                required={true}
                defaultValue={languageModel.baseURL}
                onChange={(e) =>
                  onLanguageModelChange({
                    baseURL:
                      e.target.value.length > 0 ? e.target.value : undefined,
                  })
                }
                className="text-sm"
              />
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <div className="flex flex-col gap-1.5 px-2 py-2">
          <span className="font-medium text-sm">Parameters</span>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">
              Output tokens
            </span>
            <Input
              type="number"
              defaultValue={languageModel.maxTokens}
              min={50}
              max={10000}
              step={1}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  maxTokens: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">
              Temperature
            </span>
            <Input
              type="number"
              defaultValue={languageModel.temperature}
              min={0}
              max={5}
              step={0.01}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  temperature: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">Top P</span>
            <Input
              type="number"
              defaultValue={languageModel.topP}
              min={0}
              max={1}
              step={0.01}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topP: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">Top K</span>
            <Input
              type="number"
              defaultValue={languageModel.topK}
              min={0}
              max={500}
              step={1}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  topK: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">
              Frequence penalty
            </span>
            <Input
              type="number"
              defaultValue={languageModel.frequencyPenalty}
              min={0}
              max={2}
              step={0.01}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  frequencyPenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex-1 text-muted-foreground text-sm">
              Presence penalty
            </span>
            <Input
              type="number"
              defaultValue={languageModel.presencePenalty}
              min={0}
              max={2}
              step={0.01}
              className="rounded-sm w-[84px] h-6 tabular-nums text-xs text-center"
              placeholder="Auto"
              onChange={(e) =>
                onLanguageModelChange({
                  presencePenalty: parseFloat(e.target.value) || undefined,
                })
              }
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
