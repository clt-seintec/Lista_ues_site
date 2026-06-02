const resultadoCards = document.getElementById("resultadoCards");
const resultadoListaWrapper = document.getElementById("resultadoListaWrapper");
const resultadoListaBody = document.querySelector("#resultadoLista tbody");

const filtroMunicipio = document.getElementById("municipio");
const filtroTipo = document.getElementById("tipo");
const buscaInput = document.getElementById("busca");

const contador = document.getElementById("contador");
const btnLimpar = document.getElementById("btnLimpar");
const btnExportar = document.getElementById("btnExportar");
const btnLista = document.getElementById("btnLista");

const mapaEl = document.getElementById("mapa");
const mapaStatus = document.getElementById("mapaStatus");

let escolas = [];
let escolasFiltradas = [];
let modoLista = false;

/* =========================
   MAPA (opcional se houver lat/lng)
========================= */
let mapa;
let clusterGroup;

/* =========================
   INICIALIZAÇÃO
========================= */
iniciar();

async function iniciar() {
  try {
    const csvTexto = await carregarTextoCsv("escolas_estaduais 2026(MENU FILTRAR).csv");
    escolas = parseCSV(csvTexto);

    preencherFiltroMunicipio(escolas);
    preencherFiltroTipo(escolas);
    configurarEventos();

    renderizar();
    inicializarMapaSePossivel();
  } catch (erro) {
    console.error("Erro ao carregar a página:", erro);
    resultadoCards.innerHTML = `
      <div class="vazio">
        Ocorreu um erro ao carregar o arquivo CSV. Verifique o nome do arquivo e tente novamente.
      </div>
    `;
  }
}

/* =========================
   LEITURA DO CSV COM TENTATIVA DE CORREÇÃO DE ENCODING
   Corrige casos como: Mar�o / Andr� / Le�ncio / M�nica
========================= */
async function carregarTextoCsv(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`Falha ao carregar o CSV: ${resposta.status}`);
  }

  const buffer = await resposta.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const win1252 = new TextDecoder("windows-1252", { fatal: false }).decode(bytes);

  const scoreTexto = (txt) => {
    const substituicoes = (txt.match(/�/g) || []).length;
    const mojibake = (txt.match(/Ã.|Â.|â.|Õ|Ç|¢|œ/g) || []).length;
    return (substituicoes * 10) + mojibake;
  };

  const scoreUtf8 = scoreTexto(utf8);
  const scoreWin = scoreTexto(win1252);

  return scoreWin < scoreUtf8 ? win1252 : utf8;
}

/* =========================
   PARSER CSV COM ; E CAMPOS ENTRE ASPAS
========================= */
function parseCSV(texto) {
  const linhas = splitLinhasCSV(texto);
  if (!linhas.length) return [];

  const cabecalho = splitCamposCSV(linhas[0]).map(c => limparValor(c));

  const dados = [];
  for (let i = 1; i < linhas.length; i++) {
    const campos = splitCamposCSV(linhas[i]);
    if (campos.every(c => limparValor(c) === "")) continue;

    const obj = {};
    cabecalho.forEach((coluna, index) => {
      obj[coluna] = limparValor(campos[index] || "");
    });

    // Ignora linhas sem nome de escola
    if (!obj["Nome da Unidade Escolar"]) continue;

    dados.push(obj);
  }

  return dados;
}

function splitLinhasCSV(texto) {
  const linhas = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const proximo = texto[i + 1];

    if (char === '"') {
      if (dentroAspas && proximo === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
      continue;
    }

    if ((char === "\n" || char === "\r") && !dentroAspas) {
      if (atual.trim() !== "") linhas.push(atual);
      atual = "";

      // trata \r\n
      if (char === "\r" && proximo === "\n") i++;
      continue;
    }

    atual += char;
  }

  if (atual.trim() !== "") linhas.push(atual);
  return linhas;
}

function splitCamposCSV(linha) {
  const campos = [];
  let atual = "";
  let dentroAspas = false;

  for (let i = 0; i < linha.length; i++) {
    const char = linha[i];
    const proximo = linha[i + 1];

    if (char === '"') {
      if (dentroAspas && proximo === '"') {
        atual += '"';
        i++;
      } else {
        dentroAspas = !dentroAspas;
      }
      continue;
    }

    if (char === ";" && !dentroAspas) {
      campos.push(atual);
      atual = "";
      continue;
    }

    atual += char;
  }

  campos.push(atual);
  return campos;
}

