import { MODELS, getModel, type ModelId } from "@/lib/oracle"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  value: ModelId
  onChange: (value: ModelId) => void
}

export function ModelPicker({ value, onChange }: Props) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as ModelId)}>
      <SelectTrigger
        className="h-9 w-[188px] border-border bg-card text-[13px]"
        aria-label="Model"
      >
        <SelectValue>{getModel(value).name}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((model) => (
          <SelectItem key={model.id} value={model.id} className="text-[13px]">
            <span className="flex w-full items-baseline justify-between gap-4">
              <span>{model.name}</span>
              <span className="text-[11px] text-muted-foreground">{model.note}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
