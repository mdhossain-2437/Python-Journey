import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Clock,
  Play,
  Settings,
  History,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RetrainingConfig {
  enabled: boolean;
  triggerType: "drift" | "schedule" | "performance" | "manual";
  driftThreshold: number;
  performanceThreshold: number;
  schedule: string;
  maxRetrainFrequency: number;
  autoPromote: boolean;
  notifyOnTrigger: boolean;
  rollbackOnFailure: boolean;
}

interface RetrainingHistory {
  id: string;
  triggeredAt: string;
  reason: string;
  status: "completed" | "failed" | "running";
  duration: string;
  metrics: {
    oldAccuracy: number;
    newAccuracy: number;
  };
}

const defaultConfig: RetrainingConfig = {
  enabled: true,
  triggerType: "drift",
  driftThreshold: 0.05,
  performanceThreshold: 0.90,
  schedule: "0 0 * * 0", // Weekly
  maxRetrainFrequency: 7,
  autoPromote: false,
  notifyOnTrigger: true,
  rollbackOnFailure: true,
};

const retrainingHistory: RetrainingHistory[] = [
  {
    id: "rt_001",
    triggeredAt: "2024-12-10T14:30:00Z",
    reason: "Data drift detected (0.08 > 0.05 threshold)",
    status: "completed",
    duration: "2h 15m",
    metrics: { oldAccuracy: 0.91, newAccuracy: 0.956 },
  },
  {
    id: "rt_002",
    triggeredAt: "2024-12-03T10:00:00Z",
    reason: "Weekly scheduled retraining",
    status: "completed",
    duration: "1h 45m",
    metrics: { oldAccuracy: 0.89, newAccuracy: 0.91 },
  },
  {
    id: "rt_003",
    triggeredAt: "2024-11-26T09:00:00Z",
    reason: "Performance below threshold (0.88 < 0.90)",
    status: "failed",
    duration: "45m",
    metrics: { oldAccuracy: 0.88, newAccuracy: 0.85 },
  },
];

export default function AutoRetraining() {
  const [config, setConfig] = useState<RetrainingConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1000));
    toast({ title: "Success", description: "Retraining configuration saved" });
    setSaving(false);
  };

  const handleTriggerRetrain = async () => {
    setTriggering(true);
    await new Promise(r => setTimeout(r, 2000));
    toast({ title: "Retraining Started", description: "Model retraining has been triggered" });
    setTriggering(false);
  };

  const updateConfig = (key: keyof RetrainingConfig, value: any) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <RefreshCw className="h-6 w-6 text-primary" />
            Auto-Retraining
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure automatic model retraining based on drift, performance, or schedule
          </p>
        </div>
        <button
          onClick={handleTriggerRetrain}
          disabled={triggering}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
        >
          {triggering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          Trigger Retrain
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="lg:col-span-2 border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <Label className="text-base font-medium">Enable Auto-Retraining</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically retrain models when triggers are detected
                </p>
              </div>
              <Switch
                checked={config.enabled}
                onCheckedChange={(v) => updateConfig("enabled", v)}
              />
            </div>

            {/* Trigger Type */}
            <div className="space-y-3">
              <Label>Trigger Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: "drift", label: "Data Drift", icon: TrendingDown },
                  { value: "performance", label: "Performance", icon: AlertTriangle },
                  { value: "schedule", label: "Schedule", icon: Clock },
                  { value: "manual", label: "Manual Only", icon: Settings },
                ].map((trigger) => (
                  <button
                    key={trigger.value}
                    onClick={() => updateConfig("triggerType", trigger.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors",
                      config.triggerType === trigger.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <trigger.icon className="h-5 w-5" />
                    <span className="text-sm font-medium">{trigger.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Drift Threshold */}
            {config.triggerType === "drift" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Drift Threshold</Label>
                  <span className="font-mono text-sm">{(config.driftThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={config.driftThreshold * 100}
                  onChange={(e) => updateConfig("driftThreshold", parseInt(e.target.value) / 100)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Trigger retraining when drift score exceeds this threshold
                </p>
              </div>
            )}

            {/* Performance Threshold */}
            {config.triggerType === "performance" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Minimum Performance</Label>
                  <span className="font-mono text-sm">{(config.performanceThreshold * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="99"
                  value={config.performanceThreshold * 100}
                  onChange={(e) => updateConfig("performanceThreshold", parseInt(e.target.value) / 100)}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Trigger retraining when accuracy falls below this threshold
                </p>
              </div>
            )}

            {/* Schedule */}
            {config.triggerType === "schedule" && (
              <div className="space-y-2">
                <Label>Cron Schedule</Label>
                <Input
                  value={config.schedule}
                  onChange={(e) => updateConfig("schedule", e.target.value)}
                  placeholder="0 0 * * 0"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Current: Weekly on Sunday at midnight
                </p>
              </div>
            )}

            {/* Advanced Options */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h4 className="font-medium">Advanced Options</h4>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Promote to Production</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically promote if new model is better
                  </p>
                </div>
                <Switch
                  checked={config.autoPromote}
                  onCheckedChange={(v) => updateConfig("autoPromote", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Notify on Trigger</Label>
                  <p className="text-xs text-muted-foreground">
                    Send notification when retraining starts
                  </p>
                </div>
                <Switch
                  checked={config.notifyOnTrigger}
                  onCheckedChange={(v) => updateConfig("notifyOnTrigger", v)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Rollback on Failure</Label>
                  <p className="text-xs text-muted-foreground">
                    Keep old model if new one performs worse
                  </p>
                </div>
                <Switch
                  checked={config.rollbackOnFailure}
                  onCheckedChange={(v) => updateConfig("rollbackOnFailure", v)}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Retrain Frequency (days)</Label>
                <Input
                  type="number"
                  value={config.maxRetrainFrequency}
                  onChange={(e) => updateConfig("maxRetrainFrequency", parseInt(e.target.value))}
                  min={1}
                  max={30}
                />
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-md font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save Configuration"
              )}
            </button>
          </CardContent>
        </Card>

        {/* Retraining History */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {retrainingHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-3 bg-muted/30 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded",
                    entry.status === "completed" && "bg-green-500/10 text-green-500",
                    entry.status === "failed" && "bg-red-500/10 text-red-500",
                    entry.status === "running" && "bg-blue-500/10 text-blue-500"
                  )}>
                    {entry.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {entry.status === "failed" && <XCircle className="h-3 w-3" />}
                    {entry.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                    {entry.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{entry.duration}</span>
                </div>
                <p className="text-sm">{entry.reason}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {(entry.metrics.oldAccuracy * 100).toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className={cn(
                    entry.metrics.newAccuracy > entry.metrics.oldAccuracy
                      ? "text-green-500"
                      : "text-red-500"
                  )}>
                    {(entry.metrics.newAccuracy * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.triggeredAt).toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

