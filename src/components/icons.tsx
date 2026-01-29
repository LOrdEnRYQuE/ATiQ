import { 
  Sparkles, 
  Palette, 
  Code, 
  CheckCircle, 
  Rocket, 
  TrendingUp 
} from "lucide-react"

export const Icons = {
  sparkles: Sparkles,
  palette: Palette,
  code: Code,
  checkCircle: CheckCircle,
  rocket: Rocket,
  trendingUp: TrendingUp,
}

export type IconName = keyof typeof Icons
