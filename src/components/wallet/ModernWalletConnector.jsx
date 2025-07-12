import React, { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Wallet, ChevronRight, Copy, ExternalLink, RefreshCw, AlertTriangle, Check } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "./ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";

/**
 * ModernWalletConnector - Componente de conexão de carteiras com Shadcn UI
 * Integra o design moderno do Shadcn UI com a funcionalidade do Wagmi/RainbowKit
 */
const ModernWalletConnector = () => {
  // Estados do Wagmi
  const { address, isConnected, connector: activeConnector, chain } = useAccount();
  const { connect, connectors, error: connectError, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const { chains, switchChain, isPending: isSwitchingNetwork } = useSwitchChain();

  // Estados locais para controlar a interface
  const [currentScreen, setCurrentScreen] = useState("initial");
  const [selectedConnector, setSelectedConnector] = useState(null);
  const [addressCopied, setAddressCopied] = useState(false);

  // Efeito para atualizar a tela com base no estado da conexão
  useEffect(() => {
    if (isConnected && address) {
      setCurrentScreen("connected");
    } else if (currentScreen === "connected") {
      setCurrentScreen("disconnected");
    }
  }, [isConnected, address]);

  // Função para copiar o endereço para a área de transferência
  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setAddressCopied(true);
      setTimeout(() => setAddressCopied(false), 2000);
    }
  };

  // Função para abrir o endereço no explorador de blocos
  const openInBlockExplorer = () => {
    if (address && chain?.blockExplorers?.default?.url) {
      window.open(`${chain.blockExplorers.default.url}/address/${address}`, '_blank');
    }
  };

  // Função para formatar o endereço para exibição
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Função para verificar se a rede atual é a correta (Polygon Amoy)
  const isCorrectNetwork = () => {
    return chain?.id === 80002; // ID da rede Polygon Amoy
  };

  // Função para trocar para a rede Polygon Amoy
  const switchToPolygonAmoy = () => {
    if (switchChain) {
      switchChain({ chainId: 80002 }); // ID da rede Polygon Amoy
    }
  };

  // Função para lidar com a conexão de carteira
  const handleConnectWallet = (connector) => {
    setSelectedConnector(connector);
    connect({ connector });
  };

  // Função para lidar com a desconexão
  const handleDisconnect = () => {
    disconnect();
    setCurrentScreen("disconnected");
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
              {connectors
                .filter((connector) => connector.ready)
                .map((connector) => (
                  <div
                    key={connector.id}
                    className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-primary-bg hover:border-primary transition-colors"
                    onClick={() => handleConnectWallet(connector)}
                    disabled={!connector.ready || isLoading}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {connector.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{connector.name}</span>
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
            {connectError && (
              <div className="px-6 pb-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {connectError.message || "Erro ao conectar carteira. Tente novamente."}
                  </AlertDescription>
                </Alert>
              </div>
            )}
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
                  <AvatarFallback>
                    {activeConnector?.name.substring(0, 2) || "WC"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium">{activeConnector?.name || "Carteira"}</span>
                  <span className="text-sm text-muted-foreground">Carteira Web3</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Endereço</span>
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={copyAddressToClipboard}
                      title={addressCopied ? "Copiado!" : "Copiar endereço"}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={openInBlockExplorer}
                      title="Ver no explorador de blocos"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 bg-muted rounded-md text-sm font-mono">
                  {formatAddress(address)}
                </div>
                {addressCopied && (
                  <div className="text-xs text-primary text-right">Endereço copiado!</div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Rede</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6"
                    title="Atualizar informações da rede"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  </div>
                  <span className="text-sm font-medium">{chain?.name || "Desconhecida"}</span>
                </div>
              </div>

              {!isCorrectNetwork() && (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Rede incorreta</AlertTitle>
                  <AlertDescription>
                    Para utilizar o BoletoXCrypto, você precisa estar na rede Polygon Amoy.
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="mt-2 w-full" 
                      onClick={switchToPolygonAmoy}
                      disabled={isSwitchingNetwork}
                    >
                      {isSwitchingNetwork ? "Trocando..." : "Trocar para Polygon Amoy"}
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
              <Button 
                className="w-full" 
                onClick={() => setCurrentScreen("initial")}
              >
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

export default ModernWalletConnector;
