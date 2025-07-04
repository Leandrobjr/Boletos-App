import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebaseConfig';
import { updateProfile } from 'firebase/auth';

const AlterarCadastroPage = () => {
  const { user } = useAuth();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();

  // Buscar dados do backend ao carregar a página
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      fetch(`http://localhost:3001/perfil/${user.uid}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setNome(data.nome || user.displayName || '');
            setTelefone(data.telefone || user.phoneNumber || '');
            // Redireciona se nome e telefone já estiverem preenchidos
            if ((data.nome || user.displayName) && (data.telefone || user.phoneNumber)) {
              navigate('/');
            }
          } else {
            setNome(user.displayName || '');
            setTelefone(user.phoneNumber || '');
          }
        })
        .catch(() => {
          setNome(user.displayName || '');
          setTelefone(user.phoneNumber || '');
        });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    if (senha && senha !== confirmarSenha) {
      setErro('As senhas não coincidem.');
      return;
    }
    try {
      // Atualizar nome completo no Firebase Auth
      if (auth.currentUser && nome) {
        await updateProfile(auth.currentUser, { displayName: nome });
      }
      // Salvar dados no backend
      if (user) {
        await fetch('http://localhost:3001/perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: user.uid,
            nome_completo: nome,
            email,
            telefone
          })
        });
      }
      setMensagem('Dados atualizados com sucesso!');
      setTimeout(() => {
        setMensagem('');
        navigate('/');
      }, 1200);
      setSenha('');
      setConfirmarSenha('');
    } catch (error) {
      setErro('Erro ao atualizar dados: ' + (error.message || error));
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-1 mt-2">
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-green-200 overflow-hidden mx-auto flex flex-col" style={{margin: '0 auto'}}>
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-1">Alterar Cadastro</h1>
          <p className="text-green-100 text-sm">Atualize seus dados abaixo</p>
        </div>
        <div className="pt-6 pb-8 flex flex-col">
          <form className="space-y-4 w-full px-8" onSubmit={handleSubmit}>
            <div className="w-full flex flex-col gap-4">
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input type="text" className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={nome} onChange={e => setNome(e.target.value)} required />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                <input type="email" className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={email} onChange={e => setEmail(e.target.value)} required disabled />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone Celular</label>
                <input type="tel" className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={telefone} onChange={e => setTelefone(e.target.value)} />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha (deixe em branco para não alterar)</label>
                <input type="password" className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Nova senha" />
              </div>
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input type="password" className="w-full box-border px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Confirme a nova senha" />
              </div>
              <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-4 rounded-lg hover:from-green-700 hover:to-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] mt-2">Salvar Alterações</button>
            </div>
          </form>
          {erro && <div className="text-red-700 text-center mt-4">{erro}</div>}
          {mensagem && <div className="text-green-700 text-center mt-4">{mensagem}</div>}
        </div>
      </div>
    </main>
  );
};

export default AlterarCadastroPage; 