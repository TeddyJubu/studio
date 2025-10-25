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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const { toast } = useToast();
  const [chatbotName, setChatbotName] = useState('MastraMind');
  const [aiInstructions, setAiInstructions] = useState(
    "You are a helpful customer support assistant. You can help users with their inquiries and book appointments."
  );
  
  // HSL color values without the 'hsl()' wrapper
  const [primaryColor, setPrimaryColor] = useState('180 100% 25.1%');
  const [accentColor, setAccentColor] = useState('147 47% 49%');
  const [backgroundColor, setBackgroundColor] = useState('0 0% 100%');


  const handleSave = () => {
    // In a real application, you would save these settings to a database.
    // For this prototype, we'll just show a success message.
    console.log('Saving settings:', {
      chatbotName,
      aiInstructions,
      primaryColor,
      accentColor,
      backgroundColor,
    });
    
    // This is where you would apply the theme changes to globals.css
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--accent', accentColor);
    root.style.setProperty('--background', backgroundColor);


    toast({
      title: 'Settings Saved',
      description: 'Your chatbot customizations have been saved successfully.',
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-muted/40 p-4 sm:p-8">
      <div className="w-full max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Chatbot Dashboard</h1>
            <p className="text-muted-foreground">
              Customize and configure your AI assistant.
            </p>
          </div>
           <Button asChild variant="outline">
            <Link href="/">
              Back to Chat
            </Link>
          </Button>
        </header>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="appearance">
              <Palette className="mr-2 h-4 w-4" /> Appearance
            </TabsTrigger>
            <TabsTrigger value="configuration">
              <BotMessageSquare className="mr-2 h-4 w-4" /> Configuration
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your chat interface. Colors are in HSL format (e.g., 240 5.9% 10%).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: `hsl(${primaryColor})` }} />
                      <Input
                        id="primary-color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Used for main buttons, icons, and user messages.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accent-color">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: `hsl(${accentColor})` }} />
                      <Input
                        id="accent-color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Used for highlights and confirmed actions.</p>
                  </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: `hsl(${backgroundColor})` }} />
                      <Input
                        id="background-color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">The main background color for the chat page.</p>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration">
            <Card>
              <CardHeader>
                <CardTitle>Bot Configuration</CardTitle>
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
                  <Label htmlFor="ai-instructions">AI Instructions (System Prompt)</Label>
                  <Textarea
                    id="ai-instructions"
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    placeholder="e.g., You are a friendly assistant for a flower shop..."
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">This is the core prompt that guides the AI's behavior and personality.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
          
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
    </main>
  );
}
