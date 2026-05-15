const resultado = document.getElementById("resultado");
const filtroMunicipio = document.getElementById("municipio");
const filtroTipo = document.getElementById("tipo");
const buscaInput = document.getElementById("busca");
const contador = document.getElementById("contador");

let escolas = [];
let mapa, markers = [];

/* =========================
   CARREGAR CSV
========================= */
fetch("escolas_estaduais 2026(MENU FILTRAR).csv")
  .then(res => res.text())
  .then(texto => {
    escolas = parseCSV(texto);
    preencherMunicipios();
    iniciarMapa();
    renderizar();
  });

function parseCSV(texto) {
  const linhas = texto.split("\n").filter(l => l.trim());
  const cabecalho = linhas[0].split(";");

  return linhas.slice(1).map(linha => {
    const valores = linha.split(";");
    let obj = {};
    cabecalho.forEach((col, i) => {
      obj[col.trim()] = (valores[i] || "").trim();
    });
    return obj;
  });
}

/* =========================
   MUNICÍPIOS
========================= */
function preencherMunicipios() {
  const set = new Set();

  escolas.forEach(e => {
    if (e["END COMPLETO"]?.includes("Campinas")) set.add("Campinas");
    if (e["END COMPLETO"]?.includes("Jaguariuna")) set.add("Jaguariúna");
  });

  set.forEach(m => {
    const opt = document.createElement("option");
    opt.value = m;
    opt.textContent = m;
    filtroMunicipio.appendChild(opt);
  });
}

/* =========================
   MAPA
========================= */
function iniciarMapa() {
  mapa = L.map("mapa").setView([-22.9, -47.06], 11);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(mapa);
}

function atualizarMapa(lista) {
  markers.forEach(m => mapa.removeLayer(m));
  markers = [];

  lista.forEach(e => {
    if (!e["END COMPLETO"]) return;

    // Simulação de geocoding simples (centralizado)
    const marker = L.marker([-22.9 + Math.random()/10, -47.06 + Math.random()/10]);

    marker.addTo(mapa)
      .bindPopup(`<b>${e["Nome da Unidade Escolar"]}</b><br>${e["END COMPLETO"]}`);

    markers.push(marker);
  });
}

/* =========================
   FILTROS
========================= */
[filtroMunicipio, filtroTipo, buscaInput].forEach(el =>
  el.addEventListener("input", renderizar)
);

document.getElementById("limpar").onclick = () => {
  filtroMunicipio.value = "";
  filtroTipo.value = "";
  buscaInput.value = "";
  renderizar();
};

/* =========================
   RENDER
========================= */
function renderizar() {
  resultado.innerHTML = "";

  const filtradas = escolas.filter(e => {

    if (filtroMunicipio.value &&
        !e["END COMPLETO"].includes(filtroMunicipio.value)) return false;

    if (filtroTipo.value &&
        !e["TIPO"].toUpperCase().includes(filtroTipo.value)) return false;

    if (buscaInput.value) {
      const b = buscaInput.value.toLowerCase();
      if (!e["Nome da Unidade Escolar"].toLowerCase().includes(b) &&
          !e["Bairro"].toLowerCase().includes(b)) return false;
    }

    return true;
  });

  contador.textContent = `${filtradas.length} escolas`;

  filtradas.forEach(e => {

    const nome = e["Nome da Unidade Escolar"];
    const tipo = e["TIPO"];
    const endereco = e["END COMPLETO"];

    let classe = "card";
    if (tipo.includes("PEI")) classe += " pei";
    if (tipo.includes("EJA")) classe += " eja";

    resultado.innerHTML += `
      <div class="${classe}">
        <h3>${nome}</h3>
        <p><strong>CIE:</strong> ${e["CIE"]}</p>
        <p><strong>Tipo:</strong> ${tipo}</p>
        <p>${endereco}</p>

        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}" target="_blank">
          📍 Ver no mapa
        </a>
      </div>
    `;
  });

  atualizarMapa(filtradas);
}

/* =========================
   EXPORTAÇÃO CSV
========================= */
document.getElementById("exportar").onclick = () => {

  let csv = "Nome;CIE;Tipo;Endereco\n";

  escolas.forEach(e => {
    csv += `"${e["Nome da Unidade Escolar"]}";"${e["CIE"]}";"${e["TIPO"]}";"${e["END COMPLETO"]}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "escolas_exportadas.csv";
  link.click();
};
``