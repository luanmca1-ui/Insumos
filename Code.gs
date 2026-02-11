const SHEET_ID = '1lfvXJMP5ta1sEYWBJULWK820TiAx2MkvkNAtaxyybH0'; // troque se o ID da planilha for outro
const SHEET_NAME = 'insumos'; // ajuste se a aba tiver outro nome

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Pedido de Insumos');
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

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function saveItems(payload) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  const { barbearia, favorecido, pix, responsavelEnvio, items = [] } = payload;

  ensureHeaders(sheet);

  let totalGeral = 0;
  const linhasResumo = [
    `🏠 *Barbearia:* ${barbearia}`,
    `🙋‍♂️ *Favorecido:* ${favorecido}`,
    `💳 *PIX:* ${pix}`,
    '📦 *Itens:*'
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

    const linhaItem = `🔸 ${idx + 1}) ${item.insumo} · Qtd: ${qty} · Unit: R$ ${val.toFixed(2)} · Total: R$ ${totalItem.toFixed(2)}`
      + (item.descricao ? ` · ${item.descricao}` : '');
    linhasResumo.push(linhaItem);
  });

  linhasResumo.push(`💰 *Total geral:* R$ ${totalGeral.toFixed(2)}`);

  return { resumo: linhasResumo.join('\n') };
}

// Garante que existe a coluna "Responsável pelo envio"
function ensureHeaders(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  const desired = [
    'Data',
    'Barbearia',
    'Insumo',
    'Quantidade',
    'Valor',
    'Descrição',
    'Favorecido',
    'PIX',
    'Responsável pelo envio',
    'Total Item'
  ];

  if (!headers || !headers.some(Boolean)) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]);
    return;
  }

  if (!headers.includes('Responsável pelo envio') || headers.length !== desired.length) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]);
  }
}
