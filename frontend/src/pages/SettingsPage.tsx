import { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe, Key, Database, Save } from 'lucide-react';
import { Button, Input, Select, Badge } from '../components/ui';
import { useToast } from '../components/Toast';
import { useAuthStore } from '../store/authStore';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { success } = useToast();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', icon: SettingsIcon, label: 'General' },
    { id: 'security', icon: Shield, label: 'Security' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'appearance', icon: Palette, label: 'Appearance' },
    { id: 'integrations', icon: Globe, label: 'Integrations' },
    { id: 'api-keys', icon: Key, label: 'API Keys' },
    { id: 'database', icon: Database, label: 'Database' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-56 flex-shrink-0">
          <nav className="bg-card border border-border rounded-xl p-2 space-y-1">
            {tabs.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === id ? 'bg-indigo-600/10 text-indigo-400' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
              <div className="space-y-4 max-w-lg">
                <Input label="Application Name" defaultValue="Backend Template" />
                <Input label="Admin Email" defaultValue={user?.email || ''} />
                <Select label="Language" value="en" onValueChange={() => {}} options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' }]} />
                <Select label="Timezone" value="UTC" onValueChange={() => {}} options={[{ value: 'UTC', label: 'UTC' }, { value: 'America/New_York', label: 'Eastern Time' }, { value: 'Europe/Madrid', label: 'Central European' }]} />
                <Button onClick={() => success('Settings saved')}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Security Settings</h2>
              <div className="space-y-4 max-w-lg">
                <Input label="Current Password" type="password" placeholder="Enter current password" />
                <Input label="New Password" type="password" placeholder="Enter new password" />
                <Input label="Confirm Password" type="password" placeholder="Confirm new password" />
                <Button onClick={() => success('Password updated')}>
                  <Save className="w-4 h-4" />
                  Update Password
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Notification Preferences</h2>
              <div className="space-y-4 max-w-lg">
                {[
                  { label: 'Email notifications', desc: 'Receive email alerts for critical events', defaultChecked: true },
                  { label: 'System alerts', desc: 'Get notified about system health issues', defaultChecked: true },
                  { label: 'Payment notifications', desc: 'Receive alerts for payment events', defaultChecked: false },
                  { label: 'Weekly digest', desc: 'Get a weekly summary of activity', defaultChecked: true },
                ].map(({ label, desc, defaultChecked }) => (
                  <div key={label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'api-keys' && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">API Keys</h2>
              <div className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Production Key</p>
                    <p className="text-xs font-mono text-muted-foreground mt-1">sk-••••••••••••••••••••••••••••abcd</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </div>
              <Button><Key className="w-4 h-4" /> Generate New Key</Button>
            </div>
          )}

          {['appearance', 'integrations', 'database'].includes(activeTab) && (
            <div className="py-16 text-center">
              <SettingsIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-foreground mb-1 capitalize">{activeTab}</h3>
              <p className="text-sm text-muted-foreground">Configuration coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
