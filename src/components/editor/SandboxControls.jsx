import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Square, RefreshCw, Shield, Cpu, HardDrive, Activity, AlertTriangle, CheckCircle2, Container } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SandboxControls() {
  const [status, setStatus] = useState('idle'); // idle, building, scanning, running, error
  const [cpuUsage, setCpuUsage] = useState(0);
  const [memUsage, setMemUsage] = useState(0);
  const [scanResult, setScanResult] = useState(null);

  // Simulate resource usage when running
  useEffect(() => {
    if (status !== 'running') return;
    const interval = setInterval(() => {
      setCpuUsage(Math.min(100, Math.max(5, cpuUsage + (Math.random() * 20 - 10))));
      setMemUsage(Math.min(100, Math.max(10, memUsage + (Math.random() * 10 - 5))));
    }, 1500);
    return () => clearInterval(interval);
  }, [status, cpuUsage, memUsage]);

  const handleRun = async () => {
    // Step 1: Scan
    setStatus('scanning');
    setScanResult(null);
    await new Promise(r => setTimeout(r, 1200));
    setScanResult({ safe: true, issues: 0 });

    // Step 2: Build
    setStatus('building');
    await new Promise(r => setTimeout(r, 1800));

    // Step 3: Run
    setStatus('running');
    setCpuUsage(25);
    setMemUsage(35);
  };

  const handleStop = () => {
    setStatus('idle');
    setCpuUsage(0);
    setMemUsage(0);
    setScanResult(null);
  };

  const statusConfig = {
    idle: { color: 'text-muted-foreground', label: 'Ready', icon: Container },
    scanning: { color: 'text-amber-400', label: 'Scanning...', icon: Shield },
    building: { color: 'text-primary', label: 'Building image...', icon: RefreshCw },
    running: { color: 'text-emerald-400', label: 'Running', icon: Activity },
    error: { color: 'text-destructive', label: 'Error', icon: AlertTriangle },
  };

  const { color, label, icon: StatusIcon } = statusConfig[status];

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {/* Run/Stop button */}
        {status === 'running' ? (
          <Button
            size="sm"
            variant="destructive"
            className="h-7 px-3 text-xs gap-1.5"
            onClick={handleStop}
          >
            <Square className="w-3 h-3" />
            Stop
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-7 px-3 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleRun}
            disabled={status === 'scanning' || status === 'building'}
          >
            {status === 'scanning' || status === 'building' ? (
              <RefreshCw className="w-3 h-3 animate-spin" />
            ) : (
              <Play className="w-3 h-3" />
            )}
            {status === 'idle' ? 'Run' : label}
          </Button>
        )}

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <StatusIcon className={`w-3 h-3 ${color} ${status === 'building' ? 'animate-spin' : ''}`} />
          <span className={`text-[10px] font-medium ${color}`}>{label}</span>
        </div>

        {/* Security scan result */}
        <AnimatePresence>
          {scanResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="outline" className={`h-5 text-[9px] gap-1 ${scanResult.safe ? 'border-emerald-500/30 text-emerald-400' : 'border-destructive/30 text-destructive'}`}>
                    {scanResult.safe ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertTriangle className="w-2.5 h-2.5" />}
                    {scanResult.safe ? 'Secure' : `${scanResult.issues} issues`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>Code scan: No vulnerabilities detected</TooltipContent>
              </Tooltip>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resource monitors */}
        {status === 'running' && (
          <div className="flex items-center gap-3 ml-2">
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3 h-3 text-muted-foreground" />
                  <div className="w-16">
                    <Progress value={cpuUsage} className="h-1.5" />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono w-8">{Math.round(cpuUsage)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>CPU Usage (limit: 50%)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3 h-3 text-muted-foreground" />
                  <div className="w-16">
                    <Progress value={memUsage} className="h-1.5" />
                  </div>
                  <span className="text-[9px] text-muted-foreground font-mono w-8">{Math.round(memUsage)}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>Memory Usage (limit: 512MB)</TooltipContent>
            </Tooltip>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}