'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Search, FileText, AlertCircle, Loader2, MessageSquare, Check, CheckCheck } from 'lucide-react';
import { whatsappApi } from '@/lib/api/whatsapp';
import { conversationsApi, type Conversation, type Message } from '@/lib/api/conversations';
import { useAuthStore } from '@/lib/store/auth-store';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  components: Array<{
    type: string;
    format?: string;
    text?: string;
  }>;
}

export default function MessagesPage() {
  const { currentCompany } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateData, setSelectedTemplateData] = useState<WhatsAppTemplate | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch available templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['whatsapp-templates', currentCompany],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return whatsappApi.getTemplates(currentCompany);
    },
    enabled: !!currentCompany,
    retry: 1,
  });

  const approvedTemplates = templatesData?.templates?.filter(
    (t: WhatsAppTemplate) => t.status === 'APPROVED'
  ) || [];

  // Fetch conversations
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ['conversations', currentCompany],
    queryFn: async () => {
      if (!currentCompany) {
        throw new Error('No company selected');
      }
      return conversationsApi.getAll(currentCompany);
    },
    enabled: !!currentCompany,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Fetch messages for selected conversation
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    refetch: refetchMessages,
  } = useQuery({
    queryKey: ['conversation-messages', currentCompany, selectedContactId],
    queryFn: async () => {
      if (!currentCompany || !selectedContactId) {
        throw new Error('No company or contact selected');
      }
      return conversationsApi.getMessages(currentCompany, selectedContactId);
    },
    enabled: !!currentCompany && !!selectedContactId,
    refetchInterval: 3000, // Refresh every 3 seconds for active conversation
  });

  const conversations = conversationsData?.data || [];
  const messages = messagesData?.data || [];
  const selectedConversation = conversations.find(
    (c: Conversation) => c.contactId === selectedContactId
  );

  // Filter conversations by search query
  const filteredConversations = conversations.filter((conv: Conversation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.contact.phone.toLowerCase().includes(query) ||
      (conv.contact.name && conv.contact.name.toLowerCase().includes(query))
    );
  });

  const handleSendText = async () => {
    if (!currentCompany || !phoneNumber || !message) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await whatsappApi.sendText(currentCompany, phoneNumber, message);
      setMessage('');
      setSuccess(result.note || 'Message sent successfully!');
      setTimeout(() => setSuccess(null), 5000);
      // Refresh conversations and messages
      refetchConversations();
      if (selectedContactId) {
        refetchMessages();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Failed to send message';
      setError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    // Find the template data to get its language code
    const template = approvedTemplates.find((t: WhatsAppTemplate) => t.name === templateName);
    setSelectedTemplateData(template || null);
    setError(null); // Clear any previous errors
  };

  const handleSendTemplate = async () => {
    if (!currentCompany || !phoneNumber || !selectedTemplate || !selectedTemplateData) return;

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the template's actual language code from Meta
      const languageCode = selectedTemplateData.language || 'en';
      
      const result = await whatsappApi.sendTemplate(
        currentCompany,
        phoneNumber,
        selectedTemplate,
        languageCode
      );
      setSelectedTemplate('');
      setSelectedTemplateData(null);
      setSuccess(result.note || 'Template message sent successfully!');
      setTimeout(() => setSuccess(null), 5000);
      // Refresh conversations and messages
      refetchConversations();
      if (selectedContactId) {
        refetchMessages();
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMsg = err.response?.data?.message || 'Failed to send template message';
      setError(errorMsg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-600 mt-2">Send and manage WhatsApp messages</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-8">
                  {searchQuery ? 'No conversations found' : 'No conversations yet. Send a message to start!'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {filteredConversations.map((conversation: Conversation) => {
                    const lastMessage = conversation.messages[0];
                    const isSelected = conversation.contactId === selectedContactId;
                    
                    return (
                      <div
                        key={conversation.id}
                        onClick={() => {
                          setSelectedContactId(conversation.contactId);
                          setPhoneNumber(conversation.contact.phone);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-gray-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {conversation.contact.name || conversation.contact.phone}
                            </p>
                            {lastMessage && (
                              <p className="text-xs text-gray-500 truncate mt-1">
                                {lastMessage.direction === 'OUTBOUND' && 'You: '}
                                {lastMessage.content || `[${lastMessage.type}]`}
                              </p>
                            )}
                          </div>
                          {lastMessage && (
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            {selectedContactId && selectedConversation ? (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="font-semibold">
                    {selectedConversation.contact.name || selectedConversation.contact.phone}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedConversation.contact.phone}</p>
                </div>

                {/* Messages Display */}
                <div className="border rounded-lg p-4 h-[400px] overflow-y-auto bg-gray-50 space-y-3">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start the conversation!
                    </div>
                  ) : (
                    messages.map((msg: Message) => {
                      const isOutbound = msg.direction === 'OUTBOUND';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isOutbound
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content || `[${msg.type}]`}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isOutbound && (
                                <span className="ml-1">
                                  {msg.status === 'READ' ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : msg.status === 'DELIVERED' ? (
                                    <CheckCheck className="h-3 w-3 opacity-50" />
                                  ) : (
                                    <Check className="h-3 w-3 opacity-50" />
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input - Simplified for selected conversation */}
                <div className="space-y-3">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="bg-green-50 border-green-200">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1 min-h-[80px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
                          e.preventDefault();
                          handleSendText();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendText}
                      disabled={isSending || !message.trim()}
                      size="lg"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Select a conversation from the list to view messages</p>
                  <p className="text-sm mt-2">Or send a new message below</p>
                </div>

                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">Text Message</TabsTrigger>
                    <TabsTrigger value="template">Template Message</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4 mt-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert className="bg-green-50 border-green-200">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <Label htmlFor="phone-text">Phone Number</Label>
                      <Input
                        id="phone-text"
                        placeholder="+1234567890"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use international format (e.g., +1234567890)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="message-text">Message</Label>
                      <Textarea
                        id="message-text"
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="mt-1 min-h-[200px]"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Note: Free-form messages can only be sent within 24 hours of the last message from the recipient.
                        For new conversations, use a template message first.
                      </p>
                    </div>

                    <Button
                      onClick={handleSendText}
                      disabled={isSending || !phoneNumber || !message}
                      className="w-full"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </TabsContent>

              <TabsContent value="template" className="space-y-4 mt-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertDescription className="text-green-800">{success}</AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Template messages are required to start new conversations. They can be sent anytime,
                    even outside the 24-hour window.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="phone-template">Phone Number</Label>
                  <Input
                    id="phone-template"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use international format (e.g., +1234567890)
                  </p>
                </div>

                <div>
                  <Label htmlFor="template-select">Select Template</Label>
                  {isLoadingTemplates ? (
                    <div className="flex items-center justify-center py-4 mt-1">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-gray-500">Loading templates...</span>
                    </div>
                  ) : approvedTemplates.length === 0 ? (
                    <div className="mt-1 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        No approved templates found. Please create and approve templates in Meta Business Manager first.
                      </p>
                    </div>
                  ) : (
                    <>
                      <Select
                        value={selectedTemplate}
                        onValueChange={handleTemplateSelect}
                      >
                        <SelectTrigger id="template-select" className="mt-1">
                          <SelectValue placeholder="Choose a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedTemplates.map((template: WhatsAppTemplate) => (
                            <SelectItem key={template.id} value={template.name}>
                              <div className="flex flex-col">
                                <span>{template.name}</span>
                                <span className="text-xs text-gray-500">
                                  {template.category} • {template.language.toUpperCase()}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Only approved templates can be sent. Language will be automatically set from the template.
                      </p>
                    </>
                  )}
                </div>

                {selectedTemplateData && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm font-medium text-blue-900">Selected Template:</p>
                    <p className="text-sm text-blue-700 mt-1">
                      <strong>Name:</strong> {selectedTemplateData.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Language:</strong> {selectedTemplateData.language.toUpperCase()}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Category:</strong> {selectedTemplateData.category}
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleSendTemplate}
                  disabled={isSending || !phoneNumber || !selectedTemplate || isLoadingTemplates}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Send Template Message
                    </>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



