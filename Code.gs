const SHEET_ID = '1lfvXJMP5ta1sEYWBJULWK820TiAx2MkvkNAtaxyybH0';
const SHEET_NAME = 'insumos';

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index').setTitle('Pedido de Insumos');
}

function doPost(e) {
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    const result = saveItems(body);
    return jsonResponse({ ok: true, resumo: result.resumo });
  } catch (err) {
    return jsonResponse({ ok: false, error: err && err.message ? err.message : String(err) });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveItems(payload) {
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Aba nao encontrada. Confira SHEET_NAME em Code.gs.');
  }

  ensureHeaders(sheet);

  const barbearia = payload.barbearia || '';
  const responsavelEnvio = payload.responsavelEnvio || '';
  const favorecidos = Array.isArray(payload.favorecidos) ? payload.favorecidos : [];

  if (!favorecidos.length) {
    throw new Error('Nenhum favorecido informado.');
  }

  let totalGeral = 0;
  const resumoLinhas = [
    '📋 *PEDIDO DE INSUMOS*',
    '━━━━━━━━━━━━━━━━━━',
    '🏬 *Barbearia:* ' + barbearia,
    '🧾 *Responsável pelo envio:* ' + responsavelEnvio,
    '━━━━━━━━━━━━━━━━━━'
  ];

  favorecidos.forEach(function (fav, favIdx) {
    const favorecido = fav.favorecido || '';
    const pix = fav.pix || '';
    const items = Array.isArray(fav.items) ? fav.items : [];

    if (!favorecido || !pix || !items.length) {
      return;
    }

    resumoLinhas.push('');
    resumoLinhas.push('👤 *Favorecido ' + (favIdx + 1) + ':* ' + favorecido);
    resumoLinhas.push('💳 *PIX:* ' + pix);
    resumoLinhas.push('🛒 *Itens:*');

    let totalFav = 0;

    items.forEach(function (item, idx) {
      const qty = Number(item.quantidade) || 0;
      const val = Number(item.valor) || 0;
      const totalItem = qty * val;
      totalFav += totalItem;
      totalGeral += totalItem;

      sheet.appendRow([
        new Date(),
        barbearia,
        item.insumo || '',
        qty,
        val,
        item.descricao || '',
        favorecido,
        pix,
        responsavelEnvio,
        totalItem
      ]);

      const linhaItem =
        '• *' + (idx + 1) + ')* ' + (item.insumo || '') +
        '\n   ▫️ Qtd: ' + qty +
        ' | Unit: ' + formatCurrency(val) +
        ' | Total: ' + formatCurrency(totalItem) +
        (item.descricao ? '\n   ▫️ Obs: ' + item.descricao : '');

      resumoLinhas.push(linhaItem);
    });

    resumoLinhas.push('💰 *Subtotal do favorecido:* ' + formatCurrency(totalFav));
    resumoLinhas.push('━━━━━━━━━━━━━━━━━━');
  });

  resumoLinhas.push('✅ *TOTAL GERAL:* ' + formatCurrency(totalGeral));
  return { resumo: resumoLinhas.join('\n') };
}

function formatCurrency(value) {
  const n = Number(value) || 0;
  return 'R$ ' + n.toFixed(2);
}

function ensureHeaders(sheet) {
  const headers = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const desired = [
    'Data',
    'Barbearia',
    'Insumo',
    'Quantidade',
    'Valor',
    'Descricao',
    'Favorecido',
    'PIX',
    'Responsavel pelo envio',
    'Total Item'
  ];

  if (!headers || !headers.some(Boolean)) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]);
    return;
  }

  const needsUpdate =
    headers.length < desired.length ||
    headers[0] !== desired[0] ||
    headers[1] !== desired[1] ||
    headers[8] !== desired[8];

  if (needsUpdate) {
    sheet.getRange(1, 1, 1, desired.length).setValues([desired]);
  }
}
