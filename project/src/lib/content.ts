import {
  Code2,
  Database,
  FileSpreadsheet,
  BarChart3,
  Sigma,
  Table2,
  Terminal,
  BookOpen,
  GitBranch,
  LineChart,
  Brain,
  Flame,
} from 'lucide-react';
import type { ComponentType } from 'react';

export interface SkillItem {
  name: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export const skills: SkillItem[] = [
  {
    name: 'Python',
    desc: 'Scripting, automation, and data analysis',
    icon: Code2,
    color: 'text-sky-400',
  },
  {
    name: 'SQL',
    desc: 'Querying and managing relational databases',
    icon: Database,
    color: 'text-amber-400',
  },
  {
    name: 'MS Office',
    desc: 'Word, Excel, PowerPoint for reporting',
    icon: FileSpreadsheet,
    color: 'text-orange-400',
  },
  {
    name: 'PowerBI',
    desc: 'Building interactive dashboards and reports',
    icon: BarChart3,
    color: 'text-yellow-400',
  },
  {
    name: 'NumPy',
    desc: 'Numerical computing with arrays',
    icon: Sigma,
    color: 'text-teal-400',
  },
  {
    name: 'Pandas',
    desc: 'Data manipulation and analysis',
    icon: Table2,
    color: 'text-indigo-400',
  },
];

export interface ToolItem {
  name: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export const tools: ToolItem[] = [
  {
    name: 'MySQL Workbench',
    desc: 'Database design and administration',
    icon: Database,
    color: 'text-blue-400',
  },
  {
    name: 'VS Code',
    desc: 'Primary code editor',
    icon: Terminal,
    color: 'text-sky-400',
  },
  {
    name: 'Jupyter',
    desc: 'Notebooks for data exploration',
    icon: BookOpen,
    color: 'text-orange-400',
  },
  {
    name: 'GitHub',
    desc: 'Version control and collaboration',
    icon: GitBranch,
    color: 'text-purple-400',
  },
];

export interface LearningItem {
  name: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

export const learning: LearningItem[] = [
  {
    name: 'Matplotlib',
    desc: 'Data visualization in Python',
    icon: LineChart,
    color: 'text-emerald-400',
  },
  {
    name: 'Scikit Learn',
    desc: 'Machine learning fundamentals',
    icon: Brain,
    color: 'text-rose-400',
  },
  {
    name: 'PyTorch',
    desc: 'Deep learning framework',
    icon: Flame,
    color: 'text-red-400',
  },
];

export const databases = ['MySQL', 'PostgreSQL'];
