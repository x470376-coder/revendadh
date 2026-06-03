import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = 3000;

app.use(express.json());

const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 5, // máx 5 chamadas por minuto por IP
  message: { success: false, error: "Muitas requisições. Aguarde 1 minuto." }
});

// Lazy-initialized Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      } catch (err) {
        console.error("Erro ao inicializar o cliente Gemini:", err);
      }
    }
  }
  return aiClient;
}

// Ensure api routes are placed FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Google OAuth parameters
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

app.get("/api/auth/url", (req, res) => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === "MY_GOOGLE_CLIENT_ID") {
    // Return a local simulated OAuth login route that mimics Google's UI
    res.json({ url: "/auth/simulated-login" });
  } else {
    // Real Google OAuth parameters
    const origin = req.get('origin') || process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${origin}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    res.json({ url: authUrl });
  }
});

app.get("/auth/simulated-login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt">
    <head>
      <meta charset="UTF-8">
      <title>Fazer login com o Google</title>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Roboto', sans-serif;
          background-color: #202124;
          color: #e8eaed;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background-color: #303134;
          border: 1px solid #5f6368;
          border-radius: 8px;
          padding: 40px;
          width: 380px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        }
        .g-logo {
          width: 24px;
          margin-bottom: 16px;
        }
        h1 {
          font-size: 24px;
          font-weight: 400;
          margin: 0 0 8px 0;
          color: #fff;
        }
        p {
          font-size: 14px;
          color: #9aa0a6;
          margin: 0 0 24px 0;
        }
        .account-item {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid #5f6368;
          border-radius: 8px;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 20px;
          text-align: left;
        }
        .account-item:hover {
          background-color: #3c4043;
        }
        .avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: #ff3b3b;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-size: 14px;
        }
        .info {
          flex-grow: 1;
        }
        .name {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
        }
        .email {
          font-size: 12px;
          color: #9aa0a6;
        }
        .badge {
          background-color: rgba(255, 59, 59, 0.1);
          color: #ff3b3b;
          border: 1px solid rgba(255, 59, 59, 0.2);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <svg class="g-logo" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
        </svg>
        <h1>Escolha uma conta</h1>
        <p>para continuar no app <strong>RevendaX</strong></p>
        
        <div class="account-item" onclick="selectAccount()">
          <div class="avatar">U</div>
          <div class="info">
            <div class="name font-sans">Usuário RevendaX Premium</div>
            <div class="email">wleal0131@gmail.com</div>
          </div>
          <span class="badge">Simulador</span>
        </div>

        <div style="font-size: 11px; color: #5f6368; line-height: 1.4; margin-top: 10px;">
          Este ambiente está rodando em modo sandbox. Para usar o Google OAuth real, defina a variável GOOGLE_CLIENT_ID nas configurações de ambiente.
        </div>
      </div>

      <script>
        function selectAccount() {
          const user = {
            name: "Usuário RevendaX Premium",
            email: "wleal0131@gmail.com",
            picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
          };
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: user }, '*');
            window.close();
          } else {
            alert("Operação concluída com sucesso no simulador");
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  if (!code) {
    return res.status(400).send("Código de autenticação ausente");
  }

  try {
    const origin = process.env.APP_URL || "http://localhost:3000";
    const redirectUri = `${origin}/auth/callback`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await globalThis.fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Token exchange failed:", errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokens = await tokenRes.json();
    
    // 2. Fetch user profile from google userinfo API
    const userProfileRes = await globalThis.fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userProfileRes.ok) {
      const errorText = await userProfileRes.text();
      console.error("Userinfo failed:", errorText);
      throw new Error(`UserInfo exchange failed: ${errorText}`);
    }

    const userData = await userProfileRes.json();
    
    const cleanEmail = String(userData.email || "").replace(/[^\w\-\.\@]/g, "");
    const cleanName = String(userData.name || userData.given_name || "Usuário Google")
      .replace(/[<>&"']/g, "")
      .slice(0, 100);

    let cleanPicture = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop";
    if (userData.picture) {
      try {
        const parsedUrl = new URL(userData.picture);
        if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
          cleanPicture = parsedUrl.toString();
        }
      } catch (e) {
        // Fallback to default
      }
    }
    
    const user = {
      name: cleanName,
      email: cleanEmail,
      picture: cleanPicture
    };

    // 3. Post Message to window.opener and close
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Autenticado</title>
        </head>
        <body style="background:#07090D; color:white; font-family:sans-serif; text-align:center; padding-top:50px;">
          <h2>Autenticação efetuada com sucesso!</h2>
          <p>Fechando esta janela...</p>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(user)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    const msg = process.env.NODE_ENV === "production" ? "Erro interno de autenticação. Tente novamente." : error.message;
    res.status(500).send(`
      <html>
        <body style="background:#07090D; color:#FF3B3B; font-family:sans-serif; text-align:center; padding-top:50px;">
          <h2>Erro de Autenticação</h2>
          <p>${msg}</p>
          <button onclick="window.close()" style="background:#FF3B3B; border:none; color:white; padding:10px 20px; border-radius:8px; cursor:pointer;">Fechar Janela</button>
        </body>
      </html>
    `);
  }
});

