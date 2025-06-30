import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence, browserSessionPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";

// Usar variáveis de ambiente para configuração do Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Verificar se todas as variáveis de ambiente estão definidas
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    console.warn(`Configuração do Firebase ausente: ${key}`);
  }
});

// Inicializar o app
const app = initializeApp(firebaseConfig);

// Configurar autenticação
const auth = getAuth(app);

// Definir persistência da sessão (local storage)
try {
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log('Persistência configurada com sucesso');
    })
    .catch((error) => {
      console.error('Erro ao configurar persistência:', error);
    });
} catch (error) {
  console.error('Erro ao configurar persistência:', error);
}
setPersistence(auth, browserLocalPersistence);

// Configurar o provider do Google
const provider = new GoogleAuthProvider();

// Adicionar escopos para obter mais informações do usuário
provider.addScope('email');
provider.addScope('profile');

// Verificar origem atual
const origem = window.location.origin;
console.log("Origem atual:", origem);

// Usar emuladores locais se estivermos em ambiente de desenvolvimento
if (origem.includes('localhost')) {
  try {
    // Descomente estas linhas se quiser usar emuladores locais
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectStorageEmulator(storage, 'localhost', 9199);
    console.log("Modo de desenvolvimento detectado");
  } catch (error) {
    console.warn("Erro ao conectar aos emuladores:", error);
  }
}

// Configurar provedor Google com parâmetros que funcionam com proteção contra rastreamento
provider.setCustomParameters({
  prompt: 'select_account',
  // Usar o domínio atual como login_hint para evitar problemas de cookies
  login_hint: origem,
});

// Adicionar listener para detectar mudanças no estado de autenticação
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Estado de autenticação alterado: Usuário logado");
  } else {
    console.log("Estado de autenticação alterado: Usuário deslogado");
  }
});

// Configurar Firestore
const db = getFirestore(app);

// Configurar Storage
const storage = getStorage(app);

// Exportar tudo
export { 
  app, 
  auth, 
  provider, 
  db, 
  storage 
};