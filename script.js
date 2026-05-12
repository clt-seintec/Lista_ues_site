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

/* =========================
   Carrega CSV
========================= */
fetch("escolas_estaduais 2026(MENU FILTRAR).csv")
  .then(r => r.text())
  .then(t => {
    escolas = parseCSV(t);
    preencherMunicipios();
    renderizar();
  });

function parseCSV(texto) {
  const linhas = texto.split("\n").filter(l => l.trim());
  const head = linhas[0].split(";");
  return linhas.slice(1).map(l => {
    let obj = {};
    l.split(";").forEach((v, i) => obj[head[i]] = v?.trim() || "");
    return obj;
  });
}

function preencherMunicipios() {
  const set = new Set();
  escolas.forEach(e => {
    if (e["END COMPLETO"]?.toUpperCase().includes("CAMPINAS")) set.add("Campinas");
    if (e["END COMPLETO"]?.toUpperCase().includes("JAGUARIUNA")) set.add("Jaguariúna");
  });
  set.forEach(m => filtroMunicipio.innerHTML += `<option>${m}</option>`);
}

[filtroMunicipio, filtroEnsino, buscaInput].forEach(e =>
  e.addEventListener("input", renderizar)
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

btnExportar.onclick = () => {
  let csv = "Escola;Endereço;Telefone;Modalidades\n";
  escolasFiltradas.forEach(e => {
    csv += `"${e["Nome da Unidade Escolar"]}";"${e["END COMPLETO"]}"\n`;
  });
  baixar(csv);
};

let escolasFiltradas = [];

function renderizar() {
  resultado.innerHTML = "";
  tbody.innerHTML = "";

  escolasFiltradas = escolas.filter(e => {
    if (filtroMunicipio.value && !e["END COMPLETO"].toUpperCase().includes(filtroMunicipio.value.toUpperCase())) return false;
    if (filtroEnsino.value && !Object.values(e).some(v => v.includes(filtroEnsino.value))) return false;
    if (buscaInput.value && !e["Nome da Unidade Escolar"].toLowerCase().includes(buscaInput.value.toLowerCase()) && !e["Bairro"].toLowerCase().includes(buscaInput.value.toLowerCase())) return false;
    return true;
  });

  contador.textContent = `${escolasFiltradas.length} escolas encontradas`;

  escolasFiltradas.forEach(e => {
    const mapa = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e["END COMPLETO"])}`;
    const modalidades = ["ANOS INICIAIS","ANOS FINAIS","ENSINO MEDIO","EJA","NOVOTEC","ITINERARIO FORMATIVO"]
      .filter(c => e[c] && e[c] !== "--------")
      .map(c => `<span class="badge">${c}</span>`)
      .join(" ");

    if (!modoTabela) {
      resultado.innerHTML += `
        <div class="card">
          <h3>${e["Nome da Unidade Escolar"]}</h3>
          <p>${e["END COMPLETO"]}</p>
          <p>${modalidades}</p>
          ${mapa}📍 Ver no Google Maps</a>
        </div>`;
    } else {
      tbody.innerHTML += `
        <tr>
          <td>${e["Nome da Unidade Escolar"]}</td>
          <td>${e["END COMPLETO"]}</td>
          <td>${e["telefone 1"]}</td>
          <td>${modalidades}</td>
          <td>${mapa}Mapa</a></td>
        </tr>`;
    }
  });
}

function baixar(conteudo) {
  const blob = new Blob([conteudo], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "escolas_filtradas.csv";
  a.click();
}