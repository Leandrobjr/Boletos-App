import React from 'react';
import { Link } from 'react-router-dom';

const infoText = `* Transações seguras com contratos inteligentes na blockchain.\n**Pagar Boleto com USDT: vc cadastra o boleto e trava o valor equivalente em USDT em uma conta segura na blockchain. O COMPRADOR de USDT seleciona o seu boleto, paga em reais e assim que confirmada a baixa do pagamento, recebe os fundos travados. Segurança garantida, sem riscos e sem intermediários.`;

const Landpage = () => {
  return (
    <div className="bxc-page-container min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #d9f99d 0%, #bef264 100%)', fontFamily: 'Inter, Arial, Helvetica, sans-serif', marginTop: 16 }}>
      {/* Seção principal */}
      <main className="flex-1 flex flex-col items-center justify-start px-4" style={{ marginTop: 0 }}>
        <h1 className="bxc-page-title text-center mb-1 mt-2" style={{ fontSize: '2.3rem', color: '#365314', fontWeight: 900, letterSpacing: '-1px', marginTop: 0 }}>Privacidade total para trocar REAL por CRYPTO</h1>
        <p className="bxc-page-subtitle text-center mb-8 max-w-2xl mx-auto" style={{ fontSize: '1.18rem', color: '#525252', fontWeight: 500, marginTop: 0 }}>A solução mais moderna, segura e privada para pagar boletos com USDT ou comprar USDT com reais, sem burocracia e com taxas baixíssimas.</p>
        <div className="bxc-cards-row" style={{ display: 'flex', flexDirection: 'row', gap: 48, width: '100%', maxWidth: 1100, justifyContent: 'center', alignItems: 'stretch', flexWrap: 'wrap', marginBottom: 24 }}>
          {/* Card PAGAR BOLETO */}
          <div className="bxc-card" style={{ flex: 1, minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0, background: '#fff', borderRadius: 32, boxShadow: '0 8px 32px 0 #d9f99d', border: '2px solid #a3e635', padding: 36 }}>
            <h2 className="bxc-card-title text-center mb-2" style={{ fontSize: '1.5rem', color: '#65a30d', fontWeight: 700, marginBottom: 16 }}>PAGAR BOLETO</h2>
            <p className="bxc-card-body text-center mb-8" style={{ color: '#525252', fontSize: '1.08rem', fontWeight: 500 }}>Para quem tem USDT em sua carteira e deseja pagar boletos em REAIS, de forma direta, privada, com baixas taxas e segurança da blockchain.</p>
            <Link to="/cadastro" className="bxc-btn bxc-btn-primary mt-auto w-full text-center" style={{ fontSize: '1.15rem', padding: '16px 0', marginTop: 'auto', background: '#166534', borderRadius: 16, fontWeight: 700, letterSpacing: '0.5px' }}>Quero pagar Boleto com USDT</Link>
          </div>
          {/* Card COMPRAR USDT */}
          <div className="bxc-card" style={{ flex: 1, minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 0, background: '#fff', borderRadius: 32, boxShadow: '0 8px 32px 0 #d9f99d', border: '2px solid #a3e635', padding: 36 }}>
            <h2 className="bxc-card-title text-center mb-2" style={{ fontSize: '1.5rem', color: '#65a30d', fontWeight: 700, marginBottom: 16 }}>COMPRAR USDT</h2>
            <p className="bxc-card-body text-center mb-8" style={{ color: '#525252', fontSize: '1.08rem', fontWeight: 500 }}>Para você que quer comprar Crypto de forma fácil, privada, baixas taxas e com a garantia de segurança da Blockchain.</p>
            <Link to="/cadastro" className="bxc-btn bxc-btn-primary mt-auto w-full text-center" style={{ fontSize: '1.15rem', padding: '16px 0', marginTop: 'auto', background: '#166534', borderRadius: 16, fontWeight: 700, letterSpacing: '0.5px' }}>Quero Comprar USDT</Link>
          </div>
        </div>
        {/* Caixa de texto explicativo horizontal */}
        <div style={{ background: '#f7fee7', border: '1.5px solid #a3e635', borderRadius: 18, padding: '18px 32px', maxWidth: 1100, margin: '0 auto 24px auto', color: '#365314', fontWeight: 600, fontSize: '1.05rem', textAlign: 'center', boxShadow: '0 2px 12px 0 #d9f99d' }}>
          {infoText}
        </div>
      </main>
    </div>
  );
};

export default Landpage; 
