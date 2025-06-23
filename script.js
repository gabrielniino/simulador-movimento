function gerarGraficos() {
    const entrada = document.getElementById("funcao").value;
    const msgErroDiv = document.getElementById("msgErro");
    msgErroDiv.textContent = ""; // limpa mensagem anterior

    // Validar a função
    const validacao = validarFuncao(entrada);
    if (!validacao.valido) {
        msgErroDiv.textContent = validacao.mensagem;
        return; // interrompe processamento se inválida
    }

    let funcaoPosicao, funcaoVelocidade, funcaoAceleracao;

    try {
        funcaoPosicao = math.parse(entrada);
        funcaoVelocidade = math.derivative(funcaoPosicao, 't');
        funcaoAceleracao = math.derivative(funcaoVelocidade, 't');
    } catch (e) {
        // Este catch é para erros imprevistos
        msgErroDiv.textContent = "Erro inesperado ao processar a função.";
        return;
    }

    exibirExpressoes(funcaoPosicao, funcaoVelocidade, funcaoAceleracao);

    const intervalo = math.range(0, 10, 0.1, true).toArray().map(t => Math.round(t * 100) / 100);
    const valoresPosicao = intervalo.map(t => funcaoPosicao.evaluate({ t }));
    const valoresVelocidade = intervalo.map(t => funcaoVelocidade.evaluate({ t }));
    const valoresAceleracao = intervalo.map(t => funcaoAceleracao.evaluate({ t }));

    plotarGraficoGeral(intervalo, valoresPosicao, valoresVelocidade, valoresAceleracao);
    interpretarEExibir(intervalo, valoresPosicao, valoresVelocidade, valoresAceleracao);
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

function validarFuncao(entrada) {
    try {
        const expr = math.parse(entrada);

        // Verificar se só usa a variável t
        const variaveis = expr.filter(node => node.isSymbolNode).map(node => node.name);
        const varsUnicas = [...new Set(variaveis)];

        if (varsUnicas.length > 1 || (varsUnicas.length === 1 && varsUnicas[0] !== 't')) {
            return { valido: false, mensagem: "A função deve depender somente da variável 't'." };
        }

        // Testar derivadas para pegar erros mais específicos
        math.derivative(expr, 't'); // velocidade
        math.derivative(math.derivative(expr, 't'), 't'); // aceleração

        return { valido: true, mensagem: "" };
    } catch (e) {
        // Mensagem mais amigável e sugestões comuns
        let msg = "Erro ao interpretar a função.";

        if (/Unexpected end of expression/.test(e.message)) {
            msg = "Expressão incompleta. Verifique parênteses e operadores.";
        } else if (/Undefined symbol/.test(e.message)) {
            msg = "Símbolo indefinido detectado. Use somente 't' como variável.";
        } else if (/Parenthesis/.test(e.message)) {
            msg = "Erro de parênteses na expressão.";
        } else if (/Unexpected token/.test(e.message)) {
            msg = "Token inesperado. Verifique a sintaxe da função.";
        }

        msg += " Exemplo válido: t^3 - 6*t^2 + 9*t";

        return { valido: false, mensagem: msg };
    }
}

function interpretarEExibir(t, s, v, a) {
    const containerId = "interpretacao";
    let container = document.getElementById(containerId);

    if (!container) {
        container = document.createElement("div");
        container.id = containerId;
        container.style.marginTop = "30px";
        container.style.padding = "15px";
        container.style.backgroundColor = "#eef9f1";
        container.style.borderLeft = "5px solid #4CAF50";
        container.style.fontSize = "1.1em";
        container.style.lineHeight = "1.4em";
        document.querySelector(".container").appendChild(container);
    }

    // Função auxiliar para encontrar zeros aproximados de uma função (troca de sinal)
    function encontrarZeros(arr, t) {
        const zeros = [];
        for (let i = 1; i < arr.length; i++) {
            if (arr[i - 1] * arr[i] <= 0) {
                // Ponto entre t[i-1] e t[i] onde a função muda de sinal
                const zeroAprox = (t[i - 1] + t[i]) / 2;
                zeros.push(zeroAprox);
            }
        }
        return zeros;
    }

    // Zeros de v(t) - candidatos a máximos/mínimos
    const zerosV = encontrarZeros(v, t);

    // Zeros de a(t) - pontos de inflexão
    const zerosA = encontrarZeros(a, t);

    // Classificar máximos e mínimos pelo sinal da aceleração nesses zeros de v
    const maximos = [];
    const minimos = [];
    zerosV.forEach(z => {
        // índice mais próximo de z no vetor t
        const i = t.findIndex(time => time >= z);
        if (i !== -1) {
            if (a[i] < 0) maximos.push(z);
            else if (a[i] > 0) minimos.push(z);
        }
    });

    // Intervalos onde v é positivo e negativo (simplificado)
    const vPos = t.filter((_, i) => v[i] > 0);
    const vNeg = t.filter((_, i) => v[i] < 0);

    // Texto de interpretação
    let texto = `<h2>Interpretação dos resultados</h2>`;

    if (vPos.length) {
        texto += `<p>Velocidade positiva no intervalo aproximadamente de t = ${vPos[0].toFixed(2)} até t = ${vPos[vPos.length - 1].toFixed(2)}. O objeto está se movendo para frente nesse intervalo.</p>`;
    }

    if (vNeg.length) {
        texto += `<p>Velocidade negativa no intervalo aproximadamente de t = ${vNeg[0].toFixed(2)} até t = ${vNeg[vNeg.length - 1].toFixed(2)}. O objeto está se movendo para trás nesse intervalo.</p>`;
    }

    if (maximos.length) {
        texto += `<p>Máximos locais da posição em t ≈ ${maximos.map(x => x.toFixed(2)).join(", ")}.</p>`;
    }

    if (minimos.length) {
        texto += `<p>Mínimos locais da posição em t ≈ ${minimos.map(x => x.toFixed(2)).join(", ")}.</p>`;
    }

    if (zerosA.length) {
        texto += `<p>Aceleração muda de sinal (pontos de inflexão) em t ≈ ${zerosA.map(x => x.toFixed(2)).join(", ")}.</p>`;
    } else {
        texto += `<p>Não há mudanças de sinal na aceleração no intervalo analisado.</p>`;
    }

    texto += `<p>O comportamento geral do movimento pode ser interpretado a partir destes pontos e intervalos, observando quando o objeto acelera, desacelera e muda de direção.</p>`;

    container.innerHTML = texto;
}