// Gemini Endpoint: Smart Financial Analysis & Predictions
app.post("/api/gemini/analyze", geminiLimiter, async (req, res) => {
  const userEmail = req.headers["x-user-email"];
  if (!userEmail) {
    return res.status(401).json({ success: false, error: "Não autorizado. Efetue login para usar a IA." });
  }

  const rawProducts = Array.isArray(req.body.products) ? req.body.products : [];

  // Sanitize each product to prevent prompt injection or malicious large payload
  const products = rawProducts.slice(0, 100).map((p: any) => ({
    name: String(p?.name || "").slice(0, 100).replace(/[^\w\s\-\/\.\(\)]/g, ""),
    category: String(p?.category || "").slice(0, 50).replace(/[^\w\s\-\/\.]/g, ""),
    status: String(p?.status || "").slice(0, 30),
    valorInvestido: Math.max(0, Math.min(Number(p?.valorInvestido) || 0, 9999999)),
    valorVenda: Math.max(0, Math.min(Number(p?.valorVenda) || 0, 9999999)),
    frete: Math.max(0, Math.min(Number(p?.frete) || 0, 9999999)),
    taxas: Math.max(0, Math.min(Number(p?.taxas) || 0, 9999999)),
  }));

  const goal = Math.max(0, Math.min(Number(req.body.goal) || 0, 99999999));
  const currentMonthSalesCount = Math.max(0, Math.min(Number(req.body.currentMonthSalesCount) || 0, 1000));
  const currentMonthSalesCost = Math.max(0, Math.min(Number(req.body.currentMonthSalesCost) || 0, 99999999));
  const currentMonthSalesRevenue = Math.max(0, Math.min(Number(req.body.currentMonthSalesRevenue) || 0, 99999999));

  const client = getGeminiClient();
  if (!client) {
    // Graceful offline simulated fallback if API key is not present or default
    const expectedProfit = (products || []).reduce((sum: number, p: any) => {
      if (p.status === "Em estoque" || p.status === "Reservado") {
        return sum + (Number(p.valorVenda) - Number(p.valorInvestido) - Number(p.frete || 0) - Number(p.taxas || 0));
      }
      return sum;
    }, 0);

    const achievedProfit = currentMonthSalesRevenue - currentMonthSalesCost;
    const paceMessage = goal 
      ? `Se continuar nesse ritmo, você completará ${(achievedProfit / goal * 100).toFixed(0)}% da sua meta de R$ ${goal}. Ideal focar em eletrônicos de alto giro.` 
      : "Bom ritmo! Adicione mais produtos em estoque para impulsionar suas margens.";

    return res.json({
      success: true,
      simulated: true,
      analysis: `### 🚀 Análise Inteligente de Revenda (RevendaX AI)

Estamos rodando em **modo de simulação local**. Para habilitar o cérebro completo de IA, adicione uma chave de API nas configurações do sistema.

**Análise Mensal:**
- Você realizou **R$ ${achievedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** em lucro líquido este mês.
- Lucro potencial aguardando em estoque: **R$ ${expectedProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}**.
- **Ritmo Atual:** ${paceMessage}

**Dica de Arbitragem:**
- Foco em eletrônicos premium (ex.: iPhones, Smartwatches). A margem recomendada para revendas rápidas sob investimento de R$ 1.500+ é de **25% a 35%**.`,
    });
  }

  try {
    const productsStr = JSON.stringify(products, null, 2);
    const systemPrompt = `Você é o analista financeiro inteligente do app 'RevendaX', especializado em arbitragem comercial de curto prazo (compra barato e vende caro de eletrônicos premium como iPhones, carros, videogames, etc.).
Analise os produtos informados pelo usuário, a meta financeira informada e o desempenho mensal de vendas para retornar um relatório executivo de alta inteligência em português brasileiro.
Use formatação Markdown elegante.

Sua resposta DEVE incluir obrigatoriamente:
1. **Desempenho Geral**: Análise de investimento vs retorno atual.
2. **Projeção de Meta**: Se continuar no ritmo atual de vendas, quanto o usuário pode lucrar de verdade este mês (use a frase de gatilho "Se continuar nesse ritmo você pode lucrar R$ X este mês" baseando-se nas vendas atuais do mês e o estoque ativo).
3. **Identificação de Categorias Lucrativas**: Analise as categorias com maior margem líquida e sugira onde injetar mais capital de giro.
4. **Alerta de Risco**: Identificar se há produtos parados há muito tempo em estoque ou com margens espremidas pela concorrência.
5. **Dica de Negociação**: Uma tática real de fechamento de negócios para iPhones/eletrônicos para destravar vendas.`;

    const contents = `Produtos Cadastrados:
${productsStr}

Meta Financeira do Usuário: R$ ${goal || 5000}
Dados de Vendas do Mês Atual:
- Quantidade vendida: ${currentMonthSalesCount} itens
- Volume investido em vendas: R$ ${currentMonthSalesCost}
- Receita total de vendas: R$ ${currentMonthSalesRevenue}
- Lucro líquido mensal atual: R$ ${currentMonthSalesRevenue - currentMonthSalesCost}

Forneça a análise inteligente de modo estruturado e dinâmico.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Erro na inteligência do Gemini:", error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === "production" ? "Erro interno. Tente novamente." : error.message 
    });
  }
});

// Gemini Endpoint: Suggest Optimal Price
app.post("/api/gemini/suggest-price", geminiLimiter, async (req, res) => {
  const userEmail = req.headers["x-user-email"];
  if (!userEmail) {
    return res.status(401).json({ success: false, error: "Não autorizado. Efetue login para usar a IA." });
  }

  // Input sanitization and payload limits
  const name = String(req.body.name || "").slice(0, 200).replace(/[^\w\s\-\/\.\(\)]/g, "");
  const category = String(req.body.category || "").slice(0, 100).replace(/[^\w\s\-\/\.]/g, "");
  const cost = Math.max(0, Math.min(Number(req.body.cost) || 0, 9999999));
  const frete = Math.max(0, Math.min(Number(req.body.frete) || 0, 999999));
  const taxas = Math.max(0, Math.min(Number(req.body.taxas) || 0, 999999));

  const totalCost = cost + frete + taxas;

  const client = getGeminiClient();
  if (!client) {
    // Simple mock suggestion if no API key
    const suggestedSale = Math.round(totalCost * 1.32);
    const profit = suggestedSale - totalCost;
    const roi = (profit / totalCost) * 100;

    return res.json({
      success: true,
      simulated: true,
      suggestedPrice: suggestedSale,
      margin: 32,
      roi: roi.toFixed(1),
      explanation: `Preço sugerido de revenda local para **${name || "Produto"}** com base em uma margem padrão de arbitragem rápida (32%). Isso garante cobertura de taxas e um retorno atrativo. Habilite o Gemini nas configurações para ver preços baseados em tendências de mercado reais!`,
    });
  }

  try {
    const prompt = `Sugira o preço de venda ideal para um produto com as seguintes características para arbitragem de curto prazo:
Nome: ${name}
Categoria: ${category}
Preço de custo pago: R$ ${cost}
Frete adicional: R$ ${frete}
Taxas/impostos: R$ ${taxas}
Custo total envolvido: R$ ${totalCost}

Forneça um JSON com a seguinte estrutura:
{
  "suggestedPrice": numero (preço de revenda recomendado em reais),
  "margin": numero (porcentagem de margem líquida recomendada, ex: 35),
  "roi": numero (porcentagem de ROI esperada),
  "explanation": "breve justificativa de mercado de 2 ou 3 frases em português, justificando o preço sugerido do produto com base no modelo do item e a demanda atual"
}`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT" as any,
          properties: {
            suggestedPrice: { type: "NUMBER" as any },
            margin: { type: "NUMBER" as any },
            roi: { type: "NUMBER" as any },
            explanation: { type: "STRING" as any },
          },
          required: ["suggestedPrice", "margin", "roi", "explanation"],
        }
      },
    });

    try {
      const data = JSON.parse(response.text?.trim() || "{}");
      res.json({
        success: true,
        ...data,
      });
    } catch (parseError) {
      console.error("Erro ao analisar resposta JSON do Gemini:", parseError);
      // Fallback in case JSON structure is slightly different
      res.json({
        success: true,
        suggestedPrice: Math.round(totalCost * 1.3),
        margin: 30,
        roi: 30,
        explanation: "Sugerido preço padrão por erro de parse estrutural da IA.",
      });
    }
  } catch (error: any) {
    console.error("Erro na sugestão de preço:", error);
    res.status(500).json({ 
      success: false, 
      error: process.env.NODE_ENV === "production" ? "Erro interno. Tente novamente." : error.message 
    });
  }
});

// Vite & Static file configurations
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
