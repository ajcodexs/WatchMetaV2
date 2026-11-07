import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function SeasonSelector({ seasons, value, onValueChange }) {
  return (
    <Select value={String(value)} onValueChange={(nextValue) => onValueChange(Number(nextValue))}>
      <SelectTrigger aria-label="Select season" className="w-36">
        <SelectValue placeholder="Select season" />
      </SelectTrigger>
      <SelectContent>
        {seasons.map((season) => (
          <SelectItem key={season.number} value={String(season.number)}>
            Season {season.number}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
