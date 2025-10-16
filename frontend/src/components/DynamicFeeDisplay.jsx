/**
 * 💰 COMPONENTE DE EXIBIÇÃO DE TAXAS DINÂMICAS
 * 
 * Exibe taxas em tempo real com:
 * - Cálculo automático baseado no valor
 * - Temporizadores visuais
 * - Breakdown detalhado
 * - Atualizações automáticas
 * 
 * @author Engenheiro Sênior
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Timer,
  Calculator,
  Zap
} from 'lucide-react';

const DynamicFeeDisplay = ({ 
  boletoValue, 
  creationTime, 
  onFeeCalculated,
  showTimers = true,
  showBreakdown = true,
  autoUpdate = true,
  className = ""
}) => {
  // 🔧 ESTADOS
  const [fees, setFees] = useState(null);
  const [timeInfo, setTimeInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // 💰 CALCULAR TAXAS
  const calculateFees = useCallback(async (value, createdAt = new Date()) => {
    if (!value || value <= 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentTime = new Date();
      const elapsedHours = (currentTime - createdAt) / (1000 * 60 * 60);

      // Calcular taxa do comprador
      const buyerFee = value <= 100 ? 5.00 : value * 0.04;
      
      // Calcular taxa do vendedor baseada no tempo
      const sellerBaseFee = value * 0.02; // 2%
      let sellerRefundPercentage = 100; // 100%
      
      if (elapsedHours <= 2) {
        sellerRefundPercentage = 100;
      } else if (elapsedHours <= 24) {
        sellerRefundPercentage = 50;
      } else if (elapsedHours <= 48) {
        sellerRefundPercentage = 25;
      } else {
        sellerRefundPercentage = 0;
      }

      const sellerRefundAmount = sellerBaseFee * (sellerRefundPercentage / 100);
      const sellerFinalFee = sellerBaseFee - sellerRefundAmount;

      const calculatedFees = {
        boletoValue: value,
        buyerFee: {
          amount: buyerFee,
          type: value <= 100 ? 'FIXED' : 'PERCENTAGE',
          description: value <= 100 
            ? `Taxa fixa de R$ 5,00 para boletos até R$ 100,00`
            : `Taxa de 4% para boletos acima de R$ 100,00`
        },
        sellerFee: {
          baseFee: sellerBaseFee,
          refundAmount: sellerRefundAmount,
          refundPercentage: sellerRefundPercentage,
          finalFee: sellerFinalFee,
          description: `${sellerRefundPercentage}% da taxa será devolvida`
        },
        totals: {
          buyerPays: value + buyerFee,
          sellerReceives: value - sellerFinalFee,
          protocolEarns: buyerFee + sellerFinalFee
        },
        elapsedHours: elapsedHours
      };

      setFees(calculatedFees);
      setLastUpdate(currentTime);

      if (onFeeCalculated) {
        onFeeCalculated(calculatedFees);
      }

    } catch (err) {
      console.error('❌ Erro ao calcular taxas:', err);
      setError('Erro ao calcular taxas dinâmicas');
    } finally {
      setIsLoading(false);
    }
  }, [onFeeCalculated]);

  // ⏰ CALCULAR INFORMAÇÕES DE TEMPO
  const calculateTimeInfo = useCallback((createdAt) => {
    if (!createdAt) return null;

    const now = new Date();
    const elapsed = now - createdAt;
    
    const timeouts = {
      uploadDeadline: 1 * 60 * 60 * 1000, // 1h
      fullRefund: 2 * 60 * 60 * 1000, // 2h
      halfRefund: 24 * 60 * 60 * 1000, // 24h
      quarterRefund: 48 * 60 * 60 * 1000, // 48h
      autoRelease: 72 * 60 * 60 * 1000 // 72h
    };

    return {
      elapsed: elapsed,
      elapsedHours: elapsed / (1000 * 60 * 60),
      uploadDeadline: {
        time: createdAt.getTime() + timeouts.uploadDeadline,
        passed: elapsed > timeouts.uploadDeadline,
        remaining: Math.max(0, timeouts.uploadDeadline - elapsed)
      },
      fullRefund: {
        time: createdAt.getTime() + timeouts.fullRefund,
        passed: elapsed > timeouts.fullRefund,
        remaining: Math.max(0, timeouts.fullRefund - elapsed)
      },
      halfRefund: {
        time: createdAt.getTime() + timeouts.halfRefund,
        passed: elapsed > timeouts.halfRefund,
        remaining: Math.max(0, timeouts.halfRefund - elapsed)
      },
      quarterRefund: {
        time: createdAt.getTime() + timeouts.quarterRefund,
        passed: elapsed > timeouts.quarterRefund,
        remaining: Math.max(0, timeouts.quarterRefund - elapsed)
      },
      autoRelease: {
        time: createdAt.getTime() + timeouts.autoRelease,
        passed: elapsed > timeouts.autoRelease,
        remaining: Math.max(0, timeouts.autoRelease - elapsed)
      }
    };
  }, []);

  // 🔄 EFEITO: Cálculo inicial e atualizações
  useEffect(() => {
    if (boletoValue) {
      const createdAt = creationTime ? new Date(creationTime) : new Date();
      calculateFees(boletoValue, createdAt);
      
      if (creationTime) {
        setTimeInfo(calculateTimeInfo(createdAt));
      }
    }
  }, [boletoValue, creationTime, calculateFees, calculateTimeInfo]);

  // 🔄 EFEITO: Auto-update
  useEffect(() => {
    if (!autoUpdate || !creationTime) return;

    const interval = setInterval(() => {
      const createdAt = new Date(creationTime);
      calculateFees(boletoValue, createdAt);
      setTimeInfo(calculateTimeInfo(createdAt));
    }, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, [autoUpdate, boletoValue, creationTime, calculateFees, calculateTimeInfo]);

  // 🎨 FORMATADORES
  const formatCurrency = (value) => `R$ ${value.toFixed(2)}`;
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getRefundColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 25) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTimerIcon = (passed) => passed ? XCircle : CheckCircle;
  const getTimerColor = (passed) => passed ? 'text-red-500' : 'text-green-500';

  // 🔄 LOADING STATE
  if (isLoading && !fees) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Calculator className="h-4 w-4 animate-spin" />
            <span>Calculando taxas dinâmicas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ❌ ERROR STATE
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // 📊 RENDER PRINCIPAL
  return (
    <div className={`space-y-4 ${className}`}>
      {/* 💰 TAXAS PRINCIPAIS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Taxas Dinâmicas</span>
            {lastUpdate && (
              <Badge variant="secondary" className="ml-auto">
                <Zap className="h-3 w-3 mr-1" />
                Atualizado {lastUpdate.toLocaleTimeString()}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Cálculo em tempo real baseado no valor e tempo decorrido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fees && (
            <>
              {/* Taxa do Comprador */}
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-blue-900">Taxa do Comprador</p>
                  <p className="text-sm text-blue-700">{fees.buyerFee.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-900">
                    {formatCurrency(fees.buyerFee.amount)}
                  </p>
                  <Badge variant={fees.buyerFee.type === 'FIXED' ? 'default' : 'secondary'}>
                    {fees.buyerFee.type === 'FIXED' ? 'Fixa' : 'Percentual'}
                  </Badge>
                </div>
              </div>

              {/* Taxa do Vendedor */}
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">Taxa do Vendedor</p>
                  <p className="text-sm text-orange-700">{fees.sellerFee.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-orange-900">
                    {formatCurrency(fees.sellerFee.finalFee)}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Badge 
                      variant="outline" 
                      className={getRefundColor(fees.sellerFee.refundPercentage)}
                    >
                      {fees.sellerFee.refundPercentage >= 75 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {fees.sellerFee.refundPercentage}% devolução
                    </Badge>
                  </div>
                </div>
              </div>

              {showBreakdown && (
                <>
                  <Separator />
                  
                  {/* Breakdown Detalhado */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700">Comprador Paga</p>
                      <p className="text-lg font-bold text-green-900">
                        {formatCurrency(fees.totals.buyerPays)}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-700">Vendedor Recebe</p>
                      <p className="text-lg font-bold text-purple-900">
                        {formatCurrency(fees.totals.sellerReceives)}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">Protocolo Ganha</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(fees.totals.protocolEarns)}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ⏰ TEMPORIZADORES */}
      {showTimers && timeInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Temporizadores</span>
            </CardTitle>
            <CardDescription>
              Marcos de tempo que afetam as taxas e o status da transação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Deadline */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                {React.createElement(getTimerIcon(timeInfo.uploadDeadline.passed), {
                  className: `h-4 w-4 ${getTimerColor(timeInfo.uploadDeadline.passed)}`
                })}
                <div>
                  <p className="font-medium">Prazo para Upload</p>
                  <p className="text-sm text-gray-600">1 hora após criação</p>
                </div>
              </div>
              <div className="text-right">
                {timeInfo.uploadDeadline.passed ? (
                  <Badge variant="destructive">Expirado</Badge>
                ) : (
                  <div>
                    <p className="font-medium">{formatTime(timeInfo.uploadDeadline.remaining)}</p>
                    <Progress 
                      value={((1 * 60 * 60 * 1000 - timeInfo.uploadDeadline.remaining) / (1 * 60 * 60 * 1000)) * 100} 
                      className="w-24 mt-1"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Fee Milestones */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Marcos de Taxa de Devolução:</h4>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded ${timeInfo.fullRefund.passed ? 'bg-red-100' : 'bg-green-100'}`}>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>100% (até 2h)</span>
                  </div>
                  {timeInfo.fullRefund.passed ? (
                    <span className="text-red-600">Expirado</span>
                  ) : (
                    <span className="text-green-600">{formatTime(timeInfo.fullRefund.remaining)}</span>
                  )}
                </div>

                <div className={`p-2 rounded ${timeInfo.halfRefund.passed ? 'bg-red-100' : 'bg-yellow-100'}`}>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>50% (até 24h)</span>
                  </div>
                  {timeInfo.halfRefund.passed ? (
                    <span className="text-red-600">Expirado</span>
                  ) : (
                    <span className="text-yellow-600">{formatTime(timeInfo.halfRefund.remaining)}</span>
                  )}
                </div>

                <div className={`p-2 rounded ${timeInfo.quarterRefund.passed ? 'bg-red-100' : 'bg-orange-100'}`}>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>25% (até 48h)</span>
                  </div>
                  {timeInfo.quarterRefund.passed ? (
                    <span className="text-red-600">Expirado</span>
                  ) : (
                    <span className="text-orange-600">{formatTime(timeInfo.quarterRefund.remaining)}</span>
                  )}
                </div>

                <div className={`p-2 rounded ${timeInfo.autoRelease.passed ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3" />
                    <span>Auto Release (72h)</span>
                  </div>
                  {timeInfo.autoRelease.passed ? (
                    <span className="text-blue-600">Disponível</span>
                  ) : (
                    <span className="text-gray-600">{formatTime(timeInfo.autoRelease.remaining)}</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DynamicFeeDisplay;

