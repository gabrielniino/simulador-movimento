function gerarGraficos() {
  const entrada = document.getElementById("funcao").value;
  let funcaoPosicao, funcaoVelocidade, funcaoAceleracao;

  try {
    funcaoPosicao = math.parse(entrada);
    funcaoVelocidade = math.derivative(funcaoPosicao, 't');
    funcaoAceleracao = math.derivative(funcaoVelocidade, 't');
  } catch (e) {
    alert("Erro ao interpretar a função. Verifique a sintaxe.");
    return;
  }

  // Exibir as expressões matemáticas interpretadas com LaTeX
  exibirExpressoes(funcaoPosicao, funcaoVelocidade, funcaoAceleracao);

  const intervalo = math.range(0, 10, 0.1, true).toArray().map(t => Math.round(t * 100) / 100);
  const valoresPosicao = intervalo.map(t => funcaoPosicao.evaluate({ t }));
  const valoresVelocidade = intervalo.map(t => funcaoVelocidade.evaluate({ t }));
  const valoresAceleracao = intervalo.map(t => funcaoAceleracao.evaluate({ t }));

  plotarGraficoGeral(intervalo, valoresPosicao, valoresVelocidade, valoresAceleracao);
}

function exibirExpressoes(pos, vel, ac) {
  // converter para string LaTeX
  const posLatex = pos.toTex({ parenthesis: 'keep', implicit: 'show' });
  const velLatex = vel.toTex({ parenthesis: 'keep', implicit: 'show' });
  const acLatex = ac.toTex({ parenthesis: 'keep', implicit: 'show' });

  const div = document.getElementById("expressoes");
  div.innerHTML = `
    <p>Função posição: \\( s(t) = ${posLatex} \\)</p>
    <p>Função velocidade: \\( v(t) = ${velLatex} \\)</p>
    <p>Função aceleração: \\( a(t) = ${acLatex} \\)</p>
  `;

  // Pedir para MathJax renderizar o novo conteúdo
  if (window.MathJax) {
    MathJax.typesetPromise([div]);
  }
}

function plotarGraficoGeral(t, s, v, a) {
  const ctx = document.getElementById("graficoGeral").getContext("2d");

  if (window["graficoGeral_chart"]) {
    window["graficoGeral_chart"].destroy();
  }

  window["graficoGeral_chart"] = new Chart(ctx, {
    type: "line",
    data: {
      labels: t,
      datasets: [
        {
          label: "s(t) - Posição",
          data: s,
          borderColor: "blue",
          borderWidth: 2,
          fill: false,
        },
        {
          label: "v(t) - Velocidade",
          data: v,
          borderColor: "green",
          borderWidth: 2,
          fill: false,
        },
        {
          label: "a(t) - Aceleração",
          data: a,
          borderColor: "red",
          borderWidth: 2,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        title: {
          display: true,
          text: "Gráfico de s(t), v(t) e a(t)"
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Tempo (t)" },
        },
        y: {
          title: { display: true, text: "Valor" },
        },
      },
    },
  });
}
