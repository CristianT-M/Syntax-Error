import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, Code2, Users, Clock, Play, Search, 
  MoreHorizontal, Trash2, FolderOpen, ArrowLeft, 
  GitBranch, Sparkles, Activity 
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from '@/api/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const LANG_COLORS = {
  javascript: 'bg-amber-400',
  python: 'bg-emerald-400',
  rust: 'bg-orange-400',
  typescript: 'bg-blue-400',
  go: 'bg-cyan-400',
  cpp: 'bg-blue-500',
};

const LANG_LABELS = {
  javascript: 'JavaScript',
  python: 'Python',
  rust: 'Rust',
  typescript: 'TypeScript',
  go: 'Go',
  cpp: 'C++',
};

export default function Dashboard() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', language: 'javascript' });
  const queryClient = useQueryClient();

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiClient.entities.Room.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.entities.Room.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setCreateOpen(false);
      setNewRoom({ name: '', description: '', language: 'javascript' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.entities.Room.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rooms'] }),
  });

  const filteredRooms = rooms.filter(r => 
    r.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="font-bold text-sm">iTECify</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Caută proiecte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-56 text-xs bg-secondary/50"
              />
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 text-xs gap-1.5 bg-primary hover:bg-primary/90">
                  <Plus className="w-3.5 h-3.5" />
                  Proiect Nou
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-lg">Creează un proiect nou</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Nume proiect</Label>
                    <Input
                      placeholder="Ex: iTEC API Backend"
                      value={newRoom.name}
                      onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Descriere</Label>
                    <Input
                      placeholder="O scurtă descriere..."
                      value={newRoom.description}
                      onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Limbaj principal</Label>
                    <Select value={newRoom.language} onValueChange={(v) => setNewRoom({ ...newRoom, language: v })}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANG_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90"
                    onClick={() => createMutation.mutate(newRoom)}
                    disabled={!newRoom.name || createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Se creează...' : 'Creează Proiect'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Proiectele tale</h1>
          <p className="text-sm text-muted-foreground">Creează și colaborează pe proiecte în timp real</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-40 rounded-xl bg-secondary/30 animate-pulse" />
            ))}
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-medium text-muted-foreground mb-1">
              {search ? 'Niciun proiect găsit' : 'Niciun proiect încă'}
            </h3>
            <p className="text-sm text-muted-foreground/60 mb-4">
              {search ? 'Încearcă alt termen de căutare' : 'Creează primul tău proiect pentru a începe'}
            </p>
            {!search && (
              <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5 bg-primary hover:bg-primary/90">
                <Plus className="w-3.5 h-3.5" />
                Proiect Nou
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room, i) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-card/60 border-border hover:border-primary/30 transition-all group overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${LANG_COLORS[room.language] || 'bg-muted-foreground'}`} />
                      <h3 className="font-semibold text-sm truncate max-w-[180px]">{room.name}</h3>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          className="text-destructive text-xs"
                          onClick={() => deleteMutation.mutate(room.id)}
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Șterge
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {room.description && (
                      <p className="text-[11px] text-muted-foreground mb-3 line-clamp-2">{room.description}</p>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="h-5 text-[9px] border-border gap-1">
                        <GitBranch className="w-2.5 h-2.5" />
                        main
                      </Badge>
                      <Badge variant="outline" className="h-5 text-[9px] border-border gap-1">
                        {LANG_LABELS[room.language] || room.language}
                      </Badge>
                      {room.status === 'running' && (
                        <Badge className="h-5 text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                          <Activity className="w-2.5 h-2.5" />
                          Running
                        </Badge>
                      )}
                    </div>
                    <Link to="/editor">
                      <Button size="sm" variant="secondary" className="w-full h-7 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary">
                        <Play className="w-3 h-3" />
                        Deschide în Editor
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}