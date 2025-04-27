import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import PageTitle from '@/components/PageTitle';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { web3MailService } from '@/services/web3MailService';

const SettingsPage = () => {
  const { toast } = useToast();
  const [emailAddress, setEmailAddress] = useState('');
  const [networkDomain, setNetworkDomain] = useState('');
  const [inboxAddresses, setInboxAddresses] = useState<Record<string, string>>({});
  const [newInboxName, setNewInboxName] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [networks, setNetworks] = useState<string[]>([]);
  const [currentNetwork, setCurrentNetwork] = useState('');
  
  useEffect(() => {
    const loadSettings = async () => {
      // Check if wallet is connected
      const isConnected = web3MailService.isWalletConnected();
      setWalletConnected(isConnected);
      
      // Get current email address
      const email = web3MailService.getEmailAddress();
      setEmailAddress(email || '');
      
      // Get available networks
      const availableNetworks = web3MailService.getAvailableNetworks();
      setNetworks(availableNetworks);
      
      // Get current network domain
      const domain = web3MailService.getCurrentNetworkDomain();
      setNetworkDomain(domain);
      setCurrentNetwork(domain);
      
      // Get inbox addresses
      const addresses = web3MailService.getInboxAddresses();
      setInboxAddresses(addresses);
    };
    
    loadSettings();
  }, []);
  
  const handleConnectWallet = async () => {
    try {
      const connected = await web3MailService.connectWallet();
      setWalletConnected(connected);
      
      if (connected) {
        toast({
          title: "Wallet connected",
          description: "Your wallet has been connected successfully."
        });
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const handleSetEmailAddress = async () => {
    if (!emailAddress) {
      toast({
        title: "Email required",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await web3MailService.setEmailAddress(emailAddress);
      if (success) {
        toast({
          title: "Email updated",
          description: "Your email address has been updated successfully."
        });
      } else {
        throw new Error("Failed to set email address");
      }
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update email address.",
        variant: "destructive"
      });
    }
  };
  
  const handleCreateInboxAddress = async () => {
    if (!newInboxName || newInboxName.trim() === '') {
      toast({
        title: "Name required",
        description: "Please enter a name for your inbox address.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const success = await web3MailService.registerInboxAddress(newInboxName);
      if (success) {
        // Refresh inbox addresses
        const addresses = web3MailService.getInboxAddresses();
        setInboxAddresses(addresses);
        setNewInboxName('');
        
        toast({
          title: "Inbox created",
          description: `Your new inbox address ${newInboxName}@${networkDomain} has been created.`
        });
      } else {
        throw new Error("Failed to create inbox address");
      }
    } catch (error) {
      toast({
        title: "Creation failed",
        description: error instanceof Error ? error.message : "Failed to create inbox address.",
        variant: "destructive"
      });
    }
  };
  
  const handleGenerateUniqueInbox = async () => {
    try {
      const address = await web3MailService.generateUniqueInboxAddress();
      if (address) {
        // Refresh inbox addresses
        const addresses = web3MailService.getInboxAddresses();
        setInboxAddresses(addresses);
        
        toast({
          title: "Inbox generated",
          description: `Your unique inbox address ${address} has been created.`
        });
      } else {
        throw new Error("Failed to generate unique inbox address");
      }
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate inbox address.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="flex h-screen bg-black overflow-hidden">
      <PageTitle title="Mail Settings" />
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-white gradient-text">Mail Settings</h1>
          
          <div className="bg-neutral-900 rounded-lg border border-neutral-800 shadow-lg overflow-hidden p-6">
            <Tabs defaultValue="account">
              <TabsList className="mb-6">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="inbox">Inbox Addresses</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                    <CardDescription>
                      Manage your wallet connection and email address
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Wallet Connection</h3>
                      {!walletConnected ? (
                        <Button onClick={handleConnectWallet} className="bg-indigo-600 hover:bg-indigo-700">
                          Connect Wallet
                        </Button>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-green-500 mr-2">●</span>
                          <span>Wallet Connected</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Email Address</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="username@network"
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <Button onClick={handleSetEmailAddress} className="bg-indigo-600 hover:bg-indigo-700">
                          Save
                        </Button>
                      </div>
                      <p className="text-sm text-neutral-400 mt-1">
                        Format: username@{networkDomain} (e.g., myname@{networkDomain})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="inbox">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardHeader>
                    <CardTitle>Inbox Addresses</CardTitle>
                    <CardDescription>
                      Manage your inbox addresses for receiving mail
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Create New Inbox</h3>
                      <div className="flex gap-2">
                        <Input
                          placeholder="inbox name"
                          value={newInboxName}
                          onChange={(e) => setNewInboxName(e.target.value)}
                          className="bg-neutral-800 border-neutral-700"
                        />
                        <Button onClick={handleCreateInboxAddress} className="bg-indigo-600 hover:bg-indigo-700">
                          Create
                        </Button>
                      </div>
                      <p className="text-sm text-neutral-400 mt-1">
                        Your inbox will be: {newInboxName ? `${newInboxName}@${networkDomain}` : `username@${networkDomain}`}
                      </p>
                    </div>
                    
                    <div className="pt-2">
                      <Button variant="outline" onClick={handleGenerateUniqueInbox}>
                        Generate Unique Inbox
                      </Button>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Your Inbox Addresses</h3>
                      {Object.keys(inboxAddresses).length > 0 ? (
                        <ul className="space-y-2">
                          {Object.keys(inboxAddresses).map((address) => (
                            <li key={address} className="p-3 border border-neutral-800 rounded bg-neutral-800">
                              {address}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-neutral-400">You don't have any inbox addresses yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="network">
                <Card className="bg-neutral-900 border-neutral-800">
                  <CardHeader>
                    <CardTitle>Network Settings</CardTitle>
                    <CardDescription>
                      Configure blockchain network preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Current Network</h3>
                      <p>Your current network is: <strong className="text-indigo-400">{currentNetwork}</strong></p>
                    </div>
                    
                    <div className="pt-4">
                      <h3 className="text-lg font-medium mb-2">Available Networks</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {networks.map((network) => (
                          <Button
                            key={network}
                            variant={network === currentNetwork ? "default" : "outline"}
                            className={`w-full justify-start ${network === currentNetwork ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                            disabled={network === currentNetwork}
                          >
                            {network}
                          </Button>
                        ))}
                      </div>
                      <p className="text-sm text-neutral-400 mt-2">
                        Network switching coming soon
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage; 