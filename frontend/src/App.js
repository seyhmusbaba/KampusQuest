import React from "react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import AuthPage from "./components/AuthPage";
import GamePage from "./components/GamePage";

function AppRouter() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      height:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'#f1f5f9', flexDirection:'column', gap:20,
    }}>
      <div style={{fontSize:56, filter:'drop-shadow(0 2px 12px rgba(139,26,26,.2))', animation:'cg-float 2s ease-in-out infinite'}}>🎓</div>
      <div style={{fontFamily:'monospace', fontSize:13, color:'#64748b', letterSpacing:'.15em', animation:'cg-blink 1.5s ease-in-out infinite'}}>
        KAMPÜS YÜKLENİYOR...
      </div>
    </div>
  );
  return user ? <GamePage /> : <AuthPage />;
}

export default function App() {
  return <AuthProvider><AppRouter /></AuthProvider>;
}
