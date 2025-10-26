"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Palette, BotMessageSquare, Save, ArrowLeft, Bot, User, Send, Upload, Sparkles, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn, hexToHsl } from '@/lib/utils';
import { ChatAvatar } from '@/components/chat/chat-avatar';
import { generateAvatar } from '@/app/actions';

export default function DashboardPage() {
  const { toast } = useToast();
  
  // State for customizations
  const [chatbotName, setChatbotName] = useState('MastraMind');
  const [aiInstructions, setAiInstructions] = useState(
    "You are a helpful customer support assistant. You can help users with their inquiries and book appointments."
  );
  const [primaryColorHex, setPrimaryColorHex] = useState('#008080');
  const [backgroundColorHex, setBackgroundColorHex] = useState('#ffffff');
  const [textColorHex, setTextColorHex] = useState('#1e293b');
  const [font, setFont] = useState('Inter');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarPrompt, setAvatarPrompt] = useState('A friendly, abstract robot');
  const [isGenerating, setIsGenerating] = useState(false);

  const primaryColorHsl = useMemo(() => hexToHsl(primaryColorHex), [primaryColorHex]);
  const backgroundColorHsl = useMemo(() => hexToHsl(backgroundColorHex), [backgroundColorHex]);
  const textColorHsl = useMemo(() => hexToHsl(textColorHex), [textColorHex]);

  // Live-updating styles for the preview
  const previewStyle = {
    '--primary': primaryColorHsl,
    '--background': backgroundColorHsl,
    '--foreground': textColorHsl,
    fontFamily: font,
  } as React.CSSProperties;

  const handleSave = () => {
    // This is where you would apply the theme changes to globals.css
    const root = document.documentElement;
    root.style.setProperty('--primary', primaryColorHsl);
    root.style.setProperty('--background', backgroundColorHsl);
    root.style.setProperty('--foreground', textColorHsl);

    // In a real app, you would also save font changes.
    document.body.style.fontFamily = font;

    toast({
      title: 'Settings Saved',
      description: 'Your chatbot customizations have been saved successfully.',
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter a prompt for the avatar.',
      });
      return;
    }
    setIsGenerating(true);
    try {
      const { avatarUrl } = await generateAvatar(avatarPrompt);
      setAvatar(avatarUrl);
      toast({
        title: 'Avatar Generated',
        description: 'Your new AI-powered avatar is ready!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Generation Failed',
        description: 'Could not generate an avatar. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
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
                Customize the look and feel of your chat interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="relative flex items-center">
                  <Input type="color" value={primaryColorHex} onChange={(e) => setPrimaryColorHex(e.target.value)} className="absolute left-1 h-8 w-8 cursor-pointer appearance-none border-none bg-transparent p-0" />
                  <Input value={primaryColorHex} onChange={(e) => setPrimaryColorHex(e.target.value)} placeholder="#008080" className="pl-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="relative flex items-center">
                  <Input type="color" value={backgroundColorHex} onChange={(e) => setBackgroundColorHex(e.target.value)} className="absolute left-1 h-8 w-8 cursor-pointer appearance-none border-none bg-transparent p-0" />
                  <Input value={backgroundColorHex} onChange={(e) => setBackgroundColorHex(e.target.value)} placeholder="#ffffff" className="pl-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Text Color</Label>
                <div className="relative flex items-center">
                  <Input type="color" value={textColorHex} onChange={(e) => setTextColorHex(e.target.value)} className="absolute left-1 h-8 w-8 cursor-pointer appearance-none border-none bg-transparent p-0" />
                  <Input value={textColorHex} onChange={(e) => setTextColorHex(e.target.value)} placeholder="#1e293b" className="pl-11" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="font">Font Family</Label>
                <Select value={font} onValueChange={setFont}>
                  <SelectTrigger id="font">
                    <SelectValue placeholder="Select a font" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="'Inter', sans-serif">Inter</SelectItem>
                    <SelectItem value="'Roboto', sans-serif">Roboto</SelectItem>
                    <SelectItem value="'Source Code Pro', monospace">Source Code Pro</SelectItem>
                    <SelectItem value="'Lato', sans-serif">Lato</SelectItem>
                    <SelectItem value="'Montserrat', sans-serif">Montserrat</SelectItem>
                    <SelectItem value="'Open Sans', sans-serif">Open Sans</SelectItem>
                    <SelectItem value="'Nunito', sans-serif">Nunito</SelectItem>
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
                Define the name, instructions, and avatar for your AI chatbot.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="chatbot-name">Chatbot Name</Label>
                <Input id="chatbot-name" value={chatbotName} onChange={(e) => setChatbotName(e.target.value)} placeholder="e.g., SupportBot" />
              </div>

               <div className="space-y-2">
                <Label>Chatbot Avatar</Label>
                <div className="flex items-center gap-4">
                  <ChatAvatar role="assistant" src={avatar} className="h-16 w-16" />
                  <div className="grid w-full gap-2">
                     <Button asChild variant="outline">
                       <label htmlFor="avatar-upload" className="cursor-pointer">
                         <Upload className="mr-2 h-4 w-4" />
                         Upload Image
                         <input id="avatar-upload" type="file" className="sr-only" accept="image/*" onChange={handleAvatarUpload} />
                       </label>
                     </Button>
                     <div className="relative">
                       <Input 
                         value={avatarPrompt} 
                         onChange={e => setAvatarPrompt(e.target.value)} 
                         placeholder="e.g. A friendly, abstract robot" 
                         disabled={isGenerating}
                       />
                        <Button 
                          size="sm" 
                          className="absolute right-1 top-1/2 -translate-y-1/2" 
                          onClick={handleGenerateAvatar}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                           <span className="sr-only">Generate</span>
                        </Button>
                     </div>
                  </div>
                </div>
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
                className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm"
                style={previewStyle}
              >
                {/* Preview Header */}
                <header className="flex items-center justify-between border-b p-3" style={{ backgroundColor: `hsl(${backgroundColorHsl})`}}>
                  <div className="flex items-center gap-3">
                    <ChatAvatar role="assistant" src={avatar} />
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: `hsl(${primaryColorHsl})`}}>{chatbotName}</h2>
                      <p className="text-xs" style={{color: `hsl(${textColorHsl})`, opacity: 0.6}}>Powered by AI</p>
                    </div>
                  </div>
                </header>

                {/* Preview Chat Area */}
                <div className="flex h-80 flex-col p-3" style={{ backgroundColor: `hsl(${backgroundColorHsl})`}}>
                  <div className="flex-1 space-y-4 overflow-y-auto">
                    {/* Assistant Message */}
                    <div className="flex items-start gap-3">
                      <ChatAvatar role="assistant" src={avatar} />
                      <div className="max-w-md rounded-lg bg-muted p-2.5 text-sm" style={{ color: `hsl(${textColorHsl})`}}>
                        <p>Hello! How can I help you today?</p>
                      </div>
                    </div>
                    {/* User Message */}
                    <div className="flex items-start justify-end gap-3">
                      <div className="max-w-md rounded-lg p-2.5 text-sm text-primary-foreground" style={{ backgroundColor: `hsl(${primaryColorHsl})` }}>
                        <p>I have a question about my order.</p>
                      </div>
                      <ChatAvatar role="user" />
                    </div>
                  </div>
                  {/* Preview Input */}
                  <div className="relative mt-4 flex w-full items-center">
                    <Input placeholder="Type your message..." className="pr-10" disabled style={{color: `hsl(${textColorHsl})`}} />
                    <Button type="submit" size="icon" className="absolute right-1.5 top-1/2 h-7 w-7 -translate-y-1/2" disabled style={{ backgroundColor: `hsl(${primaryColorHsl})` }}>
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
