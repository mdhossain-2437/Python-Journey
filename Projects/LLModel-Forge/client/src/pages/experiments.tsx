import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Clock, BarChart3, ArrowUpRight } from "lucide-react";

const runs = [
  { id: "exp_8921", name: "XGBoost_Optimized_v1", accuracy: 0.942, f1: 0.92, duration: "45m", status: "completed", date: "2024-02-10" },
  { id: "exp_8922", name: "ResNet50_Transfer", accuracy: 0.885, f1: 0.86, duration: "2h 15m", status: "failed", date: "2024-02-11" },
  { id: "exp_8923", name: "Bert_FineTune_Base", accuracy: 0.912, f1: 0.89, duration: "1h 20m", status: "completed", date: "2024-02-12" },
  { id: "exp_8924", name: "XGBoost_Optimized_v2", accuracy: 0.956, f1: 0.94, duration: "50m", status: "running", date: "2024-02-13" },
];

const chartData = [
  { epoch: 1, acc: 0.65, val_acc: 0.62 },
  { epoch: 2, acc: 0.72, val_acc: 0.68 },
  { epoch: 3, acc: 0.78, val_acc: 0.71 },
  { epoch: 4, acc: 0.82, val_acc: 0.75 },
  { epoch: 5, acc: 0.85, val_acc: 0.79 },
  { epoch: 6, acc: 0.88, val_acc: 0.81 },
  { epoch: 7, acc: 0.89, val_acc: 0.82 },
  { epoch: 8, acc: 0.91, val_acc: 0.83 },
  { epoch: 9, acc: 0.92, val_acc: 0.83 },
  { epoch: 10, acc: 0.94, val_acc: 0.84 },
];

export default function Experiments() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Experiment Tracking</h1>
          <p className="text-muted-foreground mt-2">Monitor training runs, compare metrics, and manage artifacts.</p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 border border-border bg-card hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium transition-colors">
             Compare Runs
           </button>
           <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
             New Experiment
           </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle>Training Metrics (Current Run)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                  <XAxis 
                    dataKey="epoch" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--popover))", 
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))"
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="acc" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} name="Accuracy" />
                  <Line type="monotone" dataKey="val_acc" stroke="hsl(var(--accent))" strokeWidth={2} name="Val Accuracy" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle>Top Performing Models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             {runs.slice(0, 3).map((run, i) => (
               <div key={run.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border/50 bg-background/50 hover:border-primary/50 transition-colors cursor-pointer">
                 <div className="flex items-center justify-between">
                   <span className="font-semibold text-sm">{run.name}</span>
                   <Badge variant="outline" className="text-[10px] h-5">{run.date}</Badge>
                 </div>
                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                   <span className="font-mono">{run.id}</span>
                   <span className={run.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}>{run.status}</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2 mt-2">
                   <div className="bg-muted/30 p-2 rounded">
                     <div className="text-[10px] text-muted-foreground uppercase">Accuracy</div>
                     <div className="font-mono text-sm font-bold text-primary">{run.accuracy}</div>
                   </div>
                   <div className="bg-muted/30 p-2 rounded">
                     <div className="text-[10px] text-muted-foreground uppercase">F1 Score</div>
                     <div className="font-mono text-sm font-bold">{run.f1}</div>
                   </div>
                 </div>
               </div>
             ))}
             <button className="w-full text-xs text-muted-foreground hover:text-primary flex items-center justify-center gap-1">
               View all runs <ArrowUpRight className="h-3 w-3" />
             </button>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/20">
          <h3 className="font-semibold">Recent Experiments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Run ID</th>
                <th className="px-4 py-3 font-medium">Experiment Name</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Metrics</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((run) => (
                <tr key={run.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{run.id}</td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      {run.name}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {run.duration}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3">
                      <span className="font-mono">acc: <span className="text-foreground font-bold">{run.accuracy}</span></span>
                      <span className="font-mono text-muted-foreground">f1: {run.f1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant="outline" className={`
                      ${run.status === 'completed' ? 'border-green-500/30 text-green-500' : ''}
                      ${run.status === 'failed' ? 'border-destructive/30 text-destructive' : ''}
                      ${run.status === 'running' ? 'border-blue-500/30 text-blue-500 animate-pulse' : ''}
                    `}>
                      {run.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
