import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Plus } from "lucide-react";

const features = [
  { id: "fs_001", name: "user_avg_session_duration", type: "float", entity: "user", status: "online", created: "2023-10-15" },
  { id: "fs_002", name: "transaction_count_7d", type: "integer", entity: "transaction", status: "online", created: "2023-10-20" },
  { id: "fs_003", name: "device_fingerprint_embedding", type: "vector<768>", entity: "device", status: "offline", created: "2023-11-01" },
  { id: "fs_004", name: "last_login_geo", type: "geopoint", entity: "user", status: "online", created: "2023-11-05" },
  { id: "fs_005", name: "product_category_affinity", type: "json", entity: "user", status: "archived", created: "2023-09-12" },
  { id: "fs_006", name: "cart_abandonment_rate", type: "float", entity: "session", status: "online", created: "2023-12-01" },
  { id: "fs_007", name: "email_domain_risk_score", type: "float", entity: "user", status: "staging", created: "2024-01-10" },
];

export default function FeatureStore() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFeatures = features.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.entity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Store</h1>
          <p className="text-muted-foreground mt-2">Manage, discover, and reuse machine learning features.</p>
        </div>
        <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Plus className="h-4 w-4" /> New Feature
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search features..." 
            className="pl-9 bg-card border-border"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 border border-border bg-card hover:bg-accent hover:text-accent-foreground px-4 py-2 rounded-md font-medium transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-md border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Feature Name</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Type</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Entity</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="font-mono text-xs uppercase tracking-wider text-right">Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeatures.map((feature) => (
              <TableRow key={feature.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono font-medium text-foreground">
                  <div className="flex flex-col">
                    <span>{feature.name}</span>
                    <span className="text-xs text-muted-foreground">{feature.id}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center rounded-sm bg-accent/10 px-2 py-1 text-xs font-medium text-accent ring-1 ring-inset ring-accent/20">
                    {feature.type}
                  </span>
                </TableCell>
                <TableCell>{feature.entity}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={`
                    ${feature.status === 'online' ? 'border-green-500/30 text-green-500 bg-green-500/5' : ''}
                    ${feature.status === 'offline' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : ''}
                    ${feature.status === 'archived' ? 'border-muted-foreground/30 text-muted-foreground bg-muted/5' : ''}
                    ${feature.status === 'staging' ? 'border-blue-500/30 text-blue-500 bg-blue-500/5' : ''}
                  `}>
                    {feature.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-muted-foreground">
                  {feature.created}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
