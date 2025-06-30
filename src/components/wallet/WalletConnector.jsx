import React, { useState } from "react";
import { Wallet, ChevronRight, Copy, ExternalLink, RefreshCw, AlertTriangle, Check } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

/**
 * Componente WalletConnector - Interface moderna para conexão de carteiras Web3
 * Implementado com Shadcn UI e seguindo a paleta de cores do BoletoXCrypto
 */
const WalletConnector = () => {
  // Estados para controlar os diferentes passos do fluxo de conexão
  const [currentScreen, setCurrentScreen] = useState("initial");
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState("polygon");

  // Dados simulados para demonstração
  const wallets = [
    { id: "metamask", name: "MetaMask", icon: "https://cdn.iconscout.com/icon/free/png-256/metamask-2728406-2261817.png" },
    { id: "rabby", name: "Rabby", icon: "https://rabby.io/assets/logo.svg" },
    { id: "trust", name: "Trust Wallet", icon: "https://trustwallet.com/assets/images/favicon.ico" },
    { id: "walletconnect", name: "WalletConnect", icon: "https://walletconnect.com/walletconnect-logo.png" },
  ];

  const addresses = [
    { address: "0x1234...5678", ens: "usuario.eth" },
    { address: "0xabcd...efgh" },
    { address: "0x9876...5432", ens: "boleto.eth" },
  ];

  const networks = {
    polygon: {
      name: "Polygon",
      icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      chainId: 137
    },
    polygonAmoy: {
      name: "Polygon Amoy",
      icon: "https://cryptologos.cc/logos/polygon-matic-logo.png",
      chainId: 80002
    }
  };

  // Funções para manipular os eventos de conexão
  const handleSelectWallet = (wallet) => {
    setSelectedWallet(wallet);
    setCurrentScreen("select-address");
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
    setCurrentScreen("connected");
  };

  const handleSwitchNetwork = () => {
    setCurrentNetwork("polygonAmoy");
  };

  const handleDisconnect = () => {
    setCurrentScreen("disconnected");
    setSelectedWallet(null);
    setSelectedAddress(null);
  };

  const handleReconnect = () => {
    setCurrentScreen("initial");
  };

  // Renderização condicional baseada no estado atual
  const renderScreen = () => {
    switch (currentScreen) {
      case "initial":
        return (
          <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-primary-bg rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>Conecte sua Carteira</CardTitle>
              <CardDescription>
                Conecte-se para acessar todas as funcionalidades do BoletoXCrypto
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => setCurrentScreen("select-wallet")}
              >
                Conectar Carteira
              </Button>
            </CardFooter>
          </Card>
        );

      case "select-wallet":
        return (
          <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Selecione sua Carteira</CardTitle>
              <CardDescription>
                Escolha uma das carteiras disponíveis para conectar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-primary-bg hover:border-primary transition-colors"
                  onClick={() => handleSelectWallet(wallet)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={wallet.icon} alt={wallet.name} />
                      <AvatarFallback>{wallet.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <span>{wallet.name}</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCurrentScreen("initial")}
              >
                Voltar
              </Button>
            </CardFooter>
          </Card>
        );

      case "select-address":
        return (
          <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center space-x-2 mb-4">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedWallet.icon} alt={selectedWallet.name} />
                  <AvatarFallback>{selectedWallet.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">{selectedWallet.name}</span>
              </div>
              <CardTitle>Selecione um Endereço</CardTitle>
              <CardDescription>
                Escolha qual endereço deseja utilizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-primary-bg hover:border-primary transition-colors"
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{address.address}</span>
                    {address.ens && (
                      <span className="text-sm text-muted-foreground">{address.ens}</span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setCurrentScreen("select-wallet")}
              >
                Voltar
              </Button>
            </CardFooter>
          </Card>
        );

      case "connected":
        return (
          <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Carteira Conectada</CardTitle>
                <div className="flex items-center space-x-1 text-primary text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Conectado</span>
                </div>
              </div>
              <CardDescription>
                Sua carteira está conectada ao BoletoXCrypto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedWallet.icon} alt={selectedWallet.name} />
                  <AvatarFallback>{selectedWallet.name.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{selectedWallet.name}</span>
                  <span className="text-sm text-muted-foreground">Carteira Web3</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Endereço</span>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted rounded-md text-sm font-mono">
                  {selectedAddress.address}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Rede</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={networks[currentNetwork].icon} alt={networks[currentNetwork].name} />
                    <AvatarFallback>{networks[currentNetwork].name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{networks[currentNetwork].name}</span>
                </div>
              </div>

              {currentNetwork === "polygon" && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Rede incorreta</AlertTitle>
                  <AlertDescription>
                    Para utilizar o BoletoXCrypto, você precisa estar na rede Polygon Amoy.
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-2 w-full" 
                      onClick={handleSwitchNetwork}
                    >
                      Trocar para Polygon Amoy
                    </Button>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive" 
                onClick={handleDisconnect}
              >
                Desconectar
              </Button>
            </CardFooter>
          </Card>
        );

      case "disconnected":
        return (
          <Card className="w-full max-w-md mx-auto transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Carteira Desconectada</CardTitle>
              <CardDescription>
                Sua carteira foi desconectada com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="success">
                <Check className="h-4 w-4" />
                <AlertDescription>
                  Você desconectou sua carteira com sucesso. Seus dados foram removidos desta sessão.
                </AlertDescription>
              </Alert>
              <p className="text-center text-muted-foreground">
                Clique no botão abaixo para reconectar sua carteira
              </p>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleReconnect}>
                Reconectar
              </Button>
            </CardFooter>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {renderScreen()}
      {currentScreen !== "initial" && currentScreen !== "disconnected" && (
        <p className="text-center text-xs text-muted-foreground mt-4">
          BoletoXCrypto nunca solicitará sua frase de recuperação ou chaves privadas.
        </p>
      )}
    </div>
  );
};

export default WalletConnector;
