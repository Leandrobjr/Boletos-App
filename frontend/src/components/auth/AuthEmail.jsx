import React, { useState } from "react";
import { auth } from "../services/firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";

function AuthEmail({ user, setUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState("login"); // 'login' ou 'cadastro'
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (password !== confirmPassword) {
          alert("As senhas não conferem!");
          setLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert("Erro: " + error.message);
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (error) {
      alert("Erro ao enviar e-mail de recuperação: " + error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  if (user) {
    return (
      <div style={{marginTop: 20}}>
        <button onClick={handleLogout} style={{background: '#f44336', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: 4}}>Logout</button>
      </div>
    );
  }

  if (resetMode) {
    return (
      <div style={{marginTop: 30, border: '1px solid #ccc', padding: 20, borderRadius: 8, width: 300}}>
        <h3>Recuperar senha</h3>
        <form onSubmit={handleResetPassword}>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{width: '100%', marginBottom: 10, padding: 8}}
            required
          />
          <button type="submit" style={{width: '100%', padding: 10, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4}} disabled={loading}>
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
        {resetSent && <div style={{marginTop:10, color:'#388e3c'}}>E-mail de recuperação enviado!</div>}
        <div style={{marginTop: 10, textAlign: 'center'}}>
          <a href="#" onClick={() => { setResetMode(false); setResetSent(false); }}>Voltar ao login</a>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginTop: 30, border: '1px solid #ccc', padding: 20, borderRadius: 8, width: 300}}>
      <h3>{mode === "login" ? "Login por e-mail" : "Cadastro por e-mail"}</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{width: '100%', marginBottom: 10, padding: 8}}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{width: '100%', marginBottom: 10, padding: 8}}
          required
        />
        {mode === "cadastro" && (
          <input
            type="password"
            placeholder="Confirme a senha"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            style={{width: '100%', marginBottom: 10, padding: 8}}
            required
          />
        )}
        <button type="submit" style={{width: '100%', padding: 10, background: '#4CAF50', color: '#fff', border: 'none', borderRadius: 4}} disabled={loading}>
          {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Cadastrar"}
        </button>
      </form>
      <div style={{marginTop: 10, textAlign: 'center'}}>
        {mode === "login" && (
          <a href="#" onClick={() => setResetMode(true)} style={{display:'block',marginBottom:8}}>Esqueci minha senha</a>
        )}
        <a href="#" onClick={() => { setMode(mode === 'login' ? 'cadastro' : 'login'); setConfirmPassword(""); }}>{mode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}</a>
      </div>
    </div>
  );
}

export default AuthEmail;
