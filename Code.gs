const SHEET_ID = '1vtS3W1Gn0V5A85AZWqpAm6UUG4JnkyWVAfRSzVvVK-Y'; // coloque aqui o ID real (entre /d/ e /edit)
const SHEET_NAME = 'Controle'; // ajuste se a aba tiver outro nome

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Pedido de Insumos');
}

function doPost(e) {
  try {
    const body = e.postData?.contents ? JSON.parse(e.postData.contents) : {};
    const result = saveItems(body);
    return jsonResponse({ ok: true, resumo: result.resumo });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message || String(err) });
  }
}

// Resposta JSON simples para fetch (funciona quando o front está em outro domínio, como Vercel)
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveItems(payload) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const { barbearia, favorecido, pix, responsavelEnvio, items = [] } = payload;

  let totalGeral = 0;
  const linhasResumo = [
    `*Barbearia:* ${barbearia}`,
    `*Favorecido:* ${favorecido}`,
    `*PIX:* ${pix}`,
    '*Itens:*'
  ];

  items.forEach((item, idx) => {
    const qty = Number(item.quantidade) || 0;
    const val = Number(item.valor) || 0;
    const totalItem = qty * val;
    totalGeral += totalItem;

    sheet.appendRow([
      new Date(),
      barbearia,
      item.insumo,
      qty,
      val,
      item.descricao || '',
      favorecido,
      pix,
      responsavelEnvio || '',
      totalItem
    ]);

    const linhaItem =
      `${idx + 1}) ${item.insumo} — Qtd: ${qty} — Unit: R$ ${val.toFixed(2)} — Total: R$ ${totalItem.toFixed(2)}` +
      (item.descricao ? ` — ${item.descricao}` : '');
    linhasResumo.push(linhaItem);
  });

  linhasResumo.push(`*Total geral:* R$ ${totalGeral.toFixed(2)}`);

  return { resumo: linhasResumo.join('\n') };
}
