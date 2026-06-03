import { Product } from "../types";

export const exportToCSV = (products: Product[], filename: string = "revendax-vendas-estoque.csv") => {
  try {
    const headers = [
      "ID",
      "Produto",
      "Categoria",
      "Valor Investido (R$)",
      "Valor Venda (R$)",
      "Frete (R$)",
      "Taxas (R$)",
      "Lucro Líquido (R$)",
      "ROI (%)",
      "Status",
      "Cliente",
      "Forma Pagamento",
      "Data Entrada",
      "Data Venda"
    ];

    const rows = products.map((p) => {
      const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
      const totalCost = p.valorInvestido + p.frete + p.taxas;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.category,
        p.valorInvestido,
        p.valorVenda,
        p.frete,
        p.taxas,
        profit.toFixed(2),
        roi.toFixed(1),
        p.status,
        `"${(p.cliente || "").replace(/"/g, '""')}"`,
        p.formaPagamento || "N/A",
        p.dataEntrada,
        p.dataVenda || "N/A"
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err: any) {
    console.error("Erro ao exportar CSV:", err);
    alert("Ocorreu um erro ao gerar o arquivo CSV. Por favor, tente novamente.");
  }
};

export const exportToPrintHTML = (products: Product[]) => {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      return alert("Por favor, permita popups neste navegador para poder exportar o relatório de impressão física do RevendaX.");
    }

    const totalInvested = products.reduce((sum, p) => sum + p.valorInvestido, 0);
    const totalSales = products.filter(p => p.status === "Vendido").reduce((sum, p) => sum + p.valorVenda, 0);
    const totalProfit = products.filter(p => p.status === "Vendido").reduce((sum, p) => {
      return sum + (p.valorVenda - p.valorInvestido - p.frete - p.taxas);
    }, 0);

    const rowsHTML = products.map((p) => {
      const profit = p.valorVenda - p.valorInvestido - p.frete - p.taxas;
      const totalCost = p.valorInvestido + p.frete + p.taxas;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      const statusColor = p.status === "Vendido" ? "#10b981" : p.status === "Reservado" ? "#f59e0b" : "#3b82f6";
      
      return `
        <tr>
          <td>${p.id}</td>
          <td style="font-weight: 500;">${p.name}</td>
          <td>${p.category}</td>
          <td>R$ ${p.valorInvestido.toLocaleString('pt-BR')}</td>
          <td>R$ ${p.valorVenda.toLocaleString('pt-BR')}</td>
          <td>R$ ${(p.frete + p.taxas).toLocaleString('pt-BR')}</td>
          <td style="color: #10b981; font-weight: bold;">R$ ${profit.toLocaleString('pt-BR')}</td>
          <td>${roi.toFixed(1)}%</td>
          <td><span style="background: ${statusColor}22; color: ${statusColor}; padding: 3px 8px; border-radius: 4px; font-size: 11px;">${p.status}</span></td>
          <td>${p.dataEntrada}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>RevendaX - Relatório Geral de Performance</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; background: #fafafa; }
            h1 { color: #0f172a; margin-bottom: 5px; }
            .headline { color: #64748b; font-size: 14px; margin-bottom: 30px; }
            .kpi-container { display: flex; gap: 20px; margin-bottom: 30px; }
            .kpi-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); flex: 1; border: 1px solid #e2e8f0; }
            .kpi-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
            .kpi-value { font-size: 20px; font-weight: bold; color: #020617; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            th { background: #f8fafc; text-align: left; padding: 12px 15px; font-size: 11px; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
            td { padding: 12px 15px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155; }
            tr:hover { background: #f8fafc; }
            .footer { text-align: center; margin-top: 40px; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>REVENDAX premium intelligence</h1>
          <div class="headline">Relatório Consolidado de Margens e Estoque • Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
          
          <div class="kpi-container">
            <div class="kpi-card">
              <div class="kpi-label">Capital Total Investido</div>
              <div class="kpi-value">R$ ${totalInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Faturamento de Vendas</div>
              <div class="kpi-value">R$ ${totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="kpi-card" style="border-left: 4px solid #10b981;">
              <div class="kpi-label">Lucro Líquido Realizado (Faturado)</div>
              <div class="kpi-value" style="color: #10b981;">R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Cód</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Cust. Ref.</th>
                <th>Propost. Venda</th>
                <th>Despesas (Fr/Tx)</th>
                <th>Lucro Previsto/Realizado</th>
                <th>ROI</th>
                <th>Status</th>
                <th>Data Entr.</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="footer">
            RevendaX Inc. • Controle suas revendas e maximize seus lucros • Copyright 2026
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (err: any) {
    console.error("Erro ao imprimir:", err);
    alert("O sandbox do navegador bloqueou a abertura de nova guia para impressão. Recorra à exportação CSV para extrair as tabelas de dados de forma segura.");
  }
};
