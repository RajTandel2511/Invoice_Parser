import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  Play, 
  Square, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmailConfig {
  email: string;
  password: string;
  host: string;
  port: string;
}

interface MonitorStatus {
  isMonitoring: boolean;
  message: string;
}

export default function EmailMonitorPanel() {
  const [config, setConfig] = useState<EmailConfig>({
    email: 'fetcherinvoice@gmail.com',
    password: '',
    host: 'imap.gmail.com',
    port: '993'
  });
  
  const [status, setStatus] = useState<MonitorStatus>({
    isMonitoring: false,
    message: 'Email monitoring is inactive'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/status');
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };

  const testConnection = async () => {
    if (!config.email || !config.password) {
      toast({
        title: "Configuration Error",
        description: "Please enter email and password",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: "Email connection test passed!",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Failed to connect to email server",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Failed to test email connection",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = async () => {
    if (!config.email || !config.password) {
      toast({
        title: "Configuration Error",
        description: "Please enter email and password first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/start', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Monitoring Started",
          description: "Email monitoring is now active",
        });
        setLastCheck(new Date().toLocaleString());
        checkStatus();
      } else {
        toast({
          title: "Start Failed",
          description: data.message || "Failed to start email monitoring",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Start Error",
        description: "Failed to start email monitoring",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopMonitoring = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/stop', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Monitoring Stopped",
          description: "Email monitoring has been stopped",
        });
        checkStatus();
      } else {
        toast({
          title: "Stop Failed",
          description: data.message || "Failed to stop email monitoring",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Stop Error",
        description: "Failed to stop email monitoring",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailsNow = async () => {
    if (!config.email || !config.password) {
      toast({
        title: "Configuration Error",
        description: "Please enter email and password first",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://192.168.1.70:3002/api/email-monitor/check-now', {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Email Checked",
          description: "Email checking process initiated.",
        });
        setLastCheck(new Date().toLocaleString());
        checkStatus();
      } else {
        toast({
          title: "Check Failed",
          description: data.message || "Failed to initiate email checking process",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Check Error",
        description: "Failed to initiate email checking process",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Monitor Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={status.isMonitoring ? "default" : "secondary"}>
                  {status.isMonitoring ? "Active" : "Inactive"}
                </Badge>
                {status.isMonitoring && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Monitoring
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{status.message}</p>
              {lastCheck && (
                <p className="text-xs text-muted-foreground">
                  Last check: {lastCheck}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={startMonitoring}
                disabled={isLoading || status.isMonitoring}
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start
              </Button>
              <Button
                onClick={stopMonitoring}
                disabled={isLoading || !status.isMonitoring}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
              <Button
                onClick={checkEmailsNow}
                disabled={isLoading}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Check Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your-email@gmail.com"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password/App Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="host">IMAP Host</Label>
              <Input
                id="host"
                placeholder="imap.gmail.com"
                value={config.host}
                onChange={(e) => setConfig({ ...config, host: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                placeholder="993"
                value={config.port}
                onChange={(e) => setConfig({ ...config, port: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={isLoading || !config.email || !config.password}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The email monitor automatically checks for new emails every 5 minutes and processes 
              invoice attachments. Make sure to use an App Password for Gmail accounts with 2FA enabled.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>Supported Email Providers:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Gmail (recommended)</li>
              <li>Outlook/Hotmail</li>
              <li>Yahoo Mail</li>
              <li>Custom IMAP servers</li>
            </ul>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>What Gets Processed:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>System connects to: <strong>fetcherinvoice@gmail.com</strong></li>
              <li>Only processes emails FROM: <strong>raj2511tandel@gmail.com</strong></li>
              <li>All PDF and image attachments are automatically extracted</li>
              <li>Files displayed directly on this page (no saving to uploads)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
