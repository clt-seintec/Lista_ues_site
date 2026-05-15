const resultado = document.getElementById("resultado");
const filtroMunicipio = document.getElementById("municipio");
const buscaInput = document.getElementById("busca");
const contador = document.getElementById("contador");
const btnLimpar = document.getElementById("limpar");

let escolas = [];

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
   PARSE SIMPLES (CSV LIMPO)
================================ */
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

/* ===============================
   MUNICÍPIOS
================================ */
function preencherMunicipios() {
  const set = new Set();

  escolas.forEach(e => {
    if (e["END COMPLETO"]) {
      if (e["END COMPLETO"].toUpperCase().includes("CAMPINAS"))
        set.add("Campinas");

      if (e["END COMPLETO"].toUpperCase().includes("JAGUARIUNA"))
        set.add("Jaguariúna");
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
[filtroMunicipio, buscaInput].forEach(el =>
  el.addEventListener("input", renderizar)
);

btnLimpar.onclick = () => {
  filtroMunicipio.value = "";
  buscaInput.value = "";
  renderizar();
};

/* ===============================
   RENDERIZAÇÃO
================================ */
function renderizar() {
  resultado.innerHTML = "";

  const filtradas = escolas.filter(e => {
    if (
      filtroMunicipio.value &&
      !e["END COMPLETO"].toUpperCase().includes(filtroMunicipio.value.toUpperCase())
    ) return false;

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
    const cie = e["CIE"] || "-";
    const tipo = e["TIPO"] || "-";

    const telefone1 = e["telefone_1"] || "";
    const telefone2 = e["telefone_2"] || "";

    const endereco = e["END COMPLETO"] || "";

    const linkMapa =
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;

    resultado.innerHTML += `
      <div class="card">
        <h3>${nome}</h3>

        <p><strong>CIE:</strong> ${cie}</p>
        <p><strong>Tipo:</strong> ${tipo}</p>

        <p><strong>Telefone:</strong><br>
          ${telefone1}<br>
          ${telefone2}
        </p>

        <p><strong>Endereço:</strong><br>${endereco}</p>

        <a href="${linkMapa}" target="_blank">
          📍 Ver no Google Maps
        </a>
      </div>
    `;
  });
}