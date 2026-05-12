const resultado = document.getElementById("resultado");
const tabela = document.getElementById("tabela");
const tbody = tabela.querySelector("tbody");

const filtroMunicipio = document.getElementById("municipio");
const filtroEnsino = document.getElementById("ensino");
const buscaInput = document.getElementById("busca");

const contador = document.getElementById("contador");
const btnLimpar = document.getElementById("limpar");
const btnExportar = document.getElementById("exportar");
const btnAlternar = document.getElementById("alternarView");

let escolas = [];
let modoTabela = false;

/* ===============================
   CARREGAR CSV
================================ */
fetch("escolas_estaduais 2026(MENU FILTRAR).csv")
  .then(r => r.text())
  .then(texto => {
    escolas = parseCSV(texto);
    preencherMunicipios();
    renderizar();
  });

/* ===============================
   PARSER DE CSV (;)
================================ */
function parseCSV(texto) {
  const linhas = texto.split("\n").filter(l => l.trim());
  const cabecalho = linhas[0].split(";").map(c => c.trim());

  return linhas.slice(1).map(linha => {
    const valores = linha.split(";");
    let obj = {};
    cabecalho.forEach((col, i) => {
      obj[col] = (valores[i] || "").trim();
    });
    return obj;
  });
}

/* ===============================
   MUNICÍPIOS
================================ */
function preencherMunicipios() {
  const set = new Set();
  escolas.forEach(e => {
    if (e["END COMPLETO"]) {
      if (e["END COMPLETO"].toUpperCase().includes("CAMPINAS")) set.add("Campinas");
      if (e["END COMPLETO"].toUpperCase().includes("JAGUARIUNA")) set.add("Jaguariúna");
    }
  });

  set.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filtroMunicipio.appendChild(opt);
  });
}

/* ===============================
   EVENTOS
================================ */
[filtroMunicipio, filtroEnsino, buscaInput].forEach(el =>
  el.addEventListener("input", renderizar)
);

btnLimpar.onclick = () => {
  filtroMunicipio.value = "";
  filtroEnsino.value = "";
  buscaInput.value = "";
  renderizar();
};

btnAlternar.onclick = () => {
  modoTabela = !modoTabela;
  resultado.classList.toggle("hidden", modoTabela);
  tabela.classList.toggle("hidden", !modoTabela);
  btnAlternar.textContent = modoTabela ? "Cards" : "Tabela";
  renderizar();
};

/* ===============================
   RENDERIZAR
================================ */
function renderizar() {
  resultado.innerHTML = "";
  tbody.innerHTML = "";

  const filtradas = escolas.filter(e => {
    if (filtroMunicipio.value && !e["END COMPLETO"].toUpperCase().includes(filtroMunicipio.value.toUpperCase())) return false;
    if (filtroEnsino.value && !Object.values(e).some(v => v.toUpperCase().includes(filtroEnsino.value))) return false;
    if (buscaInput.value) {
      const b = buscaInput.value.toLowerCase();
      if (
        !e["Nome da Unidade Escolar"]?.toLowerCase().includes(b) &&
        !e["Bairro"]?.toLowerCase().includes(b)
      ) return false;
    }
    return true;
  });

  contador.textContent = `${filtradas.length} escolas encontradas`;

  filtradas.forEach(e => {
    const nome = e["Nome da Unidade Escolar"] || "Sem nome";
    const endereco = e["END COMPLETO"] || "Endereço não informado";
    const telefone = `${e["telefone 1 "] || ""} ${e["telefone 2"] || ""}`.trim();

    const modalidades = extrairModalidades(e).join(" ");

    const linkMapa =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

    if (!modoTabela) {
      resultado.innerHTML += `
        <div class="card">
          <h3>${nome}</h3>
          <p>${endereco}</p>
          <p>${telefone}</p>
          <p>${modalidades}</p>
          <a href="${linkMapa}" target="_blank">📍 Ver no Google Maps</a>
        </div>`;
    } else {
      tbody.innerHTML += `
        <tr>
          <td>${nome}</td>
          <td>${endereco}</td>
          <td>${telefone}</td>
          <td>${modalidades}</td>
          <td><a href="${linkMapa}" target="_blank">Mapa</a></td>
        </tr>`;
    }
  });
}

/* ===============================
   EXTRAIR MODALIDADES PELO TEXTO
================================ */
function extrairModalidades(e) {
  const mapa = [
    "EF AI", "EF AF", "ENSINO MEDIO", "EM",
    "EJA", "PEI", "NOVOTEC", "ITI", "ITINERARIO"
  ];

  const texto = Object.values(e).join(" ").toUpperCase();
  return mapa
    .filter(m => texto.includes(m))
    .map(m => `<span class="badge">${m}</span>`);
}
