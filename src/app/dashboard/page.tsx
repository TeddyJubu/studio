"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Palette, BotMessageSquare, Save } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { toast } = useToast();
  const [chatbotName, setChatbotName] = useState('MastraMind');
  const [aiInstructions, setAiInstructions] = useState(
    "You are a helpful customer support assistant. You can help users with their inquiries and book appointments."
  );
  const [primaryColor, setPrimaryColor] = useState('180 100% 25.1%');
  const [accentColor, setAccentColor] = useState('147 47% 49%');

  const handleSave = () => {
    // In a real application, you would save these settings to a database.
    // For this prototype, we'll just show a success message.
    console.log('Saving settings:', {
      chatbotName,
      aiInstructions,
      primaryColor,
      accentColor,
    });
    
    // This is where you would apply the theme changes to globals.css
    // For now, we will just log it.
    console.log(`
      Applying theme:
      --primary: ${primaryColor};
      --accent: ${accentColor};
    `);

    toast({
      title: 'Settings Saved',
      description: 'Your chatbot customizations have been saved successfully.',
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Chatbot Dashboard</h1>
            <p className="text-muted-foreground">
              Customize the look and feel of your AI assistant.
            </p>
          </div>
           <Button asChild variant="outline">
            <Link href="/">
              Back to Chat
            </Link>
          </Button>
        </header>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BotMessageSquare className="h-6 w-6" />
                Bot Configuration
              </CardTitle>
              <CardDescription>
                Define the name and core instructions for your AI chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chatbot-name">Chatbot Name</Label>
                <Input
                  id="chatbot-name"
                  value={chatbotName}
                  onChange={(e) => setChatbotName(e.target.value)}
                  placeholder="e.g., SupportBot"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-instructions">AI Instructions</Label>
                <Textarea
                  id="ai-instructions"
                  value={aiInstructions}
                  onChange={(e) => setAiInstructions(e.target.value)}
                  placeholder="e.g., You are a friendly assistant for a flower shop..."
                  rows={5}
                />
                 <p className="text-xs text-muted-foreground">This is the system prompt that guides the AI's behavior.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-6 w-6" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the colors of your chat interface. Colors are in HSL format.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <Input
                  id="primary-color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Used for main buttons, icons, and user messages.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color">Accent Color</Label>
                <Input
                  id="accent-color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                 <p className="text-xs text-muted-foreground">Used for highlights and confirmed actions.</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-end">
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
