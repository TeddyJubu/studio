"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Palette, BotMessageSquare, Save, ArrowLeft, Bot, User, Send } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChatAvatar } from '@/components/chat/chat-avatar';


export default function DashboardPage() {
  const { toast } = useToast();
  
  // State for customizations
  const [chatbotName, setChatbotName] = useState('MastraMind');
  const [aiInstructions, setAiInstructions] = useState(
    "You are a helpful customer support assistant. You can help users with their inquiries and book appointments."
  );
  const [primaryColor, setPrimaryColor] = useState('180 100% 25.1%');
  const [backgroundColor, setBackgroundColor] = useState('0 0% 100%');
  const [font, setFont] = useState('Inter');

  // Live-updating styles for the preview
  const previewStyle = {
    '--primary': primaryColor,
    '--background': backgroundColor,
    fontFamily: font,
  } as React.CSSProperties;

  const handleSave = () => {
    // This is where you would apply the theme changes to globals.css
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--background', backgroundColor);

    // In a real app, you would also save font changes.
    document.body.style.fontFamily = font;

    toast({
      title: 'Settings Saved',
      description: 'Your chatbot customizations have been saved successfully.',
    });
  };

  return (
    <main className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="icon">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back to Chat</span>
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold">Chatbot Dashboard</h1>
              <p className="text-sm text-muted-foreground">Customize your AI assistant.</p>
            </div>
          </div>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto grid flex-1 gap-8 px-4 py-8 md:grid-cols-3 lg:grid-cols-5">
        
        {/* Settings Column */}
        <div className="flex flex-col gap-8 md:col-span-2 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" /> Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your chat interface. Colors are in HSL format.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: `hsl(${primaryColor})` }} />
                  <Input id="primary-color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: `hsl(${backgroundColor})` }} />
                  <Input id="background-color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="font">Font Family</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger id="font">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Inter, sans-serif">Inter</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Source Code Pro', monospace">Source Code Pro</SelectItem>
                    <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BotMessageSquare className="h-5 w-5" /> Configuration
              </CardTitle>
              <CardDescription>
                Define the name and core instructions for your AI chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chatbot-name">Chatbot Name</Label>
                <Input id="chatbot-name" value={chatbotName} onChange={(e) => setChatbotName(e.target.value)} placeholder="e.g., SupportBot" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ai-instructions">AI Instructions (System Prompt)</Label>
                <Textarea id="ai-instructions" value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} placeholder="e.g., You are a friendly assistant..." rows={5} />
                <p className="text-xs text-muted-foreground">This guides the AI's behavior and personality.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="md:col-span-1 lg:col-span-2">
           <Card className="sticky top-24">
             <CardHeader>
                <CardTitle>Live Preview</CardTitle>
             </CardHeader>
             <CardContent>
              <div
                className="overflow-hidden rounded-lg border bg-card shadow-sm"
                style={previewStyle}
              >
                {/* Preview Header */}
                <header className="flex items-center justify-between border-b p-3" style={{ backgroundColor: `hsl(${backgroundColor})`}}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `hsla(${primaryColor.split(' ')[0]}, 100%, 50%, 0.1)`, color: `hsl(${primaryColor})`}}>
                      <Bot className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: `hsl(${primaryColor})`}}>{chatbotName}</h2>
                      <p className="text-xs text-muted-foreground">Powered by AI</p>
                    </div>
                  </div>
                </header>

                {/* Preview Chat Area */}
                <div className="flex h-80 flex-col bg-background p-3" style={{ backgroundColor: `hsl(${backgroundColor})`}}>
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* Assistant Message */}
                    <div className="flex items-start gap-3">
                      <ChatAvatar role="assistant" />
                      <div className="max-w-md rounded-lg bg-muted p-2.5 text-sm">
                        <p>Hello! How can I help you today?</p>
                      </div>
                    </div>
                    {/* User Message */}
                    <div className="flex items-start justify-end gap-3">
                      <div className="max-w-md rounded-lg p-2.5 text-sm text-primary-foreground" style={{ backgroundColor: `hsl(${primaryColor})` }}>
                        <p>I have a question about my order.</p>
                      </div>
                      <ChatAvatar role="user" />
                    </div>
                  </div>
                  {/* Preview Input */}
                  <div className="relative mt-4 flex w-full items-center">
                    <Input placeholder="Type your message..." className="pr-10" disabled />
                    <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2" disabled style={{ backgroundColor: `hsl(${primaryColor})` }}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </main>
  );
}
