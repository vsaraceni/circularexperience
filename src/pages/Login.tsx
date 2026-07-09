import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import logo from "@/assets/movimento-circular-logo.png";
import heroImage from "@/assets/hero-workshop.webp";
import { LogoImage } from "@/components/LogoImage";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";

type Mode = "password" | "magic" | "signup";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("magic");
  const isSignUp = mode === "signup";
  const isMagic = mode === "magic";
  const { signIn, signUp, signOut, user, hasRole, approvalStatus, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user && hasRole && approvalStatus === "approved") {
      navigate("/admin/pipeline", { replace: true });
    }
  }, [authLoading, user, hasRole, approvalStatus, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isMagic) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/admin/pipeline`,
          },
        });
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Link mágico enviado! Verifique seu email para entrar.");
        }
      } else if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(
            "Cadastro enviado! Aguarde a liberação de um administrador para acessar o CRM.",
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success("Login realizado com sucesso!");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/admin/pipeline`,
      });
      if (error) {
        toast.error("Erro ao entrar com Google. Tente novamente.");
        console.error("Google sign-in error:", error);
      }
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Erro ao entrar com Google. Tente novamente.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const title = isSignUp
    ? "Criar conta"
    : isMagic
    ? "Entrar com link mágico"
    : "Bem-vindo de volta";
  const subtitle = isSignUp
    ? "Preencha os dados para se cadastrar"
    : isMagic
    ? "Receba um link de acesso direto no seu email"
    : "Entre na sua conta para continuar";
  const submitLabel = isLoading
    ? isMagic
      ? "Enviando..."
      : isSignUp
      ? "Criando..."
      : "Entrando..."
    : isMagic
    ? "Enviar link mágico"
    : isSignUp
    ? "Criar conta"
    : "Entrar";

  return (
    user && !authLoading && (approvalStatus === "pending" || approvalStatus === "rejected" || (approvalStatus === "approved" && !hasRole)) ? (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <LogoImage src={logo} alt="Movimento Circular" className="h-10 mx-auto" />
          <div className="rounded-lg border border-border bg-card p-8 space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              {approvalStatus === "rejected" ? "Acesso não autorizado" : "Cadastro em análise"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {approvalStatus === "rejected"
                ? "Seu acesso ao CRM foi negado por um administrador. Entre em contato caso ache que isto é um engano."
                : "Seu cadastro foi recebido e está aguardando aprovação de um administrador. Você receberá acesso assim que for liberado."}
            </p>
            <p className="text-xs text-muted-foreground">Logado como <strong>{user.email}</strong></p>
            <Button variant="outline" className="w-full" onClick={() => signOut()}>Sair</Button>
          </div>
        </div>
      </div>
    ) : (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left — form */}
      <div className="flex items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-[420px] space-y-8">
          <div>
            <LogoImage src={logo} alt="Movimento Circular" className="h-10 mb-8" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Seu nome"
                  className="h-11"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="h-11"
              />
            </div>
            {!isMagic && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => toast.info("Em breve. Por enquanto, use o link mágico.")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="h-11"
                />
              </div>
            )}
            {isMagic && (
              <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                Te enviaremos um link de acesso no seu email. Sem senha.
              </div>
            )}
            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {submitLabel}
            </Button>
          </form>

          <div className="space-y-3">
            {!isSignUp && (
              <>
                <div className="flex items-center gap-3">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wider">ou</span>
                  <Separator className="flex-1" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    "Entrando..."
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Continuar com Google
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode(isMagic ? "password" : "magic")}
                  className="w-full h-10 text-muted-foreground hover:text-primary"
                >
                  {isMagic ? (
                    "Prefiro entrar com email e senha"
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Entrar com link mágico
                    </>
                  )}
                </Button>
              </>
            )}
            <Separator />
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setMode(isSignUp ? "password" : "signup")}
                className="font-medium text-primary hover:underline"
              >
                {isSignUp ? "Entrar" : "Criar uma"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Right — hero image with purple overlay */}
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={heroImage}
          alt="Movimento Circular em ação"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-primary/55 mix-blend-multiply" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" aria-hidden />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <p className="text-sm font-medium uppercase tracking-[0.2em] opacity-80">
            Movimento Circular · CRM
          </p>
          <h2 className="mt-3 text-4xl font-bold leading-tight">
            Gestão integrada de oportunidades
          </h2>
          <p className="mt-4 text-base opacity-90 max-w-md">
            Acesso restrito
          </p>
        </div>
      </div>
    </div>
    )
  );
};

export default Login;