function limparValor(valor) {
  return String(valor || "")
    .replace(/\uFEFF/g, "")          // remove BOM
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   UTILITÁRIOS DE TEXTO
========================= */
function textoSeguro(v, fallback = "-") {
  const valor = limparValor(v);
  return valor || fallback;
}

function normalizarComparacao(txt) {
  return String(txt || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* =========================
   MUNICÍPIO / TIPO
========================= */
function preencherFiltroMunicipio(lista) {
  const municipios = new Set();

  lista.forEach(e => {
    const m = obterMunicipio(e);
    if (m) municipios.add(m);
  });

  [...municipios]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach(municipio => {
      const opt = document.createElement("option");
      opt.value = municipio;
      opt.textContent = municipio;
      filtroMunicipio.appendChild(opt);
    });
}

function preencherFiltroTipo(lista) {
  const tipos = new Set();

  lista.forEach(e => {
    const tipo = textoSeguro(e["TIPO"], "");
    if (tipo) tipos.add(tipo);
  });

  [...tipos]
    .sort((a, b) => a.localeCompare(b, "pt-BR"))
    .forEach(tipo => {
      const opt = document.createElement("option");
      opt.value = tipo;
      opt.textContent = tipo;
      filtroTipo.appendChild(opt);
    });
}

function obterMunicipio(escola) {
  const endereco = textoSeguro(escola["END COMPLETO"], "");
  if (!endereco) return "";

  // tenta extrair "Campinas" ou "Jaguariúna" do endereço
  if (normalizarComparacao(endereco).includes("campinas")) return "Campinas";
  if (normalizarComparacao(endereco).includes("jaguariuna")) return "Jaguariúna";

  // fallback: tenta pegar a palavra antes de /SP
  const match = endereco.match(/([A-Za-zÀ-ÿ\s\-]+)\/\s*SP/i);
  if (match && match[1]) {
    return limparValor(match[1].split(" ").slice(-1).join(" "));
  }

  return "";
}

/* =========================
   EVENTOS
========================= */
function configurarEventos() {
  filtroMunicipio.addEventListener("input", renderizar);
  filtroTipo.addEventListener("input", renderizar);
  buscaInput.addEventListener("input", renderizar);

  btnLimpar.addEventListener("click", () => {
    filtroMunicipio.value = "";
    filtroTipo.value = "";
    buscaInput.value = "";
    renderizar();
  });

  btnExportar.addEventListener("click", exportarFiltradasCSV);

  btnLista.addEventListener("click", () => {
    modoLista = !modoLista;
    btnLista.textContent = modoLista ? "Cards" : "Lista";
    renderizar();
  });
}

/* =========================
   FILTRO
========================= */
function aplicarFiltros() {
  const municipioSelecionado = filtroMunicipio.value;
  const tipoSelecionado = filtroTipo.value;
  const busca = normalizarComparacao(buscaInput.value);

  return escolas.filter(e => {
    const nome = textoSeguro(e["Nome da Unidade Escolar"], "");
    const bairro = textoSeguro(e["Bairro"], "");
    const tipo = textoSeguro(e["TIPO"], "");
    const municipio = obterMunicipio(e);

    if (municipioSelecionado && municipio !== municipioSelecionado) {
      return false;
    }

    if (tipoSelecionado && tipo !== tipoSelecionado) {
      return false;
    }

    if (busca) {
      const alvo = `${nome} ${bairro} ${tipo} ${municipio}`;
      if (!normalizarComparacao(alvo).includes(busca)) {
        return false;
      }
    }

    return true;
  });
}

/* =========================
   RENDER
========================= */
function renderizar() {
  escolasFiltradas = aplicarFiltros();
  contador.textContent = `${escolasFiltradas.length} escolas encontradas`;

  if (modoLista) {
    renderLista(escolasFiltradas);
    resultadoCards.classList.add("hidden");
    resultadoListaWrapper.classList.remove("hidden");
  } else {
    renderCards(escolasFiltradas);
    resultadoCards.classList.remove("hidden");
    resultadoListaWrapper.classList.add("hidden");
  }

  atualizarMapa(escolasFiltradas);
}

function renderCards(lista) {
  if (!lista.length) {
    resultadoCards.innerHTML = `<div class="vazio">Nenhuma escola encontrada com os filtros aplicados.</div>`;
    return;
  }

  resultadoCards.innerHTML = lista.map(escola => {
    const nome = textoSeguro(escola["Nome da Unidade Escolar"]);
    const cie = textoSeguro(escola["CIE"]);
    const tel1 = textoSeguro(escola["telefone_1"], "");
    const tel2 = textoSeguro(escola["telefone_2"], "");
    const tipo = textoSeguro(escola["TIPO"]);
    const endereco = textoSeguro(escola["END COMPLETO"]);
    const bairro = textoSeguro(escola["Bairro"], "");
    const municipio = obterMunicipio(escola);

    const mapaLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

    const contemPEI = normalizarComparacao(tipo).includes("pei");
    const contemEJA = normalizarComparacao(tipo).includes("eja");

    const classes = [
      "card",
      contemPEI ? "pei" : "",
      contemEJA ? "eja" : ""
    ].join(" ").trim();

    const badges = [
      contemPEI ? `<span class="badge badge-pei">PEI</span>` : "",
      contemEJA ? `<span class="badge badge-eja">EJA</span>` : "",
      municipio ? `<span class="badge">${escapeHtml(municipio)}</span>` : ""
    ].join("");

    const telefonesHtml = [tel1, tel2].filter(Boolean).join("<br>");

    return `
      <article class="${classes}">
        <h3>${escapeHtml(nome)}</h3>

        <div class="badges">${badges}</div>

        <p><strong>CIE:</strong> ${escapeHtml(cie)}</p>
        <p><strong>Tipo:</strong> ${escapeHtml(tipo)}</p>

        ${
          telefonesHtml
            ? `<p><strong>Telefones:</strong><br>${telefonesHtml}</p>`
            : `<p><strong>Telefones:</strong> -</p>`
        }

        <p><strong>Endereço:</strong><br>${escapeHtml(endereco)}</p>
        ${bairro ? `<p><strong>Bairro:</strong> ${escapeHtml(bairro)}</p>` : ""}

        <p>
          <a href="${mapaLink}" target="_blank" rel="noopener noreferrer">
            📍 Ver no mapa
          </a>
        </p>
      </article>
    `;
  }).join("");
}

function renderLista(lista) {
  if (!lista.length) {
    resultadoListaBody.innerHTML = `
      <tr>
        <td colspan="7">Nenhuma escola encontrada com os filtros aplicados.</td>
      </tr>
    `;
    return;
  }

  resultadoListaBody.innerHTML = lista.map(escola => {
    const nome = textoSeguro(escola["Nome da Unidade Escolar"]);
    const cie = textoSeguro(escola["CIE"]);
    const tel1 = textoSeguro(escola["telefone_1"]);
    const tel2 = textoSeguro(escola["telefone_2"]);
    const tipo = textoSeguro(escola["TIPO"]);
    const endereco = textoSeguro(escola["END COMPLETO"]);

    const mapaLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

    const contemPEI = normalizarComparacao(tipo).includes("pei");
    const contemEJA = normalizarComparacao(tipo).includes("eja");

    const classes = [
      contemPEI ? "linha-pei" : "",
      contemEJA ? "linha-eja" : ""
    ].join(" ").trim();

    return `
      <tr class="${classes}">
        <td>${escapeHtml(nome)}</td>
        <td>${escapeHtml(cie)}</td>
        <td>${escapeHtml(tel1)}</td>
        <td>${escapeHtml(tel2)}</td>
        <td>${escapeHtml(tipo)}</td>
        <td>${escapeHtml(endereco)}</td>
        <td>
          <a class="tabela-link" href="${mapaLink}" target="_blank" rel="noopener noreferrer">
            Abrir
          </a>
        </td>
      </tr>
    `;
  }).join("");
}

/* =========================
   EXPORTAÇÃO ESTRUTURADA DAS FILTRADAS
========================= */
function exportarFiltradasCSV() {
  const colunas = [
    "Nome da Unidade Escolar",
    "CIE",
    "telefone_1",
    "telefone_2",
    "TIPO",
    "END COMPLETO"
  ];

  const linhas = [
    colunas.join(";"),
    ...escolasFiltradas.map(escola =>
      colunas.map(col => csvEscape(escola[col] || "")).join(";")
    )
  ];

  // BOM UTF-8 para Excel reconhecer acentos corretamente
  const conteudo = "\uFEFF" + linhas.join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "escolas_filtradas.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function csvEscape(valor) {
  const texto = String(valor ?? "");
  return `"${texto.replace(/"/g, '""')}"`;
}

/* =========================
   MAPA COM CLUSTER (somente se existirem latitude/longitude)
========================= */
function inicializarMapaSePossivel() {
  if (!escolas.length) return;

  const primeira = escolas[0];
  const temLatitude = "latitude" in primeira || "Latitude" in primeira;
  const temLongitude = "longitude" in primeira || "Longitude" in primeira;

  if (!temLatitude || !temLongitude) {
  document.querySelector(".mapa-section").classList.add("hidden");
  return;
}


  mapaEl.classList.remove("hidden");
  mapaStatus.textContent =
    "Mapa com cluster ativo. Os pontos exibem somente as escolas filtradas.";

  mapa = L.map("mapa").setView([-22.90, -47.06], 10);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(mapa);

  clusterGroup = L.markerClusterGroup();
  mapa.addLayer(clusterGroup);

  atualizarMapa(escolasFiltradas.length ? escolasFiltradas : escolas);
}

function atualizarMapa(lista) {
  if (!mapa || !clusterGroup) return;

  clusterGroup.clearLayers();

  const bounds = [];

  lista.forEach(escola => {
    const lat = Number(
      escola["latitude"] ?? escola["Latitude"] ?? ""
    );
    const lng = Number(
      escola["longitude"] ?? escola["Longitude"] ?? ""
    );

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const nome = textoSeguro(escola["Nome da Unidade Escolar"]);
    const endereco = textoSeguro(escola["END COMPLETO"]);
    const cie = textoSeguro(escola["CIE"]);
    const tipo = textoSeguro(escola["TIPO"]);

    const marker = L.marker([lat, lng]).bindPopup(`
      <strong>${escapeHtml(nome)}</strong><br>
      CIE: ${escapeHtml(cie)}<br>
      Tipo: ${escapeHtml(tipo)}<br>
      ${escapeHtml(endereco)}
    `);

    clusterGroup.addLayer(marker);
    bounds.push([lat, lng]);
  });

  if (bounds.length) {
    mapa.fitBounds(bounds, { padding: [30, 30] });
  }
}