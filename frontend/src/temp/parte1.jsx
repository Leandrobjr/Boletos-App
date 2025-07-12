import { useState, useEffect } from 'react';
import { 
  FaTrash, FaWallet, FaCheck, FaShoppingCart, FaMoneyBillWave,
  FaExclamationTriangle, FaInfoCircle, FaList, FaHistory, 
  FaCreditCard, FaLock, FaArrowRight, FaUpload, FaClock, FaTimesCircle
} from 'react-icons/fa';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '../components/ui/alert';
import Button from '../components/ui/button';
import HistoricoTransacoes from '../components/HistoricoTransacoes';

function CompradorPage() {
  const [activeTab, setActiveTab] = useState('comprar');
  const [selectedBoleto, setSelectedBoleto] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [etapaCompra, setEtapaCompra] = useState(0); // 0: não iniciado, 1: seleção, 2: conectar carteira, 3: travar boleto, 4: pagamento
  const [carteiraConectada, setCarteiraConectada] = useState(false);
  const [enderecoCarteira, setEnderecoCarteira] = useState('');
  const [tempoRestante, setTempoRestante] = useState(null);
  const [comprovante, setComprovante] = useState(null);
  
  // Taxa de conversão simulada (1 USDT = R$ 5,00)
  const taxaConversao = 5.0;
  // Função para calcular taxa de serviço
  const calcularTaxaServico = (valor) => {
    // Taxa mínima de R$ 5,00 ou 3% do valor, o que for maior
    return valor <= 200 ? 5.00 : valor * 0.03;
  };
