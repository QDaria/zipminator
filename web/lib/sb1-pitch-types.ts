export interface Slide {
  id: number;
  title: string;
  component: React.ComponentType;
}

export interface MetricData {
  value: string;
  label: string;
  sublabel?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'cyan' | 'amber' | 'rose' | 'emerald';
}

export interface BusinessCase {
  id: number;
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  roi: string;
  timeline: string;
  description: string;
  dataPoints: string[];
  accentColor: string;
}
