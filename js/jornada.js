/*
 * Jornada de integração.
 *
 * Cada etapa tem um responsável:
 *   "colaborador"  → o próprio colaborador/estagiário marca a etapa
 *   "rh" | "ti" | "gestor" → tarefa interna; o colaborador NÃO marca
 *
 * Etapas internas só aparecem para o colaborador se tiverem `paraColaborador`
 * (um texto escrito na linguagem dele, sem detalhe de processo interno).
 * Sem `paraColaborador`, a etapa fica oculta para ele.
 *
 * `feito` das etapas internas vem de quem executou (RH/TI). Aqui é fixo;
 * quando houver backend, esse valor deve vir dele.
 */
const JORNADA = [
  { fase: "Antes do 1º dia", etapas: [
    { id: "docs", resp: "colaborador",
      titulo: "Enviar seus documentos e assinar o contrato",
      detalhe: "O RH vai te enviar a lista de documentos por e-mail." },
    { id: "email", resp: "ti", feito: "21/10",
      titulo: "Criar e-mail corporativo e usuário de rede",
      paraColaborador: "Seu e-mail corporativo e usuário de rede" },
    { id: "pc", resp: "ti", feito: "21/10",
      titulo: "Preparar computador e estação de trabalho",
      detalhe: "Registrar o equipamento no inventário da Central de TI.",
      paraColaborador: "Seu computador e estação de trabalho" },
    { id: "acessos", resp: "ti", feito: "21/10",
      titulo: "Liberar acessos aos sistemas do setor",
      detalhe: "GClick, Jettax, ZapContábil e demais sistemas que a função exigir.",
      paraColaborador: "Seus acessos aos sistemas do setor" },
    { id: "equipe", resp: "gestor", feito: "21/10",
      titulo: "Avisar a equipe sobre a chegada" },
  ]},
  { fase: "1º dia", etapas: [
    { id: "recepcao", resp: "rh",
      titulo: "Receber o colaborador e apresentar o escritório",
      paraColaborador: "Boas-vindas e apresentação do escritório" },
    { id: "entrega", resp: "ti",
      titulo: "Entregar equipamentos e testar os acessos",
      paraColaborador: "Entrega do computador e teste dos acessos" },
    { id: "login", resp: "colaborador",
      titulo: "Entrar no e-mail e nos sistemas pela primeira vez",
      detalhe: "Se algo não abrir, chame o Suporte de TI." },
    { id: "senha", resp: "colaborador",
      titulo: "Trocar a senha provisória" },
  ]},
  { fase: "Primeira semana", etapas: [
    { id: "quem", resp: "colaborador",
      titulo: "Ler “Quem é a SGM”" },
    { id: "guia", resp: "colaborador",
      titulo: "Ler o Guia do estagiário" },
    { id: "lc214", resp: "colaborador",
      titulo: "Ler o Guia LC 214/2025" },
    { id: "treinos", resp: "colaborador",
      titulo: "Concluir os treinamentos do setor" },
    { id: "conversa", resp: "gestor",
      titulo: "Conversa de acompanhamento com o gestor",
      paraColaborador: "Conversa de acompanhamento com seu gestor" },
  ]},
];

const RESP_NOME = { rh: "RH", ti: "TI", gestor: "Gestor" };
const CHAVE = "sgm-jornada-feitas";

function lerFeitas() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; }
}
function salvarFeitas(f) {
  try { localStorage.setItem(CHAVE, JSON.stringify(f)); } catch {}
}
function hoje() {
  const d = new Date();
  return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
}

/* Etapas que contam no progresso do colaborador: só as dele. */
function progressoColaborador() {
  const feitas = lerFeitas();
  const minhas = JORNADA.flatMap(f => f.etapas).filter(e => e.resp === "colaborador");
  const ok = minhas.filter(e => feitas[e.id]).length;
  return { ok, total: minhas.length, pct: Math.round((ok / minhas.length) * 100) };
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function renderJornada(raiz) {
  const feitas = lerFeitas();
  let html = "";

  for (const fase of JORNADA) {
    const linhas = fase.etapas.map(e => {
      if (e.resp === "colaborador") {
        const data = feitas[e.id];
        return `<li class="etapa${data ? " ok" : ""}">
          <label>
            <input type="checkbox" data-id="${e.id}"${data ? " checked" : ""}>
            <span class="txt"><b>${esc(e.titulo)}</b>${e.detalhe ? `<small>${esc(e.detalhe)}</small>` : ""}</span>
            <span class="st">${data ? esc(data) : "Pendente"}</span>
          </label>
        </li>`;
      }
      if (!e.paraColaborador) return "";
      return `<li class="etapa sgm${e.feito ? " ok" : ""}">
        <div>
          <span class="dot" aria-hidden="true">${e.feito ? "✓" : ""}</span>
          <span class="txt"><b>${esc(e.paraColaborador)}</b><small>Responsável: ${RESP_NOME[e.resp]}</small></span>
          <span class="st">${e.feito ? "Pronto" : "A caminho"}</span>
        </div>
      </li>`;
    }).join("");
    if (linhas.trim()) html += `<h5 class="fase">${esc(fase.fase)}</h5><ul class="etapas">${linhas}</ul>`;
  }
  raiz.querySelector("[data-lista]").innerHTML = html;
  atualizarResumo(raiz);

  raiz.querySelector("[data-lista]").addEventListener("change", ev => {
    const cb = ev.target.closest("input[data-id]");
    if (!cb) return;
    const f = lerFeitas();
    if (cb.checked) f[cb.dataset.id] = hoje(); else delete f[cb.dataset.id];
    salvarFeitas(f);
    const li = cb.closest(".etapa");
    li.classList.toggle("ok", cb.checked);
    li.querySelector(".st").textContent = cb.checked ? f[cb.dataset.id] : "Pendente";
    atualizarResumo(raiz);
  });
}

function atualizarResumo(raiz) {
  const p = progressoColaborador();
  raiz.querySelectorAll("[data-prog-txt]").forEach(el => el.textContent = `${p.ok} de ${p.total} concluídas`);
  raiz.querySelectorAll("[data-prog-pct]").forEach(el => el.textContent = `${p.pct}%`);
  raiz.querySelectorAll("[data-prog-bar]").forEach(el => {
    el.firstElementChild.style.width = p.pct + "%";
    el.setAttribute("aria-valuenow", p.pct);
  });
}
